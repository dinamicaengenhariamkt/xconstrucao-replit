import type { Message } from '../types';

/**
 * Ordena mensagens em ordem cronológica estável de chegada (antiga → nova).
 *
 * Regras de ordenação:
 * 1. Mensagens do servidor (id sem prefixo `local-`) ou confirmadas
 *    (`serverId` preenchido) são ordenadas pelo `timestamp` (ISO 8601).
 *    Em caso de empate de timestamp, retornamos 0 para preservar a
 *    ordem já vinda do banco (ORDER BY criada_em ASC, id ASC).
 *    ⚠️ Não usar `id.localeCompare` como desempate: UUIDs v4 são
 *    aleatórios e reordenam mensagens do mesmo milissegundo de forma
 *    imprevisível a cada renderização.
 * 2. Mensagens otimistas locais (sem `serverId`) mantêm a ordem
 *    de append no store (ordem de envio real), pois `Array.prototype.sort`
 *    é estável desde ES2019.
 * 3. Mensagens server sempre precedem mensagens locais ainda não confirmadas.
 *
 * Não muta o array de entrada (`.slice()` antes de ordenar).
 */
export function sortMessagesCanonical(messages: Message[]): Message[] {
  return messages.slice().sort((a, b) => {
    const aIsServer = !!a.serverId || !a.id.startsWith('local-');
    const bIsServer = !!b.serverId || !b.id.startsWith('local-');

    if (aIsServer && bIsServer) {
      // Em empate de timestamp, retorna 0: preserva a ordem de inserção
      // do banco (sort estável) em vez de usar UUID como critério aleatório.
      return a.timestamp.localeCompare(b.timestamp);
    }
    if (aIsServer) return -1;
    if (bIsServer) return 1;
    return 0;
  });
}
