import type { Saida, SaidaKpi, SaidaChartData, SaidaFutura, SaidaPeriodo } from '../types';

// ─── KPI Cards ───────────────────────────────────────────────────────────────

export const mockSaidaKpi: SaidaKpi = {
  totalSaidas: 980_000,
  crescimentoPercent: 12.5,
  pagamentosEmpreiteiras: 820_000,
  pagamentosEmpreiteirasPercent: 83.7,
  reembolsos: 90_000,
  reembolsosPercent: 9.1,
  outrosDesembolsos: 70_000,
  outrosDesembolsosPercent: 7.2,
  saidasPrevistas: 450_000,
  maiorPagamento: 280_000,
  maiorPagamentoDescricao: 'Costa & Oliveira – Galpão Industrial',
};

function makeKpi(scale: number, crescimento: number): SaidaKpi {
  return {
    totalSaidas: Math.round(980_000 * scale),
    crescimentoPercent: crescimento,
    pagamentosEmpreiteiras: Math.round(820_000 * scale),
    pagamentosEmpreiteirasPercent: 83.7,
    reembolsos: Math.round(90_000 * scale),
    reembolsosPercent: 9.1,
    outrosDesembolsos: Math.round(70_000 * scale),
    outrosDesembolsosPercent: 7.2,
    saidasPrevistas: Math.round(450_000 * scale),
    maiorPagamento: Math.round(280_000 * scale),
    maiorPagamentoDescricao: 'Costa & Oliveira – Galpão Industrial',
  };
}

export const mockSaidaKpiByPeriodo: Record<SaidaPeriodo, SaidaKpi> = {
  '7dias':         makeKpi(0.25, 4.8),
  '30dias':        mockSaidaKpi,
  '3meses':        makeKpi(3,   18.2),
  '12meses':       makeKpi(10,  28.5),
  'personalizado': mockSaidaKpi,
};

// ─── Lançamentos ─────────────────────────────────────────────────────────────
// Dates distributed so period filtering shows meaningful differences (today = 2026-03-02):
//   7dias  (Feb 23–Mar 02): sai-001, 002, 003, 004, 005
//   30dias (Jan 31–Mar 02): + sai-006, 007, 008, 009
//   3meses (Dec 01–Mar 02): + sai-010
//   12meses(Mar 02 2025–):  + sai-011

export const mockSaidas: Saida[] = [
  {
    id: 'sai-001',
    dataHora: '2026-02-28T14:30:00',
    descricao: 'Pagamento de medição #12 – Galpão Industrial',
    obra: 'Galpão Industrial',
    local: 'Campinas/SP',
    destino: 'Costa & Oliveira',
    destinoPerfil: 'empreiteira',
    tipoSaida: 'pagamento_medicao',
    status: 'pago',
    valor: 280_000,
  },
  {
    id: 'sai-002',
    dataHora: '2026-02-28T16:45:00',
    descricao: 'Reembolso parcial – Condomínio Solar',
    obra: 'Condomínio Solar',
    local: 'São Paulo/SP',
    destino: 'Carlos Santos',
    destinoPerfil: 'cliente',
    tipoSaida: 'reembolso',
    status: 'pago',
    valor: 45_000,
  },
  {
    id: 'sai-003',
    dataHora: '2026-02-27T09:20:00',
    descricao: 'Pagamento de medição #8 – Ed. Comercial Alpha',
    obra: 'Ed. Comercial Alpha',
    local: 'Belo Horizonte/MG',
    destino: 'Andrade Construções',
    destinoPerfil: 'empreiteira',
    tipoSaida: 'pagamento_medicao',
    status: 'agendado',
    valor: 185_000,
  },
  {
    id: 'sai-004',
    dataHora: '2026-02-25T14:00:00',
    descricao: 'Taxa bancária – TED para empreiteira',
    destino: 'Banco Itaú',
    destinoPerfil: 'outro',
    tipoSaida: 'custo_operacional',
    status: 'pago',
    valor: 2_500,
  },
  {
    id: 'sai-005',
    dataHora: '2026-02-25T10:30:00',
    descricao: 'Pagamento de medição #5 – Residencial Vista Mar',
    obra: 'Residencial Vista Mar',
    local: 'Guarujá/SP',
    destino: 'Ponto Alto Engenharia',
    destinoPerfil: 'empreiteira',
    tipoSaida: 'pagamento_medicao',
    status: 'pendente_aprovacao',
    valor: 120_000,
  },
  {
    id: 'sai-006',
    dataHora: '2026-02-20T15:10:00',
    descricao: 'Reembolso ajuste contratual – Incorporadora Sunrise',
    obra: 'Residencial Campinas',
    local: 'Campinas/SP',
    destino: 'Incorporadora Sunrise',
    destinoPerfil: 'cliente',
    tipoSaida: 'reembolso',
    status: 'atrasado',
    valor: 35_000,
  },
  {
    id: 'sai-007',
    dataHora: '2026-02-20T08:45:00',
    descricao: 'Pagamento de medição #3 – Cond. Parque Verde',
    obra: 'Cond. Parque Verde',
    local: 'Curitiba/PR',
    destino: 'Nova Estrutura Eng.',
    destinoPerfil: 'empreiteira',
    tipoSaida: 'pagamento_medicao',
    status: 'pago',
    valor: 95_000,
  },
  {
    id: 'sai-008',
    dataHora: '2026-02-10T11:00:00',
    descricao: 'Custos operacionais – Serviços gerais Fevereiro/2026',
    destino: 'Serviços Gerais Ltda.',
    destinoPerfil: 'outro',
    tipoSaida: 'custo_operacional',
    status: 'pago',
    valor: 18_000,
  },
  {
    id: 'sai-009',
    dataHora: '2026-02-03T13:30:00',
    descricao: 'Pagamento de medição #2 – Condomínio Serrano',
    obra: 'Condomínio Serrano',
    local: 'Porto Alegre/RS',
    destino: 'Construtora ABC Ltda.',
    destinoPerfil: 'empreiteira',
    tipoSaida: 'pagamento_medicao',
    status: 'pago',
    valor: 72_000,
  },
  {
    id: 'sai-010',
    dataHora: '2025-12-15T09:00:00',
    descricao: 'Reembolso contratual – Obra Horizonte Sul',
    obra: 'Horizonte Sul',
    local: 'Florianópolis/SC',
    destino: 'Grupo Construtivo RS',
    destinoPerfil: 'cliente',
    tipoSaida: 'reembolso',
    status: 'pago',
    valor: 28_000,
  },
  {
    id: 'sai-011',
    dataHora: '2025-06-15T14:00:00',
    descricao: 'Pagamento de medição #1 – Obra Pioneira',
    obra: 'Obra Pioneira',
    local: 'São Paulo/SP',
    destino: 'Engenharia Delta',
    destinoPerfil: 'empreiteira',
    tipoSaida: 'pagamento_medicao',
    status: 'pago',
    valor: 145_000,
  },
];

// ─── Chart ────────────────────────────────────────────────────────────────────

const chart7dias: SaidaChartData = {
  chart: [
    { dia: '24/02', pagamentos: 28_000, reembolsos: 6_000, outros: 2_500 },
    { dia: '25/02', pagamentos: 122_500, reembolsos: 9_000, outros: 2_500 },
    { dia: '26/02', pagamentos: 15_000, reembolsos: 4_000, outros: 1_800 },
    { dia: '27/02', pagamentos: 185_000, reembolsos: 8_000, outros: 3_000 },
    { dia: '28/02', pagamentos: 325_000, reembolsos: 45_000, outros: 3_500 },
    { dia: '01/03', pagamentos: 0, reembolsos: 0, outros: 0 },
    { dia: '02/03', pagamentos: 0, reembolsos: 0, outros: 0 },
  ],
  insights: { maiorDia: '28/02', maiorDiaValor: 373_500, diasSemSaida: 2 },
};

const chart30dias: SaidaChartData = {
  chart: [
    { dia: '01', pagamentos: 45_000, reembolsos: 9_000, outros: 4_000 },
    { dia: '03', pagamentos: 38_000, reembolsos: 8_000, outros: 3_500 },
    { dia: '05', pagamentos: 72_000, reembolsos: 11_000, outros: 4_500 },
    { dia: '07', pagamentos: 30_000, reembolsos: 7_000, outros: 3_000 },
    { dia: '09', pagamentos: 51_000, reembolsos: 10_000, outros: 4_000 },
    { dia: '11', pagamentos: 25_000, reembolsos: 6_000, outros: 3_000 },
    { dia: '13', pagamentos: 62_000, reembolsos: 12_000, outros: 5_000 },
    { dia: '15', pagamentos: 40_000, reembolsos: 8_000, outros: 3_500 },
    { dia: '16', pagamentos: 32_000, reembolsos: 7_000, outros: 3_000 },
    { dia: '18', pagamentos: 74_000, reembolsos: 14_000, outros: 7_000 },
    { dia: '20', pagamentos: 130_000, reembolsos: 35_000, outros: 4_000 },
    { dia: '22', pagamentos: 38_000, reembolsos: 7_500, outros: 3_200 },
    { dia: '25', pagamentos: 122_500, reembolsos: 9_000, outros: 2_500 },
    { dia: '27', pagamentos: 185_000, reembolsos: 8_000, outros: 3_000 },
    { dia: '28', pagamentos: 325_000, reembolsos: 45_000, outros: 3_500 },
  ],
  insights: { maiorDia: '28/02', maiorDiaValor: 373_500, diasSemSaida: 3 },
};

const chart3meses: SaidaChartData = {
  chart: [
    { dia: '01/12', pagamentos: 280_000, reembolsos: 62_000, outros: 48_000 },
    { dia: '15/12', pagamentos: 320_000, reembolsos: 70_000, outros: 55_000 },
    { dia: '01/01', pagamentos: 295_000, reembolsos: 65_000, outros: 50_000 },
    { dia: '15/01', pagamentos: 350_000, reembolsos: 78_000, outros: 60_000 },
    { dia: '01/02', pagamentos: 310_000, reembolsos: 68_000, outros: 52_000 },
    { dia: '15/02', pagamentos: 380_000, reembolsos: 85_000, outros: 65_000 },
    { dia: '01/03', pagamentos: 250_000, reembolsos: 55_000, outros: 42_000 },
  ],
  insights: { maiorDia: '15/02', maiorDiaValor: 530_000, diasSemSaida: 8 },
};

const chart12meses: SaidaChartData = {
  chart: [
    { dia: 'Mar/25', pagamentos: 780_000, reembolsos: 85_000, outros: 65_000 },
    { dia: 'Abr/25', pagamentos: 820_000, reembolsos: 90_000, outros: 68_000 },
    { dia: 'Mai/25', pagamentos: 800_000, reembolsos: 87_000, outros: 66_000 },
    { dia: 'Jun/25', pagamentos: 860_000, reembolsos: 95_000, outros: 72_000 },
    { dia: 'Jul/25', pagamentos: 840_000, reembolsos: 92_000, outros: 70_000 },
    { dia: 'Ago/25', pagamentos: 900_000, reembolsos: 100_000, outros: 76_000 },
    { dia: 'Set/25', pagamentos: 870_000, reembolsos: 96_000, outros: 74_000 },
    { dia: 'Out/25', pagamentos: 940_000, reembolsos: 104_000, outros: 80_000 },
    { dia: 'Nov/25', pagamentos: 920_000, reembolsos: 101_000, outros: 78_000 },
    { dia: 'Dez/25', pagamentos: 980_000, reembolsos: 108_000, outros: 84_000 },
    { dia: 'Jan/26', pagamentos: 950_000, reembolsos: 105_000, outros: 82_000 },
    { dia: 'Fev/26', pagamentos: 1_010_000, reembolsos: 112_000, outros: 88_000 },
  ],
  insights: { maiorDia: 'Fev/26', maiorDiaValor: 1_210_000, diasSemSaida: 0 },
};

export const mockSaidaChartData: SaidaChartData = chart30dias;

export const mockSaidaChartDataByPeriodo: Record<SaidaPeriodo, SaidaChartData> = {
  '7dias':         chart7dias,
  '30dias':        chart30dias,
  '3meses':        chart3meses,
  '12meses':       chart12meses,
  'personalizado': chart30dias,
};

// ─── Saídas Futuras ───────────────────────────────────────────────────────────

export const mockSaidasFuturas: SaidaFutura[] = [
  {
    id: 'fut-001',
    vencimento: '2026-03-05',
    descricao: 'Pagamento de medição #13 – Galpão Industrial',
    destino: 'Costa & Oliveira',
    destinoPerfil: 'empreiteira',
    obra: 'Galpão Industrial',
    tipoSaida: 'pagamento_medicao',
    valor: 180_000,
  },
  {
    id: 'fut-002',
    vencimento: '2026-03-07',
    descricao: 'Reembolso contratual – Obra Porto Alegre',
    destino: 'Grupo Construtivo RS',
    destinoPerfil: 'cliente',
    obra: 'Residencial Porto Alegre',
    tipoSaida: 'reembolso',
    valor: 60_000,
  },
  {
    id: 'fut-003',
    vencimento: '2026-03-10',
    descricao: 'Pagamento de medição #9 – Ed. Comercial Alpha',
    destino: 'Andrade Construções',
    destinoPerfil: 'empreiteira',
    obra: 'Ed. Comercial Alpha',
    tipoSaida: 'pagamento_medicao',
    valor: 140_000,
  },
  {
    id: 'fut-004',
    vencimento: '2026-03-12',
    descricao: 'Licenças e custos operacionais – Março/2026',
    destino: 'TechTools Brasil',
    destinoPerfil: 'outro',
    tipoSaida: 'custo_operacional',
    valor: 12_000,
  },
  {
    id: 'fut-005',
    vencimento: '2026-03-15',
    descricao: 'Pagamento de medição #6 – Residencial Vista Mar',
    destino: 'Ponto Alto Engenharia',
    destinoPerfil: 'empreiteira',
    obra: 'Residencial Vista Mar',
    tipoSaida: 'pagamento_medicao',
    valor: 125_000,
  },
];
