import type {
  Entrada,
  EntradaKpi,
  EntradaChartData,
  EntradaTopItem,
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

// ─── Lançamentos ─────────────────────────────────────────────────────────────

export const mockEntradas: Entrada[] = [
  {
    id: 'ent-001',
    dataHora: '2024-06-26T14:30:00',
    descricao: 'Taxa de plataforma – Medição #12 – Obra Residencial Campinas',
    clienteEmpreiteira: 'Incorporadora Sunrise',
    tipoReceita: 'taxa_medicao',
    origem: 'cliente',
    valor: 12_500,
    status: 'recebido',
  },
  {
    id: 'ent-002',
    dataHora: '2024-06-25T16:45:00',
    descricao: 'Assinatura Plano Pro – Junho/2024',
    clienteEmpreiteira: 'Construtora Horizonte',
    tipoReceita: 'assinatura',
    origem: 'cliente',
    valor: 4_800,
    status: 'recebido',
  },
  {
    id: 'ent-003',
    dataHora: '2024-06-25T09:20:00',
    descricao: 'Taxa de plataforma – Medição #8 – Ed. Comercial Alpha',
    clienteEmpreiteira: 'Andrade Construções',
    tipoReceita: 'taxa_medicao',
    origem: 'empreiteira',
    valor: 8_200,
    status: 'recebido',
  },
  {
    id: 'ent-004',
    dataHora: '2024-06-24T14:00:00',
    descricao: 'Consultoria técnica – Laudo estrutural Obra #OBR-0051',
    clienteEmpreiteira: 'Carlos Santos',
    tipoReceita: 'outros_servicos',
    origem: 'cliente',
    valor: 3_500,
    status: 'pendente',
  },
  {
    id: 'ent-005',
    dataHora: '2024-06-24T10:30:00',
    descricao: 'Taxa de plataforma – Medição #7 – Galpão Industrial',
    clienteEmpreiteira: 'Costa & Oliveira',
    tipoReceita: 'taxa_medicao',
    origem: 'empreiteira',
    valor: 6_800,
    status: 'recebido',
  },
  {
    id: 'ent-006',
    dataHora: '2024-06-23T15:10:00',
    descricao: 'Assinatura Plano Enterprise – Junho/2024',
    clienteEmpreiteira: 'Engenharia Delta',
    tipoReceita: 'assinatura',
    origem: 'cliente',
    valor: 9_600,
    status: 'em_processamento',
  },
  {
    id: 'ent-007',
    dataHora: '2024-06-23T08:45:00',
    descricao: 'Taxa de plataforma – Medição #5 – Residencial Vista Mar',
    clienteEmpreiteira: 'Ponto Alto Engenharia',
    tipoReceita: 'taxa_medicao',
    origem: 'empreiteira',
    valor: 5_400,
    status: 'pendente',
  },
  {
    id: 'ent-008',
    dataHora: '2024-06-22T11:00:00',
    descricao: 'Treinamento plataforma – Equipe técnica',
    clienteEmpreiteira: 'João Mendes',
    tipoReceita: 'outros_servicos',
    origem: 'cliente',
    valor: 2_200,
    status: 'recebido',
  },
];

// ─── Chart ────────────────────────────────────────────────────────────────────

export const mockChartData: EntradaChartData = {
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
  insights: {
    maiorDia: '12/06',
    maiorDiaValor: 48_000,
    diasSemEntrada: 3,
  },
};

// ─── Top Entidades ────────────────────────────────────────────────────────────

export const mockTopClientes: EntradaTopItem[] = [
  { nome: 'Incorporadora Sunrise', obras: 12, totalEntradas: 85_000 },
  { nome: 'Construtora Horizonte', obras: 8, totalEntradas: 62_400 },
  { nome: 'Engenharia Delta', obras: 6, totalEntradas: 48_000 },
  { nome: 'Tech Solutions Brasil', obras: 4, totalEntradas: 31_200 },
  { nome: 'Grupo Mello Engenharia', obras: 3, totalEntradas: 24_800 },
];

export const mockTopEmpreiteiras: EntradaTopItem[] = [
  { nome: 'Andrade Construções', obras: 9, totalEntradas: 72_000 },
  { nome: 'Costa & Oliveira', obras: 7, totalEntradas: 54_400 },
  { nome: 'Ponto Alto Engenharia', obras: 5, totalEntradas: 38_000 },
  { nome: 'Empreiteira Silva & Filhos', obras: 4, totalEntradas: 28_800 },
  { nome: 'Construtora ABC Ltda.', obras: 3, totalEntradas: 21_600 },
];
