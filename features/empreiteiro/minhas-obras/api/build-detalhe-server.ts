import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import {
  clientes,
  empreiteiras,
  financeiro,
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
import { createSignedReadUrl, publicUrlForKey } from "@shared/lib/storage";
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
    const d = typeof input === "string" ? new Date(input) : input;
    if (Number.isNaN(d.getTime())) return typeof input === "string" ? input : "—";
    return d.toLocaleDateString("pt-BR");
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
  return d.toLocaleDateString("pt-BR");
}

/** Lista obras vinculadas a um empreiteiro (via empreiteiras.userId). */
export async function listMinhasObrasReal(userId: string): Promise<MinhaObra[]> {
  const [emp] = await db
    .select({ id: empreiteiras.id })
    .from(empreiteiras)
    .where(eq(empreiteiras.userId, userId));
  if (!emp) return [];

  const rows = await db
    .select({
      o: obras,
      contratanteNome: users.name,
      contratanteEmail: users.email,
    })
    .from(obras)
    .leftJoin(clientes, eq(clientes.id, obras.clienteId))
    .leftJoin(users, eq(users.id, clientes.userId))
    .where(eq(obras.empreiteiraId, emp.id))
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

  return rows.map((r) => {
    const o = r.o;
    const dias = diasAtrasoFor(o.dataPrevisao, o.status);
    const problemas = problemMap.get(o.id) ?? 0;
    const status = mapStatus(o.status, dias, problemas);
    const contratanteNome = r.contratanteNome ?? "Contratante";
    const enderecoFull = [o.endereco, o.cidade && o.uf ? `${o.cidade}, ${o.uf}` : null]
      .filter(Boolean)
      .join(" - ");
    return {
      id: o.id,
      titulo: o.nome,
      endereco: enderecoFull || o.endereco,
      imagemUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600",
      status,
      progresso: o.progresso ?? 0,
      orcamento: Number(o.valorTotal ?? 0),
      dataInicio: fmtBrDate(o.dataInicio),
      dataPrevisaoFim: fmtBrDate(o.dataPrevisao),
      contratante: {
        nome: contratanteNome,
        iniciais: initialsOf(contratanteNome),
        cor: colorFor(contratanteNome),
        email: r.contratanteEmail ?? undefined,
      },
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
  let contratanteNome = "Contratante";
  let contratanteEmail: string | undefined;
  let contratanteTelefone: string | undefined;
  if (obra.clienteId) {
    const [cli] = await db
      .select({ name: users.name, email: users.email, telefone: clientes.telefone })
      .from(clientes)
      .leftJoin(users, eq(users.id, clientes.userId))
      .where(eq(clientes.id, obra.clienteId));
    if (cli?.name) contratanteNome = cli.name;
    if (cli?.email) contratanteEmail = cli.email;
    if (cli?.telefone) contratanteTelefone = cli.telefone ?? undefined;
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
  const tarefasPendentes = tarefas.filter((t) => t.status !== "concluido").length;

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

  const problemasAbertos = ocorrencias.filter((o) => o.status === "aberto").length;

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

  // Documentos (anexos).
  const anexosRows = await db
    .select({
      a: obraAnexos,
      bucketKey: userFiles.bucketKey,
      visibility: userFiles.visibility,
      publicUrl: userFiles.publicUrl,
      originalName: userFiles.originalName,
      sizeBytes: userFiles.sizeBytes,
    })
    .from(obraAnexos)
    .innerJoin(userFiles, eq(userFiles.id, obraAnexos.fileId))
    .where(and(eq(obraAnexos.obraId, obraId), isNull(userFiles.deletedAt)))
    .orderBy(desc(obraAnexos.createdAt));

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
      nome: row.originalName ?? "Documento",
      categoria: tipoToCategoria[row.a.tipo] ?? "outros",
      tamanho: row.sizeBytes ? `${(Number(row.sizeBytes) / 1024 / 1024).toFixed(1)} MB` : undefined,
      data: fmtBrDate(row.a.createdAt),
      observacoes: row.a.observacao ?? undefined,
      url: await resolveSignedFotoUrl({
        bucketKey: row.bucketKey,
        visibility: row.visibility,
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

  const valorContratado = Number(obra.valorTotal ?? 0);
  const valorPagoNum = Number(obra.valorPago ?? 0);
  const aditivos = 0;
  const valorTotal = valorContratado + aditivos;
  const saldoReceber = Math.max(0, valorTotal - valorPagoNum);
  const percentualRecebido = valorTotal > 0 ? Math.round((valorPagoNum / valorTotal) * 100) : 0;
  const progresso = obra.progresso ?? 0;

  // Receita real (entradas pagas onde o empreiteiro é recebedor) e custo real
  // (saídas pagas onde o empreiteiro é pagador — materiais, mão de obra,
  // equipamentos). Cobre legados: quando `recebedorUserId` é null mas a obra
  // está atribuída à empreiteira do usuário, conta como entrada.
  const empreiteiroUserId = empreiteiraRow?.userId ?? null;
  let receitaTotal = 0;
  let custoTotal = 0;
  for (const f of finRows) {
    if (f.status !== "pago") continue;
    const valor = Number(f.valor ?? 0);
    if (empreiteiroUserId && f.recebedorUserId === empreiteiroUserId) {
      receitaTotal += valor;
      continue;
    }
    if (empreiteiroUserId && f.pagadorUserId === empreiteiroUserId) {
      custoTotal += valor;
      continue;
    }
    // Legados sem recebedor/pagador definidos: tipo=saida (do contratante)
    // significa entrada pro empreiteiro vinculado.
    if (
      empreiteiroUserId &&
      f.recebedorUserId == null &&
      f.pagadorUserId == null &&
      f.tipo === "saida"
    ) {
      receitaTotal += valor;
    }
  }

  const financeiroOut: ObraFinanceiro = {
    valorContratado,
    aditivos,
    valorTotal,
    saldoReceber,
    percentualRecebido,
    percentualExecutado: progresso,
    receitaTotal,
    custoTotal,
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
  const equipeRows = await db
    .select()
    .from(obraEquipe)
    .where(eq(obraEquipe.obraId, obraId))
    .orderBy(asc(obraEquipe.createdAt));

  const equipe: MembroEquipe[] = [];
  equipe.push({
    id: `contratante-${obra.clienteId ?? "anon"}`,
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
  for (const m of equipeRows) {
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
  const itensByChecklist = new Map<string, { id: string; titulo: string; concluida: boolean }[]>();
  for (const it of checklistItensRows) {
    const arr = itensByChecklist.get(it.checklistId) ?? [];
    arr.push({ id: it.id, titulo: it.titulo, concluida: it.concluida });
    itensByChecklist.set(it.checklistId, arr);
  }
  const checklists = checklistsRows.map((c) => {
    const itens = itensByChecklist.get(c.id) ?? [];
    const concluidos = itens.filter((i) => i.concluida).length;
    const total = itens.length;
    const progresso = total > 0 ? Math.round((concluidos / total) * 100) : 0;
    return {
      id: c.id,
      nome: c.nome,
      descricao: c.descricao,
      tipo: c.tipo,
      status: c.status,
      itens,
      completadoEm: c.completadoEm ?? undefined,
      progresso,
      assinadoPor: c.assinadoPor ?? undefined,
      assinadoEm: c.assinadoEm ?? undefined,
      registroProfissional: c.registroProfissional ?? undefined,
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
    imagemUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200",
    status,
    progresso,
    orcamento: valorTotal,
    dataInicio: fmtBrDate(obra.dataInicio),
    dataPrevisaoFim: fmtBrDate(obra.dataPrevisao),
    contratante: {
      nome: contratanteNome,
      iniciais: initialsOf(contratanteNome),
      cor: colorFor(contratanteNome),
      email: contratanteEmail,
    },
    tipo: obra.tipo ?? "Obra",
    valorPago: valorPagoNum,
    aReceber: saldoReceber,
    diasAtraso: dias,
    tarefasPendentes,
    tarefasTotal,
    problemasAbertos,
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
    localizacao:
      obra.cidade || obra.uf
        ? {
            cidade: obra.cidade ?? "",
            estado: obra.uf ?? "",
            bairro: "",
            rua: obra.endereco,
            cep: obra.cep ?? "",
          }
        : undefined,
  };
}
