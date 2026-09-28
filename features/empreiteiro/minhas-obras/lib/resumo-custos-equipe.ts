import { ladoDoLancamento } from "./lado-lancamento";

interface ContratoEquipe {
  id: string;
  ativo: boolean;
  valorContrato: string | number | null;
}

interface LancamentoEquipe {
  tipo: string;
  categoria: string | null;
  status: string;
  valor: string | number | null;
  fornecedorId: string | null;
  recebedorUserId: string | null;
  pagadorUserId: string | null;
}

const centavos = (valor: string | number | null) => Math.round(Number(valor ?? 0) * 100);

/**
 * Compara apenas pagamentos de mão de obra ligados a contratos ativos.
 * Compras de material (mesmo que o beneficiário seja membro da equipe) e mão
 * de obra avulsa continuam no custo total da obra, calculado separadamente.
 * O saldo é por contrato: pagar a mais a um prestador não quita outro.
 */
export function resumirCustosEquipe(
  equipe: readonly ContratoEquipe[],
  lancamentos: readonly LancamentoEquipe[],
  empreiteiroUserId: string | null,
) {
  const contratos = new Map(
    equipe
      .filter((m) => m.ativo && m.valorContrato != null && centavos(m.valorContrato) > 0)
      .map((m) => [m.id, centavos(m.valorContrato)]),
  );
  const pagamentos = new Map<string, number>();
  let foraDosContratos = 0;

  for (const l of lancamentos) {
    if (
      l.status !== "pago" ||
      l.tipo !== "saida" ||
      l.categoria !== "mao_de_obra" ||
      ladoDoLancamento(l, empreiteiroUserId) !== "custo"
    ) continue;
    const valor = centavos(l.valor);
    if (l.fornecedorId && contratos.has(l.fornecedorId)) {
      pagamentos.set(l.fornecedorId, (pagamentos.get(l.fornecedorId) ?? 0) + valor);
    } else {
      foraDosContratos += valor;
    }
  }

  let previsto = 0;
  let pago = 0;
  let restante = 0;
  let excedente = 0;
  for (const [id, contrato] of contratos) {
    const recebido = pagamentos.get(id) ?? 0;
    previsto += contrato;
    pago += recebido;
    restante += Math.max(0, contrato - recebido);
    excedente += Math.max(0, recebido - contrato);
  }
  return {
    custoPrevistoEquipe: previsto / 100,
    custoPagoEquipeContratada: pago / 100,
    custoAindaDesembolsarEquipe: restante / 100,
    custoExcedenteEquipe: excedente / 100,
    custoMaoDeObraForaContratos: foraDosContratos / 100,
  };
}