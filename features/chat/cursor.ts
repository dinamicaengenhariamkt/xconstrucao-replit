/**
 * Cursor keyset (seek) para paginação de mensagens de chat (J13 — Camada A).
 *
 * O cursor aponta para a mensagem mais antiga já carregada, identificada pelo
 * par `(criadaEm, id)`. `criadaEm` é o timestamp de criação (string ISO 8601)
 * e `id` é o UUID que desempata mensagens criadas no mesmo instante.
 * Ordenação interna: `criada_em DESC, id DESC` (mais recente primeiro).
 *
 * Formato opaco para o client: base64(JSON).
 */

export interface ChatCursor {
  criadaEm: string;
  id: string;
}

export function encodeCursor(cursor: ChatCursor): string {
  return Buffer.from(JSON.stringify({ criadaEm: cursor.criadaEm, id: cursor.id }), "utf8").toString("base64");
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
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>).criadaEm !== "string" ||
      typeof (parsed as Record<string, unknown>).id !== "string"
    ) {
      return null;
    }
    const { criadaEm, id } = parsed as { criadaEm: string; id: string };
    if (!criadaEm || !id) return null;
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
