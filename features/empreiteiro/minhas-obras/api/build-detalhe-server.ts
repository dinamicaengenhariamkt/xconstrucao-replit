import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import {
  clientes,
  empreiteiras,
  financeiro,
  obraAditivos,
  obraAnexos,
  obraChecklistItens,
  obraChecklists,
  obraDiario,
  obraEquipe,
  obraEtapas,
  obraFotos,
  obraOcorrencias,
  obraTarefas,
  obras,
  userFiles,
  users,
} from "@shared/db/schema";
import { carregarMarcacoes, projetarChecklist } from "@features/obras/api/checklist-recorrencia";
import { mediaProgressoEtapas, resolverProgressoObra } from "@features/obras/api/progresso-obra";
import { createSignedReadUrl, publicUrlForKey } from "@shared/lib/storage";
import { formatDate } from "@shared/lib/formatters";
import type {
  MembroEquipe,
  MinhaObra,
  MinhaObraDetalhe,
  MinhaObraEtapa,
  MinhaObraTarefa,
  ObraAtividade,
  ObraDocumento,
  ObraFinanceiro,
  ObraFoto,
  ObraOcorrencia as ObraOcorrenciaUI,
  TimelineEvent,
} from "../types";
import { ladoDoLancamento } from "../lib/lado-lancamento";
import { listarIdsObrasPermitidas, resolverEmpresaDoUsuario } from "@features/xgestao/equipe/server/access";

type UiStatus =
  | "em_execucao"
  | "com_atrasos"
  | "com_pendencias"
  | "planejamento"
  | "finalizada";

const COLORS = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-rose-500", "bg-cyan-500"];

function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return COLORS[Math.abs(h) % COLORS.length];
}

function fmtBrDate(input: string | Date | null | undefined): string {
  if (!input) return "—";
  try {
    if (typeof input === "string") return formatDate(input) || input;
    if (Number.isNaN(input.getTime())) return "—";
    return formatDate(input.toISOString());
  } catch {
    return typeof input === "string" ? input : "—";
  }
}

function daysBetween(a: Date, b: Date): number {
  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function diasAtrasoFor(dataPrevisao: string | null | undefined, status: string): number {
  if (status === "concluida" || !dataPrevisao) return 0;
  const d = new Date(dataPrevisao);
  if (Number.isNaN(d.getTime())) return 0;
  const dd = daysBetween(new Date(), d);
  return dd > 0 ? dd : 0;
}

function mapStatus(
  dbStatus: string,
  diasAtraso: number,
  problemasAbertos: number,
): UiStatus {
  if (dbStatus === "concluida") return "finalizada";
  if (dbStatus === "planejamento") return "planejamento";
  if (dbStatus === "pausada") return "com_pendencias";
  // em_andamento
  if (diasAtraso > 0) return "com_atrasos";
  if (problemasAbertos > 0) return "com_pendencias";
  return "em_execucao";
}

function timelineRelativa(d: Date): string {
  // daysBetween(now, past) > 0 → past entries ficam positivos.
  const diff = daysBetween(new Date(), d);
  if (diff <= 0) return `Hoje, ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  if (diff === 1) return `Ontem, ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  if (diff < 7) return `Há ${diff} dias`;
  return formatDate(d.toISOString());
}

/** Lista obras vinculadas a um empreiteiro (via empreiteiras.userId). */
export async function listMinhasObrasReal(
  userId: string,
  options: { includeXgestao?: boolean } = {},
): Promise<MinhaObra[]> {
  const company = await resolverEmpresaDoUsuario(userId);
  const [ownerCompany] = company ? [] : await db
    .select({ empreiteiraId: empreiteiras.id, donoUserId: empreiteiras.userId })
    .from(empreiteiras)
    .where(eq(empreiteiras.userId, userId));
  const effectiveCompany = company ?? (ownerCompany?.donoUserId
    ? { ...ownerCompany, papel: "dono" as const }
    : null);
  if (!effectiveCompany) return [];
  const isMember = effectiveCompany.papel !== "dono";
  const allowedIds = isMember ? await listarIdsObrasPermitidas(userId, effectiveCompany.empreiteiraId) : null;
  if (allowedIds !== null && allowedIds.length === 0) return [];

  const rows = await db
    .select({
      o: obras,
      contratanteNome: users.name,
      contratanteEmail: users.email,
    })
    .from(obras)
    .leftJoin(clientes, eq(clientes.id, obras.clienteId))
    .leftJoin(users, eq(users.id, clientes.userId))
    .where(and(
      eq(obras.empreiteiraId, effectiveCompany.empreiteiraId),
      ...(isMember ? [isNull(obras.clienteId)] : []),
      ...(allowedIds !== null ? [inArray(obras.id, allowedIds)] : []),
    ))
    .orderBy(desc(obras.createdAt));

  // Resolver problemas abertos por obra (em lote).
  const obraIds = rows.map((r) => r.o.id);
  const problemMap = new Map<string, number>();
  if (obraIds.length > 0) {
    const probs = await db
      .select({
        obraId: obraOcorrencias.obraId,
        n: sql<number>`count(*)::int`,
      })
      .from(obraOcorrencias)
      .where(and(inArray(obraOcorrencias.obraId, obraIds), eq(obraOcorrencias.status, "aberta")))
      .groupBy(obraOcorrencias.obraId);
    for (const p of probs) problemMap.set(p.obraId, Number(p.n));
  }

  /**
   * XG27 — média das etapas por obra, em lote.
   *
   * Na obra própria é daqui que sai o avanço: `obras.progresso` não tem
   * escritor desde a XG23, e era ela que o dashboard lia ao mostrar 0% para
   * obra em andamento. Uma query por LISTA, no mesmo padrão do `problemMap`
   * acima — trazer as etapas de todas as obras para somar em JS seria
   * desperdício, e por obra seria N+1.
   *
   * `obra_etapas.progresso` é NOT NULL DEFAULT 0, então não há nulo dentro do
   * AVG. Obra sem etapa simplesmente não aparece no `groupBy` — e essa
   * ausência é o sinal que vira `progressoDisponivel: false`.
   */
  const mediaEtapasMap = new Map<string, number>();
  if (obraIds.length > 0) {
    const medias = await db
      .select({
        obraId: obraEtapas.obraId,
        media: sql<number>`ROUND(AVG(${obraEtapas.progresso}))::int`,
      })
      .from(obraEtapas)
      .where(inArray(obraEtapas.obraId, obraIds))
      .groupBy(obraEtapas.obraId);
    for (const m of medias) mediaEtapasMap.set(m.obraId, Number(m.media));
  }

  /**
   * XG27 — custo real por obra, em lote.
   *
   * Mesma regra que a XG22 validou no detalhe (saída paga onde o dono é o
   * pagador), agora agregada no Postgres. **Não** usa `obras.valor_pago`, que
   * no xgestão nunca é escrita — foi o que levou a XG22 a derivar o saldo dos
   * lançamentos.
   *
   * Sem o fallback de legado que o detalhe tem: lá ele classifica lançamento
   * órfão como *receita*, e reusá-lo aqui inverteria o sinal. Verificado no
   * banco de dev antes de escrever isto: nas obras próprias, as 40 saídas
   * pagas têm `pagador_user_id` e as 33 entradas não têm — nenhuma saída
   * órfã para recuperar.
   */
  const custoMap = new Map<string, number>();
  if (obraIds.length > 0) {
    const custos = await db
      .select({
        obraId: financeiro.obraId,
        total: sql<string>`COALESCE(SUM(${financeiro.valor}), 0)`,
      })
      .from(financeiro)
      .where(
        and(
          inArray(financeiro.obraId, obraIds),
          eq(financeiro.status, "pago"),
          eq(financeiro.escopo, "obra"),
           eq(financeiro.pagadorUserId, effectiveCompany.donoUserId ?? userId),
        ),
      )
      .groupBy(financeiro.obraId);
    for (const c of custos) if (c.obraId) custoMap.set(c.obraId, Number(c.total));
  }

  const capaIds = rows
    .map((row) => row.o.fotoCapaFileId)
    .filter((id): id is string => Boolean(id));
  const capaUrlMap = new Map<string, string>();
  if (capaIds.length > 0) {
    const capas = await db
      .select({
        id: userFiles.id,
        bucketKey: userFiles.bucketKey,
        visibility: userFiles.visibility,
        publicUrl: userFiles.publicUrl,
        originalName: userFiles.originalName,
      })
      .from(userFiles)
      .where(and(inArray(userFiles.id, capaIds), isNull(userFiles.deletedAt)));
    await Promise.all(capas.map(async (capa) => {
      capaUrlMap.set(capa.id, await resolveSignedFotoUrl(capa));
    }));
  }

  return rows
    .filter((r) => options.includeXgestao !== false || r.o.clienteId !== null)
    .map((r) => {
    const o = r.o;
    const dias = diasAtrasoFor(o.dataPrevisao, o.status);
    const problemas = problemMap.get(o.id) ?? 0;
    const status = mapStatus(o.status, dias, problemas);
    const temContratante = Boolean(o.clienteId);
    const contratanteNome = r.contratanteNome ?? "Contratante";
    const enderecoFull = [o.endereco, o.cidade && o.uf ? `${o.cidade}, ${o.uf}` : null]
      .filter(Boolean)
      .join(" - ");
    // XG27 — na obra própria o avanço vem das etapas; no marketplace, da
    // coluna. `null` significa "não há cronograma", não "não avançou".
    const progressoResolvido = resolverProgressoObra({
      clienteId: o.clienteId,
      progressoColuna: o.progresso,
      mediaEtapas: mediaEtapasMap.get(o.id) ?? null,
    });
    const orcamento = Number(o.valorTotal ?? 0);
    const custoReal = custoMap.get(o.id) ?? 0;
    return {
      id: o.id,
      titulo: o.nome,
      endereco: enderecoFull || o.endereco,
      imagemUrl: o.fotoCapaFileId ? (capaUrlMap.get(o.fotoCapaFileId) ?? "") : "",
      status,
      progresso: progressoResolvido ?? 0,
      progressoDisponivel: progressoResolvido !== null,
      orcamento,
      diasAtraso: dias,
      custoReal,
      // Sem orçamento não há denominador: `null` em vez de um 0% que pareceria
      // folga total.
      consumoOrcamento: orcamento > 0 ? Math.round((custoReal / orcamento) * 100) : null,
      ocorrenciasAbertas: problemas,
      // XG28 — o estado que o dono escolheu, cru do enum. Já estava em memória
      // (`o: obras` traz a linha inteira): nenhuma query nova.
      statusObra: o.status,
      dataInicio: fmtBrDate(o.dataInicio),
      dataPrevisaoFim: fmtBrDate(o.dataPrevisao),
      contratante: {
        nome: contratanteNome,
        iniciais: initialsOf(contratanteNome),
        cor: colorFor(contratanteNome),
        email: r.contratanteEmail ?? undefined,
      },
      temContratante,
      isObraPropria: !temContratante,
      tipo: o.tipo ?? "Obra",
    };
    });
}

async function resolveSignedFotoUrl(file: {
  bucketKey: string;
  visibility: string | null;
  publicUrl: string | null;
  originalName: string | null;
}): Promise<string> {
  if (file.visibility === "public") {
    return file.publicUrl ?? publicUrlForKey(file.bucketKey);
  }
  try {
    const u = await createSignedReadUrl({ key: file.bucketKey, filename: file.originalName ?? undefined });
    return u ?? "";
  } catch {
    return "";
  }
}

/**
 * Compõe `MinhaObraDetalhe` a partir das tabelas reais.
 * Tarefas, checklists e equipe vêm das tabelas reais (Task #76).
 * Etapas continuam expostas como blocos de escopo (J06) e ganham a lista
 * de tarefas associadas via `obra_tarefas.etapa_id`.
 */
export async function buildMinhaObraDetalheReal(
  obraId: string,
): Promise<MinhaObraDetalhe | null> {
  const [obra] = await db.select().from(obras).where(eq(obras.id, obraId));
  if (!obra) return null;

  // Contratante (via clientes → users).
  const temContratante = Boolean(obra.clienteId);
  let contratanteNome = "Contratante";
  let contratanteEmail: string | undefined;
  let contratanteTelefone: string | undefined;
  let contratanteAvatarUrl: string | undefined;
  if (obra.clienteId) {
    const [cli] = await db
      .select({ name: users.name, email: users.email, telefone: clientes.telefone, userImage: users.image, clienteAvatarUrl: clientes.avatarUrl })
      .from(clientes)
      .leftJoin(users, eq(users.id, clientes.userId))
      .where(eq(clientes.id, obra.clienteId));
    if (cli?.name) contratanteNome = cli.name;
    if (cli?.email) contratanteEmail = cli.email;
    if (cli?.telefone) contratanteTelefone = cli.telefone ?? undefined;
    if (cli) contratanteAvatarUrl = cli.userImage ?? cli.clienteAvatarUrl ?? undefined;
  }

  // Empreiteira atribuída (pra equipe + responsável).
  let empreiteiraRow:
    | {
        id: string;
        nome: string;
        responsavel: string;
        email: string;
        telefone: string | null;
        tamanhoEquipe: string | null;
        registroProfissional: string | null;
        userId: string | null;
      }
    | undefined;
  if (obra.empreiteiraId) {
    const [emp] = await db
      .select({
        id: empreiteiras.id,
        nome: empreiteiras.nome,
        responsavel: empreiteiras.responsavel,
        email: empreiteiras.email,
        telefone: empreiteiras.telefone,
        tamanhoEquipe: empreiteiras.tamanhoEquipe,
        registroProfissional: empreiteiras.registroProfissional,
        userId: empreiteiras.userId,
      })
      .from(empreiteiras)
      .where(eq(empreiteiras.id, obra.empreiteiraId));
    if (emp) empreiteiraRow = emp;
  }

  // Etapas → viram tanto MinhaObraEtapa quanto ObraAtividade (cronograma).
  const etapasRows = await db
    .select()
    .from(obraEtapas)
    .where(eq(obraEtapas.obraId, obraId))
    .orderBy(asc(obraEtapas.ordem), asc(obraEtapas.createdAt));

  // Tarefas reais (Task #76).
  const tarefasRows = await db
    .select()
    .from(obraTarefas)
    .where(eq(obraTarefas.obraId, obraId))
    .orderBy(asc(obraTarefas.createdAt));

  const tarefas: MinhaObraTarefa[] = tarefasRows.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    etapa: t.etapa || "Sem etapa",
    etapaId: t.etapaId,
    responsavel: t.responsavel || (empreiteiraRow?.responsavel ?? "—"),
    prazo: t.prazo || "—",
    status: t.status,
    prioridade: t.prioridade,
    progresso: t.progresso ?? undefined,
    bloqueioMotivo: t.bloqueioMotivo ?? undefined,
    bloqueioInfo: t.bloqueioInfo ?? undefined,
    descricao: t.descricao ?? undefined,
  }));

  const tarefasPorEtapaId = new Map<string, { id: string; titulo: string; concluida: boolean }[]>();
  for (const t of tarefasRows) {
    if (!t.etapaId) continue;
    const arr = tarefasPorEtapaId.get(t.etapaId) ?? [];
    arr.push({ id: t.id, titulo: t.titulo, concluida: t.status === "concluido" });
    tarefasPorEtapaId.set(t.etapaId, arr);
  }

  const etapas: MinhaObraEtapa[] = etapasRows.map((e) => ({
    id: e.id,
    nome: e.nome,
    progresso: e.progresso ?? 0,
    tarefas: tarefasPorEtapaId.get(e.id) ?? [],
  }));

  const tarefasTotal = tarefas.length;
  // Tudo que ainda não fechou. É o número que o score de saúde usa.
  const tarefasPendentes = tarefas.filter((t) => t.status !== "concluido").length;
  // XG10 — o card dizia "Tarefas Pendentes" mostrando este total, então tarefa
  // em execução aparecia como pendência ("eu tô executando, ele coloca como
  // tarefa pendente", 25:39). Separar dá ao card o número que ele promete.
  const tarefasEmAndamento = tarefas.filter((t) => t.status === "em_andamento").length;

  const atividades: ObraAtividade[] = etapasRows.map((e) => {
    const statusMap: Record<string, ObraAtividade["status"]> = {
      pendente: "pendente",
      em_andamento: "em_andamento",
      bloqueado: "atrasado",
      concluido: "concluido",
    };
    return {
      id: e.id,
      nome: e.nome,
      responsavel: e.responsavel ?? "—",
      inicio: fmtBrDate(e.createdAt),
      fim: fmtBrDate(e.prazo),
      progresso: e.progresso ?? 0,
      status: statusMap[e.status] ?? "pendente",
      descricao: e.descricao ?? undefined,
    };
  });

  // Ocorrências.
  const ocorrenciasRows = await db
    .select({
      o: obraOcorrencias,
      autorName: users.name,
    })
    .from(obraOcorrencias)
    .leftJoin(users, eq(users.id, obraOcorrencias.autorId))
    .where(eq(obraOcorrencias.obraId, obraId))
    .orderBy(desc(obraOcorrencias.createdAt));

  const ocorrencias: ObraOcorrenciaUI[] = ocorrenciasRows.map((row) => ({
    id: row.o.id,
    titulo: row.o.titulo,
    descricao: row.o.descricao,
    severidade: row.o.gravidade,
    status: row.o.status === "aberta" ? "aberto" : "resolvido",
    responsavel: row.autorName ?? "—",
    dataAbertura: fmtBrDate(row.o.createdAt),
    resolvidoEm: row.o.resolvidoEm ? fmtBrDate(row.o.resolvidoEm) : undefined,
  }));

  const abertas = ocorrencias.filter((o) => o.status === "aberto");
  const problemasAbertos = abertas.length;
  // XG10 — o card exibia "1 crítico, 2 médios" fixo no JSX, independente do
  // que havia na obra. Aqui vai a contagem real.
  const problemasPorGravidade = {
    critico: abertas.filter((o) => o.severidade === "critico").length,
    medio: abertas.filter((o) => o.severidade === "medio").length,
    baixo: abertas.filter((o) => o.severidade === "baixo").length,
  };

  // Diário → timeline.
  const diarioRows = await db
    .select({
      d: obraDiario,
      autorName: users.name,
    })
    .from(obraDiario)
    .leftJoin(users, eq(users.id, obraDiario.autorId))
    .where(eq(obraDiario.obraId, obraId))
    .orderBy(desc(obraDiario.createdAt))
    .limit(30);

  const timeline: TimelineEvent[] = diarioRows.map((row) => ({
    id: row.d.id,
    tipo: "nota",
    titulo: "Anotação no diário",
    descricao: row.d.texto,
    autor: row.autorName ?? "—",
    data: timelineRelativa(row.d.createdAt as Date),
  }));

  // Fotos (via obraFotos + userFiles).
  const fotosRows = await db
    .select({
      f: obraFotos,
      bucketKey: userFiles.bucketKey,
      visibility: userFiles.visibility,
      publicUrl: userFiles.publicUrl,
      originalName: userFiles.originalName,
    })
    .from(obraFotos)
    .innerJoin(userFiles, eq(userFiles.id, obraFotos.fileId))
    .where(and(eq(obraFotos.obraId, obraId), isNull(userFiles.deletedAt)))
    .orderBy(desc(obraFotos.createdAt));

  const fotos: ObraFoto[] = await Promise.all(
    fotosRows.map(async (row) => ({
      id: row.f.id,
      fileId: row.f.fileId,
      url: await resolveSignedFotoUrl({
        bucketKey: row.bucketKey,
        visibility: row.visibility,
        publicUrl: row.publicUrl,
        originalName: row.originalName,
      }),
      data: fmtBrDate(row.f.createdAt),
      tag: row.f.tag ?? undefined,
      fase: row.f.fase ?? undefined,
      enviadaAoContratante: row.f.enviadaAoContratante,
    })),
  );

  // A capa é uma referência explícita da obra e não necessariamente a foto
  // mais recente. Mantém o hero consistente depois da edição no xgestão.
  let capaUrl = fotos[0]?.url ?? "";
  if (obra.fotoCapaFileId) {
    const [capa] = await db
      .select({
        bucketKey: userFiles.bucketKey,
        visibility: userFiles.visibility,
        publicUrl: userFiles.publicUrl,
        originalName: userFiles.originalName,
      })
      .from(userFiles)
      .where(and(eq(userFiles.id, obra.fotoCapaFileId), isNull(userFiles.deletedAt)))
      .limit(1);
    if (capa) {
      capaUrl = await resolveSignedFotoUrl(capa);
    }
  }

  // Documentos (anexos).
  // XG10 — LEFT join: o anexo pode ser um link externo, sem arquivo no bucket.
  const anexosRows = (
    await db
      .select({
        a: obraAnexos,
        bucketKey: userFiles.bucketKey,
        visibility: userFiles.visibility,
        publicUrl: userFiles.publicUrl,
        originalName: userFiles.originalName,
        sizeBytes: userFiles.sizeBytes,
        mime: userFiles.mime,
        deletedAt: userFiles.deletedAt,
      })
      .from(obraAnexos)
      .leftJoin(userFiles, eq(userFiles.id, obraAnexos.fileId))
      .where(eq(obraAnexos.obraId, obraId))
      .orderBy(desc(obraAnexos.createdAt))
  ).filter((row) => row.a.linkUrl !== null || (row.bucketKey !== null && row.deletedAt === null));

  const tipoToCategoria: Record<string, ObraDocumento["categoria"]> = {
    projeto_arquitetonico: "planta",
    projeto_estrutural: "planta",
    art_rrt: "art_rrt",
    alvara: "alvara",
    foto_local: "foto",
    contrato: "contrato",
    outros: "outros",
  };

  const documentos: ObraDocumento[] = await Promise.all(
    anexosRows.map(async (row) => ({
      id: row.a.id,
      nome: row.a.titulo ?? row.originalName ?? "Documento",
      categoria: tipoToCategoria[row.a.tipo] ?? "outros",
      tamanho: row.sizeBytes ? `${(Number(row.sizeBytes) / 1024 / 1024).toFixed(1)} MB` : undefined,
      data: fmtBrDate(row.a.createdAt),
      observacoes: row.a.observacao ?? undefined,
      // XG10 — `mime` e `isLink` alimentam o preview: PDF e imagem abrem
      // embutidos, link vai direto para a origem (Drive, etc).
      mime: row.mime ?? undefined,
      isLink: row.a.linkUrl !== null,
      url: row.a.linkUrl
        ? row.a.linkUrl
        : await resolveSignedFotoUrl({
            bucketKey: row.bucketKey!,
            visibility: row.visibility!,
            publicUrl: row.publicUrl,
            originalName: row.originalName,
          }),
    })),
  );

  // Financeiro real: lançamentos da obra (entradas pro empreiteiro).
  const finRows = await db
    .select()
    .from(financeiro)
    .where(eq(financeiro.obraId, obraId))
    .orderBy(asc(financeiro.data));

  // Receita real (entradas pagas onde o empreiteiro é recebedor) e custo real
  // (saídas pagas onde o empreiteiro é pagador — materiais, mão de obra,
  // equipamentos). Cobre legados: quando `recebedorUserId` é null mas a obra
  // está atribuída à empreiteira do usuário, conta como entrada.
  //
  // XG22 — este loop subiu para ANTES do bloco de contrato porque o saldo a
  // receber agora deriva dele. Ver a nota sobre `valor_pago` logo abaixo.
  const empreiteiroUserId = empreiteiraRow?.userId ?? null;
  let receitaTotal = 0;
  let custoTotal = 0;
  for (const f of finRows) {
    if (f.status !== "pago") continue;
    // XG30 — regra compartilhada com o link público (`lado-lancamento.ts`).
    const lado = ladoDoLancamento(f, empreiteiroUserId);
    if (lado === "receita") receitaTotal += Number(f.valor ?? 0);
    else if (lado === "custo") custoTotal += Number(f.valor ?? 0);
  }

  const valorContratado = Number(obra.valorTotal ?? 0);
  // XG10 — soma real dos aditivos (antes era `0` fixo, com o card já na tela).
  const [aditivosAgg] = await db
    .select({ total: sql<string>`COALESCE(SUM(${obraAditivos.valor}), 0)` })
    .from(obraAditivos)
    .where(eq(obraAditivos.obraId, obraId));
  const aditivos = Number(aditivosAgg?.total ?? 0);
  const valorTotal = valorContratado + aditivos;

  /**
   * XG22 — o recebido vem dos lançamentos, NÃO de `obras.valor_pago`.
   *
   * Relato do cliente: "não está entrando ali com pagamentos, não está
   * subtraindo quanto que falta receber". A tela mostrava "Receita total
   * R$ 191.000" e, logo acima, "Saldo a receber R$ 437.000" (o total cheio) com
   * 0% recebido — dois blocos discordando sobre o mesmo dinheiro.
   *
   * A causa: `obras.valor_pago` é escrita só por `quitarLancamento` e pelo
   * webhook de split, ambos do marketplace. No xgestão o lançamento já nasce
   * `status:"pago"`, então nada nunca preenchia a coluna (no banco de dev: 1 de
   * 519 obras com valor > 0).
   *
   * Não materializamos a coluna de propósito. O SQL de recompute que existe
   * (features/financeiro/lancamentos-service.ts) filtra `tipo = 'saida'`, que no
   * marketplace é saída do contratante (= entrada nossa) mas no xgestão é CUSTO:
   * reusá-lo somaria as despesas como se fossem recebimento. Derivar na leitura
   * é imune a essa ambiguidade e mantém este card coerente, por construção, com
   * o "Resultado da obra" logo abaixo — que sai do mesmo `receitaTotal`.
   */
  const valorPagoNum = receitaTotal;
  const saldoReceber = Math.max(0, valorTotal - valorPagoNum);
  const percentualRecebido = valorTotal > 0 ? Math.round((valorPagoNum / valorTotal) * 100) : 0;
  /**
   * XG27 — mesma regra da lista, sem query nova: `etapasRows` já está em
   * memória. Sem isto, o "Percentual executado" da aba Financeiro mostrava 0%
   * na obra própria pelo mesmo motivo que o dashboard mostrava.
   *
   * A política (qual fonte, o que fazer sem etapa) mora em
   * `resolverProgressoObra`; aqui só muda como a média é somada — em JS
   * porque os dados já estão carregados, contra o `AVG` do Postgres na lista,
   * onde são muitas obras.
   */
  const progressoResolvido = resolverProgressoObra({
    clienteId: obra.clienteId,
    progressoColuna: obra.progresso,
    mediaEtapas: mediaProgressoEtapas(etapasRows),
  });
  const progresso = progressoResolvido ?? 0;

  const financeiroOut: ObraFinanceiro = {
    valorContratado,
    aditivos,
    valorTotal,
    saldoReceber,
    percentualRecebido,
    percentualExecutado: progresso,
    receitaTotal,
    custoTotal,
    // Preenchido logo abaixo, quando a equipe é carregada.
    custoPrevistoEquipe: 0,
    medicoes: finRows.map((f, i) => ({
      id: f.id,
      numero: i + 1,
      data: f.data,
      valor: Number(f.valor ?? 0),
      status:
        f.status === "pago"
          ? "aprovada"
          : f.status === "cancelado"
            ? "rejeitada"
            : "aguardando",
    })),
  };

  // Equipe = membros reais da tabela `obra_equipe` (Task #76) +
  // membros derivados (contratante + responsável da empreiteira) como
  // entradas virtuais sempre presentes pra dar contexto.
  // XG22 — o join traz o arquivo do contrato junto: sem ele a tela teria de
  // pedir uma URL por prestador, um N+1 na abertura da obra.
  const equipeJoin = await db
    .select({
      m: obraEquipe,
      bucketKey: userFiles.bucketKey,
      visibility: userFiles.visibility,
      publicUrl: userFiles.publicUrl,
      originalName: userFiles.originalName,
    })
    .from(obraEquipe)
    .leftJoin(userFiles, eq(userFiles.id, obraEquipe.contratoFileId))
    .where(eq(obraEquipe.obraId, obraId))
    .orderBy(asc(obraEquipe.createdAt));
  const equipeRows = equipeJoin.map((r) => r.m);

  /**
   * XG22 — a prévia de gasto: "ele soma todos os valores de contrato com os
   * prestadores que eu cadastrei, ele vai ter uma prévia de quando eu vou gastar
   * na obra".
   *
   * Sai de `equipeRows` (linhas do banco) e não do array `equipe`, que inclui o
   * contratante e a empreiteira como entradas virtuais — essas não têm linha na
   * tabela, logo nunca têm contrato. Inativos ficam de fora: quem saiu da obra
   * não deve continuar pesando no custo previsto.
   */
  financeiroOut.custoPrevistoEquipe = equipeRows.reduce(
    (soma, m) => (m.ativo && m.valorContrato != null ? soma + Number(m.valorContrato) : soma),
    0,
  );

  const equipe: MembroEquipe[] = [];
  if (temContratante) {
    equipe.push({
      id: `contratante-${obra.clienteId}`,
      nome: contratanteNome,
      iniciais: initialsOf(contratanteNome),
      cor: colorFor(contratanteNome),
      papel: "Contratante",
      tipo: "contratante",
      telefone: contratanteTelefone,
      email: contratanteEmail,
      ativo: true,
      permissao: "admin",
    });
  }
  if (empreiteiraRow) {
    equipe.push({
      id: `empreiteira-${empreiteiraRow.id}`,
      nome: empreiteiraRow.responsavel || empreiteiraRow.nome,
      iniciais: initialsOf(empreiteiraRow.responsavel || empreiteiraRow.nome),
      cor: colorFor(empreiteiraRow.nome),
      papel: empreiteiraRow.tamanhoEquipe
        ? `Empreiteira (${empreiteiraRow.tamanhoEquipe})`
        : "Empreiteira responsável",
      tipo: "mestre",
      telefone: empreiteiraRow.telefone ?? undefined,
      email: empreiteiraRow.email,
      registro: empreiteiraRow.registroProfissional ?? undefined,
      ativo: true,
      permissao: "editar",
    });
  }
  for (const linha of equipeJoin) {
    const m = linha.m;
    // Link externo abre direto; arquivo precisa de URL assinada (o contrato é
    // privado, como todo `obra_anexo`).
    const contratoUrl = m.contratoLinkUrl
      ? m.contratoLinkUrl
      : linha.bucketKey
        ? await resolveSignedFotoUrl({
            bucketKey: linha.bucketKey,
            visibility: linha.visibility,
            publicUrl: linha.publicUrl,
            originalName: linha.originalName,
          })
        : undefined;
    equipe.push({
      id: m.id,
      nome: m.nome,
      iniciais: initialsOf(m.nome),
      cor: m.cor || colorFor(m.nome),
      papel: m.papel || "—",
      tipo: m.tipo,
      telefone: m.telefone ?? undefined,
      email: m.email ?? undefined,
      registro: m.registro ?? undefined,
      membros: m.membros ?? undefined,
      ativo: m.ativo,
      permissao: m.permissao ?? undefined,
      pixChave: m.pixChave ?? undefined,
      valorContrato: m.valorContrato == null ? undefined : Number(m.valorContrato),
      contratoFileId: m.contratoFileId ?? undefined,
      contratoLinkUrl: m.contratoLinkUrl ?? undefined,
      contratoUrl: contratoUrl || undefined,
      contratoNome: m.contratoLinkUrl
        ? "Contrato (link)"
        : (linha.originalName ?? undefined),
    });
  }

  // Checklists reais.
  const checklistsRows = await db
    .select()
    .from(obraChecklists)
    .where(eq(obraChecklists.obraId, obraId))
    .orderBy(asc(obraChecklists.createdAt));
  const checklistIds = checklistsRows.map((c) => c.id);
  const checklistItensRows =
    checklistIds.length > 0
      ? await db
          .select()
          .from(obraChecklistItens)
          .where(inArray(obraChecklistItens.checklistId, checklistIds))
          .orderBy(asc(obraChecklistItens.ordem), asc(obraChecklistItens.createdAt))
      : [];
  const itensByChecklist = new Map<
    string,
    { id: string; checklistId: string; titulo: string; concluida: boolean; ordem: number }[]
  >();
  for (const it of checklistItensRows) {
    const arr = itensByChecklist.get(it.checklistId) ?? [];
    // `ordem` viaja junto porque é a âncora das marcações por período (XG21).
    arr.push({
      id: it.id,
      checklistId: it.checklistId,
      titulo: it.titulo,
      concluida: it.concluida,
      ordem: it.ordem,
    });
    itensByChecklist.set(it.checklistId, arr);
  }
  // XG21 — esta é a projeção que a tela do empreiteiro realmente consome, então
  // ela precisa enxergar o período corrente igual à API REST.
  const marcacoesChecklist = await carregarMarcacoes(checklistsRows);
  const checklists = checklistsRows.map((c) => {
    const projetado = projetarChecklist(c, itensByChecklist.get(c.id) ?? [], marcacoesChecklist);
    const itens = projetado.itens.map((i) => ({
      id: i.id,
      titulo: i.titulo,
      concluida: i.concluida,
    }));
    const concluidos = itens.filter((i) => i.concluida).length;
    const total = itens.length;
    const progresso = total > 0 ? Math.round((concluidos / total) * 100) : 0;
    return {
      id: c.id,
      nome: c.nome,
      descricao: c.descricao,
      tipo: c.tipo,
      status: projetado.status as typeof c.status,
      itens,
      completadoEm: projetado.completadoEm ?? undefined,
      progresso,
      assinadoPor: c.assinadoPor ?? undefined,
      assinadoEm: c.assinadoEm ?? undefined,
      registroProfissional: c.registroProfissional ?? undefined,
      recorrencia: c.recorrencia,
      recorrenciaDiaSemana: c.recorrenciaDiaSemana ?? undefined,
      pendenteNoPeriodo: projetado.pendenteNoPeriodo,
    };
  });

  const dias = diasAtrasoFor(obra.dataPrevisao, obra.status);
  const status = mapStatus(obra.status, dias, problemasAbertos);
  const enderecoFull = [obra.endereco, obra.cidade && obra.uf ? `${obra.cidade}, ${obra.uf}` : null]
    .filter(Boolean)
    .join(" - ");

  return {
    id: obra.id,
    titulo: obra.nome,
    endereco: enderecoFull || obra.endereco,
    imagemUrl: capaUrl,
    status,
    // Status cru do banco. `status` acima é o derivado da UI do marketplace,
    // que colapsa `pausada` em `com_pendencias` e sobrepõe atraso ao valor
    // escolhido — na obra própria do xgestão isso lê como "não salvou".
    statusObra: obra.status,
    descricao: obra.descricao ?? undefined,
    areaM2: obra.areaM2 ?? undefined,
    progresso,
    progressoDisponivel: progressoResolvido !== null,
    orcamento: valorTotal,
    // XG27 — os mesmos indicadores da lista, para o detalhe não divergir dela.
    // `custoTotal` aqui é o equivalente do `custoReal` agregado na listagem:
    // as duas leituras varrem os mesmos lançamentos.
    custoReal: custoTotal,
    consumoOrcamento: valorTotal > 0 ? Math.round((custoTotal / valorTotal) * 100) : null,
    ocorrenciasAbertas: problemasAbertos,
    dataInicio: fmtBrDate(obra.dataInicio),
    dataPrevisaoFim: fmtBrDate(obra.dataPrevisao),
    contratante: {
      nome: contratanteNome,
      iniciais: initialsOf(contratanteNome),
      cor: colorFor(contratanteNome),
      email: contratanteEmail,
      avatarUrl: contratanteAvatarUrl,
    },
    temContratante,
    isObraPropria: !temContratante,
    tipo: obra.tipo ?? "Obra",
    valorPago: valorPagoNum,
    aReceber: saldoReceber,
    diasAtraso: dias,
    tarefasPendentes,
    tarefasEmAndamento,
    tarefasTotal,
    problemasAbertos,
    problemasPorGravidade,
    equipeAtiva: equipe.length,
    etapas,
    tarefas,
    timeline,
    fotos,
    checklists,
    documentos,
    atividades,
    ocorrencias,
    financeiro: financeiroOut,
    equipe,
    // Qualquer campo de endereço preenchido já justifica o card. Antes exigia
    // cidade ou UF, então quem preenchesse só número/complemento/CEP salvava o
    // dado e não o via em lugar nenhum.
    localizacao:
      obra.cidade || obra.uf || obra.endereco || obra.numero || obra.complemento || obra.cep
        ? {
            cidade: obra.cidade ?? "",
            estado: obra.uf ?? "",
            bairro: "",
            rua: obra.endereco,
            numero: obra.numero ?? undefined,
            complemento: obra.complemento ?? undefined,
            cep: obra.cep ?? "",
          }
        : undefined,
  };
}
