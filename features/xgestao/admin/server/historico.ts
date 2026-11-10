import 'server-only';

import { calcularHistoricoMensal, type MesHistorico } from '../lib/historico-mensal';
import { listarAssinantesDetalhados, receitaPorMesXgestao, type XgestaoAssinanteDetalhe } from './assinantes';
import { historicoDeAssinaturas } from './comercial';

/**
 * XG46 — mês a mês dos últimos 12 meses: testes, entradas, saídas, pagantes,
 * recorrente e dinheiro recebido. Mesma base de assinantes das outras telas.
 */
export async function historicoMensalXgestao(
  assinantesCarregados?: XgestaoAssinanteDetalhe[],
  agora = new Date(),
): Promise<MesHistorico[]> {
  const assinantes = assinantesCarregados ?? (await listarAssinantesDetalhados({ agora }));
  const [{ porUsuario, efetivadas }, recebido] = await Promise.all([
    historicoDeAssinaturas(assinantes.map((a) => a.userId)),
    receitaPorMesXgestao(),
  ]);
  // CRM-04 — no mês corrente, quem não pagou a 1ª cobrança fica fora do recorrente.
  const aguardando = new Set(assinantes.filter((a) => a.situacao.codigo === 'aguardando_pagamento').map((a) => a.userId));
  return calcularHistoricoMensal(porUsuario, recebido, agora, efetivadas, undefined, aguardando);
}
