/**
 * De que lado do caixa da obra um lançamento está, do ponto de vista do
 * empreiteiro: dinheiro que entra (receita) ou que sai (custo).
 *
 * Extraído de `build-detalhe-server.ts` na XG30, quando o link público passou a
 * mostrar os recebimentos: a aba Financeiro e a página do cliente precisam
 * concordar sobre o que é recebimento, e a regra tem uma armadilha. No
 * marketplace `tipo = 'saida'` é saída do contratante (= entrada nossa); no
 * xgestão o lançamento tem recebedor/pagador explícitos e `saida` é custo.
 * Duas cópias desta função acabariam discordando justamente aí — e, no link
 * público, discordar significa mostrar uma despesa ao cliente como parcela.
 */
export type LadoLancamento = 'receita' | 'custo' | null;

export interface LancamentoParaLado {
  tipo: string;
  recebedorUserId: string | null;
  pagadorUserId: string | null;
}

export function ladoDoLancamento(
  lancamento: LancamentoParaLado,
  empreiteiroUserId: string | null,
): LadoLancamento {
  if (!empreiteiroUserId) return null;
  if (lancamento.recebedorUserId === empreiteiroUserId) return 'receita';
  if (lancamento.pagadorUserId === empreiteiroUserId) return 'custo';
  // Legados sem recebedor/pagador definidos: tipo=saida (do contratante)
  // significa entrada pro empreiteiro vinculado.
  if (
    lancamento.recebedorUserId == null &&
    lancamento.pagadorUserId == null &&
    lancamento.tipo === 'saida'
  ) {
    return 'receita';
  }
  return null;
}
