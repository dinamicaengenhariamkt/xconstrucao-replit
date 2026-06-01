import {
  RiArrowRightDownLine,
  RiToolsLine,
  RiExchangeLine,
  RiCoinLine,
  RiFlagLine,
  RiSaveLine,
} from 'react-icons/ri';
import type { ImpactoItem, CaixaPeriodoMacro } from './types';

/**
 * DADOS PLACEHOLDER — Framework de Impacto Macroeconômico (J09).
 *
 * Estes valores (Selic/CDI, IPCA, INCC, dólar, BTC, risco-Brasil) dependem de
 * uma FONTE EXTERNA (ex: API do Banco Central / IBGE) que NÃO existe no projeto.
 * Por decisão de escopo, o caixa real (entradas/saídas/saldo) foi implementado
 * de verdade, mas os indicadores macro ficam como pendência externa.
 *
 * Ver docs/jornadas/09-financeiro-admin.md §13. Substituir por integração real
 * quando a fonte de dados macroeconômicos for definida.
 */

const makeImpacto = (
  rendimento: string, rendimentoDetail: string,
  erosao: string, erosaoDetail: string,
  incc: string, inccDetail: string,
  dolar: string, dolarDetail: string,
  bitcoin: string, bitcoinDetail: string,
  riscoBrasil: string, riscoBrasilDetail: string,
): ImpactoItem[] => [
  { id: 'rendimento', icon: RiSaveLine, bgClass: 'bg-[#22846D]/5', iconBgClass: 'bg-[#22846D]/10', iconColorClass: 'text-[#22846D]', label: 'Rendimento Projetado (Selic/CDI)', value: rendimento, valueClass: 'text-[#22846D]', detail: rendimentoDetail },
  { id: 'erosao', icon: RiArrowRightDownLine, bgClass: 'bg-red-500/5', iconBgClass: 'bg-red-500/10', iconColorClass: 'text-red-600', label: 'Erosão por Inflação (IPCA)', value: erosao, valueClass: 'text-red-600', detail: erosaoDetail },
  { id: 'incc', icon: RiToolsLine, bgClass: 'bg-amber-500/5', iconBgClass: 'bg-amber-500/10', iconColorClass: 'text-amber-500', label: 'Impacto INCC (custo obras)', value: incc, valueClass: 'text-amber-500', detail: inccDetail },
  { id: 'dolar', icon: RiExchangeLine, bgClass: 'bg-[#22846D]/5', iconBgClass: 'bg-[#22846D]/10', iconColorClass: 'text-[#22846D]', label: 'Dólar (hedge cambial)', value: dolar, valueClass: 'text-[#22846D]', detail: dolarDetail },
  { id: 'bitcoin', icon: RiCoinLine, bgClass: 'bg-amber-500/5', iconBgClass: 'bg-amber-500/10', iconColorClass: 'text-amber-500', label: 'Bitcoin (hedge e diversificação)', value: bitcoin, valueClass: 'text-amber-500', detail: bitcoinDetail },
  { id: 'risco-brasil', icon: RiFlagLine, bgClass: 'bg-blue-500/5', iconBgClass: 'bg-blue-500/10', iconColorClass: 'text-blue-600', label: 'Risco Brasil', value: riscoBrasil, valueClass: 'text-blue-600', detail: riscoBrasilDetail },
];

const PLACEHOLDER = makeImpacto(
  '—', 'Requer fonte de dados de Selic/CDI (pendente)',
  '—', 'Requer fonte de IPCA (pendente)',
  '—', 'Requer fonte de INCC (pendente)',
  '—', 'Requer cotação do dólar (pendente)',
  '—', 'Requer cotação de BTC (pendente)',
  '—', 'Requer índice de risco-país (pendente)',
);

export const macroImpactoByPeriodo: Record<CaixaPeriodoMacro, ImpactoItem[]> = {
  '7dias': PLACEHOLDER,
  '30dias': PLACEHOLDER,
  '90dias': PLACEHOLDER,
  'anoAtual': PLACEHOLDER,
  'personalizado': PLACEHOLDER,
  'futuro': PLACEHOLDER,
};
