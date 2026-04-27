import type {
  Entrada,
  EntradaKpi,
  EntradaChartData,
  EntradaTopItem,
  EntradaPeriodo,
} from '../types';

// ─── KPI Cards ───────────────────────────────────────────────────────────────

export const mockEntradaKpi: EntradaKpi = {
  totalEntradas: 325_000,
  crescimentoPercent: 18.3,
  taxasMedicoes: 245_000,
  taxasMedicoesPercent: 75.4,
  assinaturas: 58_000,
  assinaturasPercent: 17.8,
  outrosServicos: 22_000,
  outrosServicosPercent: 6.8,
  ticketMedioPorCliente: 8_125,
  ticketMedioPorObra: 3_611,
};

function makeKpi(scale: number, crescimento: number): EntradaKpi {
  return {
    totalEntradas: Math.round(325_000 * scale),
    crescimentoPercent: crescimento,
    taxasMedicoes: Math.round(245_000 * scale),
    taxasMedicoesPercent: 75.4,
    assinaturas: Math.round(58_000 * scale),
    assinaturasPercent: 17.8,
    outrosServicos: Math.round(22_000 * scale),
    outrosServicosPercent: 6.8,
    ticketMedioPorCliente: Math.round(8_125 * scale),
    ticketMedioPorObra: Math.round(3_611 * scale),
  };
}

export const mockEntradaKpiByPeriodo: Record<EntradaPeriodo, EntradaKpi> = {
  '7dias':        makeKpi(0.25, 5.2),
  '30dias':       mockEntradaKpi,
  '3meses':       makeKpi(3,   22.1),
  '12meses':      makeKpi(10,  31.7),
  'personalizado': mockEntradaKpi,
};

// ─── Lançamentos ─────────────────────────────────────────────────────────────
// Dates distributed so period filtering shows meaningful differences (hoje ≈ 2026-04-27):
//   7dias  (20/04 – 27/04):     ent-001 a ent-005 (5 itens)
//   30dias (28/03 – 27/04):     + ent-006, 007, 008, 009 (9 itens)
//   3meses (27/01 – 27/04):     + ent-010 (10 itens)
//   12meses(28/04/2025 – ):     + ent-011 (todos os 11)

export const mockEntradas: Entrada[] = [
  {
    id: 'ent-001',
    dataHora: '2026-04-26T14:30:00',
    descricao: 'Taxa de plataforma – Medição #12 – Obra Residencial Campinas',
    clienteEmpreiteira: 'Incorporadora Sunrise',
    tipoReceita: 'taxa_medicao',
    origem: 'cliente',
    valor: 12_500,
    status: 'recebido',
  },
  {
    id: 'ent-002',
    dataHora: '2026-04-26T16:45:00',
    descricao: 'Assinatura Plano Pro – Abril/2026',
    clienteEmpreiteira: 'Construtora Horizonte',
    tipoReceita: 'assinatura',
    origem: 'cliente',
    valor: 4_800,
    status: 'recebido',
  },
  {
    id: 'ent-003',
    dataHora: '2026-04-25T09:20:00',
    descricao: 'Taxa de plataforma – Medição #8 – Ed. Comercial Alpha',
    clienteEmpreiteira: 'Andrade Construções',
    tipoReceita: 'taxa_medicao',
    origem: 'empreiteira',
    valor: 8_200,
    status: 'recebido',
  },
  {
    id: 'ent-004',
    dataHora: '2026-04-23T14:00:00',
    descricao: 'Consultoria técnica – Laudo estrutural Obra #OBR-0051',
    clienteEmpreiteira: 'Carlos Santos',
    tipoReceita: 'outros_servicos',
    origem: 'cliente',
    valor: 3_500,
    status: 'pendente',
  },
  {
    id: 'ent-005',
    dataHora: '2026-04-21T10:30:00',
    descricao: 'Taxa de plataforma – Medição #7 – Galpão Industrial',
    clienteEmpreiteira: 'Costa & Oliveira',
    tipoReceita: 'taxa_medicao',
    origem: 'empreiteira',
    valor: 6_800,
    status: 'recebido',
  },
  {
    id: 'ent-006',
    dataHora: '2026-04-15T15:10:00',
    descricao: 'Assinatura Plano Enterprise – Abril/2026',
    clienteEmpreiteira: 'Engenharia Delta',
    tipoReceita: 'assinatura',
    origem: 'cliente',
    valor: 9_600,
    status: 'em_processamento',
  },
  {
    id: 'ent-007',
    dataHora: '2026-04-10T08:45:00',
    descricao: 'Taxa de plataforma – Medição #5 – Residencial Vista Mar',
    clienteEmpreiteira: 'Ponto Alto Engenharia',
    tipoReceita: 'taxa_medicao',
    origem: 'empreiteira',
    valor: 5_400,
    status: 'pendente',
  },
  {
    id: 'ent-008',
    dataHora: '2026-04-05T11:00:00',
    descricao: 'Treinamento plataforma – Equipe técnica',
    clienteEmpreiteira: 'João Mendes',
    tipoReceita: 'outros_servicos',
    origem: 'cliente',
    valor: 2_200,
    status: 'recebido',
  },
  {
    id: 'ent-009',
    dataHora: '2026-03-30T13:30:00',
    descricao: 'Taxa de plataforma – Medição #3 – Condomínio Serrano',
    clienteEmpreiteira: 'Construtora ABC Ltda.',
    tipoReceita: 'taxa_medicao',
    origem: 'empreiteira',
    valor: 7_100,
    status: 'recebido',
  },
  {
    id: 'ent-010',
    dataHora: '2026-02-15T09:00:00',
    descricao: 'Assinatura Plano Pro – Fevereiro/2026',
    clienteEmpreiteira: 'Tech Solutions Brasil',
    tipoReceita: 'assinatura',
    origem: 'cliente',
    valor: 4_800,
    status: 'recebido',
  },
  {
    id: 'ent-011',
    dataHora: '2025-09-15T14:00:00',
    descricao: 'Taxa de plataforma – Medição #1 – Obra Pioneira',
    clienteEmpreiteira: 'Grupo Mello Engenharia',
    tipoReceita: 'taxa_medicao',
    origem: 'cliente',
    valor: 9_800,
    status: 'recebido',
  },
];

// ─── Chart ────────────────────────────────────────────────────────────────────

const chart7dias: EntradaChartData = {
  chart: [
    { dia: '23/02', taxas: 6_200, assinaturas: 1_800, outros: 700 },
    { dia: '24/02', taxas: 4_500, assinaturas: 1_200, outros: 500 },
    { dia: '25/02', taxas: 9_300, assinaturas: 2_400, outros: 900 },
    { dia: '26/02', taxas: 3_800, assinaturas: 1_000, outros: 400 },
    { dia: '27/02', taxas: 8_200, assinaturas: 2_100, outros: 800 },
    { dia: '28/02', taxas: 17_300, assinaturas: 4_800, outros: 1_200 },
    { dia: '01/03', taxas: 0, assinaturas: 0, outros: 0 },
  ],
  insights: { maiorDia: '28/02', maiorDiaValor: 23_300, diasSemEntrada: 1 },
};

const chart30dias: EntradaChartData = {
  chart: [
    { dia: '01', taxas: 11_000, assinaturas: 3_000, outros: 1_200 },
    { dia: '03', taxas: 8_500, assinaturas: 2_500, outros: 1_000 },
    { dia: '05', taxas: 13_000, assinaturas: 3_500, outros: 1_200 },
    { dia: '07', taxas: 7_200, assinaturas: 2_300, outros: 1_000 },
    { dia: '09', taxas: 10_000, assinaturas: 2_800, outros: 1_200 },
    { dia: '11', taxas: 6_200, assinaturas: 2_000, outros: 1_000 },
    { dia: '12', taxas: 37_600, assinaturas: 8_400, outros: 2_000 },
    { dia: '14', taxas: 9_000, assinaturas: 2_600, outros: 1_000 },
    { dia: '16', taxas: 5_500, assinaturas: 1_800, outros: 900 },
    { dia: '18', taxas: 11_500, assinaturas: 3_200, outros: 1_100 },
    { dia: '20', taxas: 7_500, assinaturas: 2_100, outros: 900 },
    { dia: '22', taxas: 9_800, assinaturas: 2_700, outros: 1_000 },
    { dia: '24', taxas: 7_800, assinaturas: 2_200, outros: 900 },
    { dia: '26', taxas: 10_500, assinaturas: 3_000, outros: 1_100 },
    { dia: '28', taxas: 6_800, assinaturas: 2_000, outros: 900 },
  ],
  insights: { maiorDia: '12/02', maiorDiaValor: 48_000, diasSemEntrada: 3 },
};

const chart3meses: EntradaChartData = {
  chart: [
    { dia: '01/12', taxas: 28_000, assinaturas: 8_200, outros: 3_000 },
    { dia: '15/12', taxas: 34_500, assinaturas: 9_600, outros: 3_600 },
    { dia: '01/01', taxas: 31_000, assinaturas: 8_800, outros: 3_200 },
    { dia: '15/01', taxas: 38_000, assinaturas: 10_200, outros: 3_800 },
    { dia: '01/02', taxas: 33_000, assinaturas: 9_000, outros: 3_400 },
    { dia: '15/02', taxas: 42_000, assinaturas: 11_400, outros: 4_200 },
    { dia: '01/03', taxas: 29_000, assinaturas: 8_000, outros: 3_000 },
  ],
  insights: { maiorDia: '15/02', maiorDiaValor: 57_600, diasSemEntrada: 8 },
};

const chart12meses: EntradaChartData = {
  chart: [
    { dia: 'Mar/25', taxas: 210_000, assinaturas: 58_000, outros: 22_000 },
    { dia: 'Abr/25', taxas: 225_000, assinaturas: 61_000, outros: 24_000 },
    { dia: 'Mai/25', taxas: 218_000, assinaturas: 59_000, outros: 23_000 },
    { dia: 'Jun/25', taxas: 242_000, assinaturas: 65_000, outros: 26_000 },
    { dia: 'Jul/25', taxas: 235_000, assinaturas: 63_000, outros: 25_000 },
    { dia: 'Ago/25', taxas: 258_000, assinaturas: 68_000, outros: 28_000 },
    { dia: 'Set/25', taxas: 248_000, assinaturas: 66_000, outros: 27_000 },
    { dia: 'Out/25', taxas: 272_000, assinaturas: 72_000, outros: 30_000 },
    { dia: 'Nov/25', taxas: 265_000, assinaturas: 70_000, outros: 29_000 },
    { dia: 'Dez/25', taxas: 289_000, assinaturas: 76_000, outros: 32_000 },
    { dia: 'Jan/26', taxas: 278_000, assinaturas: 73_000, outros: 31_000 },
    { dia: 'Fev/26', taxas: 295_000, assinaturas: 78_000, outros: 33_000 },
  ],
  insights: { maiorDia: 'Fev/26', maiorDiaValor: 406_000, diasSemEntrada: 0 },
};

export const mockChartData: EntradaChartData = chart30dias;

export const mockChartDataByPeriodo: Record<EntradaPeriodo, EntradaChartData> = {
  '7dias':        chart7dias,
  '30dias':       chart30dias,
  '3meses':       chart3meses,
  '12meses':      chart12meses,
  'personalizado': chart30dias,
};

// ─── Top Entidades ────────────────────────────────────────────────────────────

const BASE_CLIENTES: EntradaTopItem[] = [
  { nome: 'Incorporadora Sunrise', obras: 12, totalEntradas: 85_000 },
  { nome: 'Construtora Horizonte',  obras:  8, totalEntradas: 62_400 },
  { nome: 'Engenharia Delta',       obras:  6, totalEntradas: 48_000 },
  { nome: 'Tech Solutions Brasil',  obras:  4, totalEntradas: 31_200 },
  { nome: 'Grupo Mello Engenharia', obras:  3, totalEntradas: 24_800 },
];

const BASE_EMPREITEIRAS: EntradaTopItem[] = [
  { nome: 'Andrade Construções',        obras: 9, totalEntradas: 72_000 },
  { nome: 'Costa & Oliveira',           obras: 7, totalEntradas: 54_400 },
  { nome: 'Ponto Alto Engenharia',      obras: 5, totalEntradas: 38_000 },
  { nome: 'Empreiteira Silva & Filhos', obras: 4, totalEntradas: 28_800 },
  { nome: 'Construtora ABC Ltda.',      obras: 3, totalEntradas: 21_600 },
];

function scaleTop(items: EntradaTopItem[], scale: number): EntradaTopItem[] {
  return items.map((it) => ({
    ...it,
    obras: Math.max(1, Math.round(it.obras * scale)),
    totalEntradas: Math.round(it.totalEntradas * scale),
  }));
}

export const mockTopClientes: EntradaTopItem[] = BASE_CLIENTES;
export const mockTopEmpreiteiras: EntradaTopItem[] = BASE_EMPREITEIRAS;

export const mockTopClientesByPeriodo: Record<EntradaPeriodo, EntradaTopItem[]> = {
  '7dias':        scaleTop(BASE_CLIENTES, 0.25),
  '30dias':       BASE_CLIENTES,
  '3meses':       scaleTop(BASE_CLIENTES, 3),
  '12meses':      scaleTop(BASE_CLIENTES, 10),
  'personalizado': BASE_CLIENTES,
};

export const mockTopEmpreiteirasByPeriodo: Record<EntradaPeriodo, EntradaTopItem[]> = {
  '7dias':        scaleTop(BASE_EMPREITEIRAS, 0.25),
  '30dias':       BASE_EMPREITEIRAS,
  '3meses':       scaleTop(BASE_EMPREITEIRAS, 3),
  '12meses':      scaleTop(BASE_EMPREITEIRAS, 10),
  'personalizado': BASE_EMPREITEIRAS,
};
