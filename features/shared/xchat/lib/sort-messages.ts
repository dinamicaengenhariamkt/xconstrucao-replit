import type { Message } from '../types';

/**
 * Ordena mensagens em ordem cronológica estável de chegada (antiga → nova).
 *
 * - Mensagens do servidor têm `seq` (sequência monotônica de `chat_mensagens`,
 *   J41 #149) — a fonte de verdade da ordem. Duas mensagens do servidor nunca
 *   empatam (identity é única), então a ordem é totalmente determinística.
 * - Mensagens otimistas locais ainda não têm `seq` (undefined): ordenam sempre
 *   depois de tudo que já veio do servidor. Entre si, mantêm a ordem de append
 *   no store (que é a ordem de envio real), pois `Array.prototype.sort` é
 *   estável desde ES2019.
 *
 * Não muta o array de entrada (`.slice()` antes de ordenar).
 */
export function sortMessagesCanonical(messages: Message[]): Message[] {
  return messages.slice().sort((a, b) => {
    const as = a.seq;
    const bs = b.seq;
    if (as != null && bs != null) return as - bs; // ambas do servidor
    if (as != null) return -1; // a confirmada, b otimista → a antes
    if (bs != null) return 1; // b confirmada, a otimista → b antes
    return 0; // ambas otimistas → preserva ordem de append
  });
}
