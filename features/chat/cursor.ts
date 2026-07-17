/**
 * Cursor keyset (seek) para paginação de mensagens de chat (J13 — Camada A).
 *
 * O cursor aponta para a mensagem mais antiga já carregada, via `seq` — a
 * sequência monotônica de chegada de `chat_mensagens` (J41 #149). `seq` é
 * único e crescente, então dá paginação estável sem pular/repetir mensagens
 * (substitui o antigo par `(criada_em, id)`, que desempatava por UUID aleatório).
 *
 * Formato opaco para o client: base64("<seq>").
 */

export interface ChatCursor {
  seq: number;
}

export function encodeCursor(cursor: ChatCursor): string {
  return Buffer.from(String(cursor.seq), "utf8").toString("base64");
}

/**
 * Decodifica um cursor. Falha fechada: qualquer entrada inválida/ausente/forjada
 * retorna `null` (cai na primeira página), nunca lança.
 */
export function decodeCursor(value: string | null | undefined): ChatCursor | null {
  if (!value) return null;
  try {
    const raw = Buffer.from(value, "base64").toString("utf8").trim();
    if (!raw) return null;
    const seq = Number(raw);
    if (!Number.isInteger(seq) || seq < 0) return null;
    return { seq };
  } catch {
    return null;
  }
}

export function clampLimit(value: unknown, fallback = 50, min = 1, max = 100): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}
