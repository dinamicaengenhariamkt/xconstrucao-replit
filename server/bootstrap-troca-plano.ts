import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import {
  SQL_CRIAR_ASSINATURA_TROCAS,
  SQL_INDICES_ASSINATURA_TROCAS,
  STATUS_MEMBRO,
  STATUS_TROCA,
  sqlGarantirCheckIn,
} from "./bootstrap-colunas-essenciais";

/**
 * XG48 — troca de plano do xgestão. Idempotente no boot; espelha
 * `migrations/0012_xgestao_troca_plano.sql`. Depende de users, obras,
 * obra_share_links, xgestao_membros, assinaturas e planos: roda depois de
 * `xgestao-membros` e `planos`.
 *
 * REV-11: a CHECK de status dos membros só é trocada quando falta algum valor
 * (bloco `DO` sobre `pg_constraint`), em vez de DROP + ADD a cada boot. A
 * tabela `assinatura_trocas` é criada antes das CHECKs.
 */
const COMANDOS = [
  `ALTER TABLE obras ADD COLUMN IF NOT EXISTS xgestao_bloqueada_por_plano BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE obra_share_links ADD COLUMN IF NOT EXISTS pausado_por_plano BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE xgestao_membros ADD COLUMN IF NOT EXISTS status_antes_pausa TEXT`,
  SQL_CRIAR_ASSINATURA_TROCAS,
  sqlGarantirCheckIn("xgestao_membros", "xgestao_membros_status_check", "status", STATUS_MEMBRO),
  sqlGarantirCheckIn("assinatura_trocas", "assinatura_trocas_status_check", "status", STATUS_TROCA),
  ...SQL_INDICES_ASSINATURA_TROCAS,
];

export async function bootstrapTrocaPlanoSchema(): Promise<void> {
  for (const comando of COMANDOS) {
    await db.execute(sql.raw(comando));
  }
}
