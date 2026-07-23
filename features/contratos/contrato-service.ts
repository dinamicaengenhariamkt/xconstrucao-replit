import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import {
  candidaturas,
  clientes,
  contratoAssinaturas,
  empreiteiras,
  obras,
} from "@shared/db/schema";
import { getVersaoVigente } from "@features/legal/legal-service";

/**
 * J58 — Serviço do contrato entre contratante e empreiteiro.
 *
 * Fluxo: no aceite a obra fica `contratoStatus = pendente_contratante`. O
 * contratante assina 1º → `pendente_empreiteiro` → empreiteiro assina →
 * `assinado`, e a obra é promovida a `status = em_andamento`. Cada assinatura é
 * registrada em `contrato_assinaturas` com IP/UA (molde `user_consents`). O
 * contratante pode cancelar enquanto não assinado (reabre a obra). Admin observa.
 *
 * Sem mock — o conteúdo do contrato é montado da proposta aceita + dados das
 * partes (reais) sobre um template versionado (`legal_documents`, tipo
 * `contrato_obra`), com merge de `{{vars}}` (renderContratoTemplate).
 */

export type ContratoPapel = "contratante" | "empreiteiro";

function formatarValorBRL(valor: unknown): string {
  const num = Number(valor);
  if (!Number.isFinite(num) || num <= 0) return "a combinar";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

/**
 * Merge de template: substitui `{{chave}}` pelos valores fornecidos. Só chaves
 * conhecidas (as presentes em `vars`) são substituídas; qualquer `{{...}}` não
 * mapeado é removido (não vaza o placeholder). Não existe engine de template no
 * projeto — este é o merge mínimo e seguro (opera sobre Markdown de conteúdo
 * controlado pelo admin; os valores vêm do banco).
 */
export function renderContratoTemplate(markdown: string, vars: Record<string, string>): string {
  return markdown.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, chave: string) =>
    Object.prototype.hasOwnProperty.call(vars, chave) ? vars[chave] : "",
  );
}

export interface ContratoMontado {
  obraId: string;
  obraNome: string;
  contratoStatus: "pendente_contratante" | "pendente_empreiteiro" | "assinado" | null;
  versaoTemplate: number;
  titulo: string;
  /** Markdown já com as variáveis mescladas (pronto para MarkdownView/PDF). */
  conteudo: string;
  partes: {
    contratanteNome: string;
    empreiteiraNome: string;
  };
  assinaturas: Array<{ papel: ContratoPapel; assinadoEm: string }>;
}

/** Dados brutos da obra + partes + proposta aceita (fonte do contrato). */
async function carregarContexto(obraId: string) {
  const [obra] = await db
    .select({
      id: obras.id,
      nome: obras.nome,
      clienteId: obras.clienteId,
      empreiteiraId: obras.empreiteiraId,
      valorTotal: obras.valorTotal,
      contratoStatus: obras.contratoStatus,
    })
    .from(obras)
    .where(eq(obras.id, obraId));
  if (!obra) return null;

  const [cli] = obra.clienteId
    ? await db
        .select({ nome: clientes.nome, documento: clientes.cnpjCpf, userId: clientes.userId })
        .from(clientes)
        .where(eq(clientes.id, obra.clienteId))
    : [undefined];
  const [emp] = obra.empreiteiraId
    ? await db
        .select({ nome: empreiteiras.nome, documento: empreiteiras.cnpj, userId: empreiteiras.userId })
        .from(empreiteiras)
        .where(eq(empreiteiras.id, obra.empreiteiraId))
    : [undefined];

  // Proposta aceita — fonte do valor/prazo/escopo do contrato.
  const [cand] = await db
    .select({
      id: candidaturas.id,
      valorProposta: candidaturas.valorProposta,
      prazoEstimado: candidaturas.prazoEstimado,
      descricao: candidaturas.descricao,
      atividades: candidaturas.atividades,
    })
    .from(candidaturas)
    .where(and(eq(candidaturas.obraId, obraId), eq(candidaturas.status, "aceita")))
    .orderBy(desc(candidaturas.decididaEm))
    .limit(1);

  return { obra, cli, emp, cand };
}

/** Monta o contrato (merge do template vigente com os dados reais). */
export async function montarContrato(obraId: string): Promise<ContratoMontado | null> {
  const ctx = await carregarContexto(obraId);
  if (!ctx) return null;
  const { obra, cli, emp, cand } = ctx;

  const vigente = await getVersaoVigente("contrato_obra");

  const contratanteNome = cli?.nome ?? "Contratante";
  const empreiteiraNome = emp?.nome ?? "Empreiteira";
  const prazo = cand?.prazoEstimado != null ? `${cand.prazoEstimado} meses` : "a combinar";
  const escopo = (cand?.atividades?.trim() || cand?.descricao?.trim() || "Conforme proposta aceita na plataforma.");

  const vars: Record<string, string> = {
    contratanteNome,
    contratanteDocumento: cli?.documento?.trim() || "não informado",
    empreiteiraNome,
    empreiteiraDocumento: emp?.documento?.trim() || "não informado",
    obraNome: obra.nome,
    valor: formatarValorBRL(cand?.valorProposta ?? obra.valorTotal),
    prazo,
    escopo,
  };

  const conteudo = vigente
    ? renderContratoTemplate(vigente.conteudo, vars)
    : "Template de contrato ainda não publicado.";

  const assinaturas = await db
    .select({ papel: contratoAssinaturas.papel, assinadoEm: contratoAssinaturas.assinadoEm })
    .from(contratoAssinaturas)
    .where(eq(contratoAssinaturas.obraId, obraId));

  return {
    obraId: obra.id,
    obraNome: obra.nome,
    contratoStatus: obra.contratoStatus ?? null,
    versaoTemplate: vigente?.versao ?? 0,
    titulo: vigente?.titulo ?? "Contrato de Obra",
    conteudo,
    partes: { contratanteNome, empreiteiraNome },
    assinaturas: assinaturas.map((a) => ({
      papel: a.papel as ContratoPapel,
      assinadoEm: a.assinadoEm instanceof Date ? a.assinadoEm.toISOString() : String(a.assinadoEm),
    })),
  };
}

export type AssinarResultado =
  | { ok: true; contratoStatus: "pendente_empreiteiro" | "assinado"; efetivada: boolean }
  | { ok: false; code: "SEM_TEMPLATE" | "NAO_E_SUA_VEZ" | "OBRA_NAO_ENCONTRADA" | "SEM_CONTRATO" };

/**
 * Registra a assinatura de uma parte e avança o estado. Transacional + lock na
 * obra. Valida que é a vez do papel. Quando o empreiteiro assina (última parte),
 * promove a obra a `em_andamento`.
 */
export async function assinarContrato(args: {
  obraId: string;
  userId: string;
  papel: ContratoPapel;
  versaoTemplate: number;
  candidaturaId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<AssinarResultado> {
  return db.transaction(async (tx) => {
    // Lock pessimista na obra (mesmo padrão do aceite).
    const locked = await tx.execute(
      sql`SELECT id, contrato_status FROM obras WHERE id = ${args.obraId} FOR UPDATE`,
    );
    const row = (locked as unknown as { rows: Array<{ contrato_status: string | null }> }).rows?.[0];
    if (!row) return { ok: false as const, code: "OBRA_NAO_ENCONTRADA" as const };
    const atual = row.contrato_status as ContratoMontado["contratoStatus"];
    if (atual == null || atual === "assinado") {
      return { ok: false as const, code: "SEM_CONTRATO" as const };
    }

    const vezEsperada: ContratoPapel = atual === "pendente_contratante" ? "contratante" : "empreiteiro";
    if (args.papel !== vezEsperada) {
      return { ok: false as const, code: "NAO_E_SUA_VEZ" as const };
    }

    // Registra a assinatura (idempotente por obra+papel).
    await tx
      .insert(contratoAssinaturas)
      .values({
        obraId: args.obraId,
        candidaturaId: args.candidaturaId ?? null,
        papel: args.papel,
        userId: args.userId,
        versaoTemplate: args.versaoTemplate,
        ip: args.ip ?? null,
        userAgent: args.userAgent ?? null,
      })
      .onConflictDoNothing({ target: [contratoAssinaturas.obraId, contratoAssinaturas.papel] });

    if (args.papel === "contratante") {
      await tx.update(obras).set({ contratoStatus: "pendente_empreiteiro", updatedAt: new Date() }).where(eq(obras.id, args.obraId));
      return { ok: true as const, contratoStatus: "pendente_empreiteiro" as const, efetivada: false };
    }

    // Empreiteiro assinou → efetiva a obra.
    await tx
      .update(obras)
      .set({ contratoStatus: "assinado", status: "em_andamento", updatedAt: new Date() })
      .where(eq(obras.id, args.obraId));
    return { ok: true as const, contratoStatus: "assinado" as const, efetivada: true };
  });
}

export type CancelarResultado =
  | { ok: true }
  | { ok: false; code: "SEM_CONTRATO" | "JA_ASSINADO" | "OBRA_NAO_ENCONTRADA" };

/**
 * Contratante cancela o aceite enquanto o contrato não foi totalmente assinado:
 * desfaz o vínculo (empreiteiraId), zera `contratoStatus`, remove assinaturas e
 * reabre as candidaturas (a aceita volta a `pendente`; as rejeitadas em cascata
 * também). A obra volta a `planejamento`.
 */
export async function cancelarContrato(args: { obraId: string }): Promise<CancelarResultado> {
  return db.transaction(async (tx) => {
    const locked = await tx.execute(
      sql`SELECT id, contrato_status FROM obras WHERE id = ${args.obraId} FOR UPDATE`,
    );
    const row = (locked as unknown as { rows: Array<{ contrato_status: string | null }> }).rows?.[0];
    if (!row) return { ok: false as const, code: "OBRA_NAO_ENCONTRADA" as const };
    const atual = row.contrato_status as ContratoMontado["contratoStatus"];
    if (atual == null) return { ok: false as const, code: "SEM_CONTRATO" as const };
    if (atual === "assinado") return { ok: false as const, code: "JA_ASSINADO" as const };

    // Reabre as candidaturas decididas no aceite (aceita + rejeitadas em cascata).
    await tx.update(candidaturas).set({ status: "pendente", decididaEm: null, motivoRejeicao: null }).where(eq(candidaturas.obraId, args.obraId));

    await tx
      .update(obras)
      .set({ empreiteiraId: null, contratoStatus: null, status: "planejamento", updatedAt: new Date() })
      .where(eq(obras.id, args.obraId));

    await tx.delete(contratoAssinaturas).where(eq(contratoAssinaturas.obraId, args.obraId));

    return { ok: true as const };
  });
}
