import type { Message } from '../types';

/**
 * Ordena mensagens em ordem cronológica estável de chegada (antiga → nova).
 *
 * - Mensagens do servidor têm `timestamp` (ISO 8601) e `id` (UUID) como
 *   tiebreaker para mensagens criadas no mesmo instante.
 * - Mensagens otimistas locais (sem `serverId` confirmado) mantêm a ordem
 *   de append no store (ordem de envio real), pois `Array.prototype.sort`
 *   é estável desde ES2019.
 *
 * Não muta o array de entrada (`.slice()` antes de ordenar).
 */
export function sortMessagesCanonical(messages: Message[]): Message[] {
  return messages.slice().sort((a, b) => {
    const aIsServer = !!a.serverId || !a.id.startsWith('local-');
    const bIsServer = !!b.serverId || !b.id.startsWith('local-');

    if (aIsServer && bIsServer) {
      const tsDiff = a.timestamp.localeCompare(b.timestamp);
      if (tsDiff !== 0) return tsDiff;
      return a.id.localeCompare(b.id);
    }
    if (aIsServer) return -1;
    if (bIsServer) return 1;
    return 0;
  });
}
