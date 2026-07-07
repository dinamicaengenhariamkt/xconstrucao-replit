/**
 * Cursor keyset (seek) para paginação de mensagens de chat (J13 — Camada A).
 *
 * O cursor aponta para a mensagem mais antiga já carregada: o par
 * `(criada_em, id)`. O `id` é tiebreaker para timestamps iguais, garantindo
 * paginação estável (sem pular/repetir mensagens no mesmo instante).
 *
 * Formato opaco para o client: base64("<criada_em_iso>|<id>").
 */

export interface ChatCursor {
  criadaEm: Date;
  id: string;
}

export function encodeCursor(cursor: ChatCursor): string {
  const raw = `${cursor.criadaEm.toISOString()}|${cursor.id}`;
  return Buffer.from(raw, "utf8").toString("base64");
}

/**
 * Decodifica um cursor. Falha fechada: qualquer entrada inválida/ausente/forjada
 * retorna `null` (cai na primeira página), nunca lança.
 */
export function decodeCursor(value: string | null | undefined): ChatCursor | null {
  if (!value) return null;
  try {
    const raw = Buffer.from(value, "base64").toString("utf8");
    const sep = raw.indexOf("|");
    if (sep <= 0) return null;
    const iso = raw.slice(0, sep);
    const id = raw.slice(sep + 1);
    if (!id) return null;
    const criadaEm = new Date(iso);
    if (Number.isNaN(criadaEm.getTime())) return null;
    return { criadaEm, id };
  } catch {
    return null;
  }
}

export function clampLimit(value: unknown, fallback = 50, min = 1, max = 100): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}
