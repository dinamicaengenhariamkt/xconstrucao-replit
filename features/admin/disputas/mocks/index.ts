import type { Disputa, DisputasKPI } from '../types';

function diffInDaysFromIso(iso: string): number {
  const dt = new Date(iso).getTime();
  return Math.max(0, Math.round((Date.now() - dt) / 86_400_000));
}

const rawMocks: Omit<Disputa, 'diasAberta'>[] = [
  {
    id: 'dsp-001',
    codigo: 'DSP-2025-001',
    obraId: '2',
    obraNome: 'Edifício Comercial Horizonte',
    cliente: { id: 'cli-002', nome: 'Construtora Rivera' },
    empreiteira: { id: 'emp-002', nome: 'Construtora Pedro Lima' },
    abertaPor: 'cliente',
    categoria: 'medicao_rejeitada',
    status: 'em_analise',
    prioridade: 'alta',
    titulo: 'Contestação de quantitativos na medição #4',
    descricao:
      'Cliente questionou quantitativos divergentes do projeto estrutural aprovado na medição #4. Empreiteira argumenta que houve aditivo verbal — sem registro formal.',
    valorEnvolvido: 320_000,
    dataAbertura: '2025-10-08',
    responsavelAdmin: 'admin@xconstrucao.com',
  },
  {
    id: 'dsp-002',
    codigo: 'DSP-2025-002',
    obraId: '1',
    obraNome: 'Residência Parque das Flores',
    cliente: { id: 'cli-001', nome: 'Carlos Mendes' },
    empreiteira: { id: 'emp-001', nome: 'João Silva Engenharia' },
    abertaPor: 'empreiteira',
    categoria: 'pagamento_atrasado',
    status: 'aguardando_partes',
    prioridade: 'alta',
    titulo: 'Pagamento da medição #3 em atraso há 18 dias',
    descricao:
      'Empreiteira reporta que pagamento da medição #3 (R$ 95k, aprovada em 09/06) não foi liberado no prazo contratual de 10 dias úteis. Cliente alega aguardar liberação interna.',
    valorEnvolvido: 95_000,
    dataAbertura: '2025-04-22',
    responsavelAdmin: 'compliance@xconstrucao.com',
  },
  {
    id: 'dsp-003',
    codigo: 'DSP-2024-118',
    obraId: '3',
    obraNome: 'Reforma Loja Center Norte',
    cliente: { id: 'cli-003', nome: 'Center Norte Comercial' },
    empreiteira: { id: 'emp-004', nome: 'Empresa Reformas LTDA' },
    abertaPor: 'cliente',
    categoria: 'qualidade_obra',
    status: 'resolvida',
    prioridade: 'media',
    titulo: 'Qualidade do acabamento da fachada',
    descricao:
      'Cliente reclamou de imperfeições no revestimento da fachada após entrega. Vistoria conjunta confirmou pontos de retrabalho.',
    valorEnvolvido: 18_000,
    dataAbertura: '2024-11-12',
    dataResolucao: '2024-12-03',
    resolucao:
      'Empreiteira realizou retrabalho às próprias custas. Cliente assinou termo de aceite. Caso encerrado.',
    responsavelAdmin: 'admin@xconstrucao.com',
  },
  {
    id: 'dsp-004',
    codigo: 'DSP-2025-003',
    obraId: '5',
    obraNome: 'Galpão Logístico Anhanguera',
    cliente: { id: 'cli-004', nome: 'Anhanguera Logística' },
    empreiteira: { id: 'emp-003', nome: 'Costa & Oliveira Engenharia' },
    abertaPor: 'cliente',
    categoria: 'descumprimento_prazo',
    status: 'escalada',
    prioridade: 'alta',
    titulo: 'Atraso de 32 dias na entrega da fase de cobertura',
    descricao:
      'Cobertura prevista para 30/09 ainda não concluída. Cliente solicita aplicação de multa contratual e considera rescisão.',
    valorEnvolvido: 285_000,
    dataAbertura: '2025-04-01',
    responsavelAdmin: 'compliance@xconstrucao.com',
  },
  {
    id: 'dsp-005',
    codigo: 'DSP-2025-004',
    obraId: '4',
    obraNome: 'Casa de Praia Ubatuba',
    cliente: { id: 'cli-006', nome: 'Marcos Almeida' },
    empreiteira: { id: 'emp-006', nome: 'Mariana Almeida Construções' },
    abertaPor: 'empreiteira',
    categoria: 'escopo_contrato',
    status: 'resolvida',
    prioridade: 'baixa',
    titulo: 'Divergência sobre fornecimento de mobiliário',
    descricao:
      'Empreiteira entendia que mobiliário interno estava fora de escopo; cliente alegava cláusula de "casa pronta". Releitura conjunta do contrato esclareceu o ponto.',
    dataAbertura: '2025-01-22',
    dataResolucao: '2025-02-04',
    resolucao:
      'Mobiliário definido como fora de escopo após análise do contrato. Cliente concordou. Sem custo adicional.',
    responsavelAdmin: 'admin@xconstrucao.com',
  },
  {
    id: 'dsp-006',
    codigo: 'DSP-2025-005',
    obraId: '2',
    obraNome: 'Edifício Comercial Horizonte',
    cliente: { id: 'cli-002', nome: 'Construtora Rivera' },
    empreiteira: { id: 'emp-002', nome: 'Construtora Pedro Lima' },
    abertaPor: 'empreiteira',
    categoria: 'pagamento_atrasado',
    status: 'aberta',
    prioridade: 'media',
    titulo: 'Aditivo de prazo não formalizado',
    descricao:
      'Empreiteira solicita formalização de aditivo de 30 dias por motivo de força maior (chuvas). Cliente recebeu o pedido mas não respondeu há 12 dias.',
    dataAbertura: '2025-04-22',
  },
  {
    id: 'dsp-007',
    codigo: 'DSP-2024-097',
    obraId: '7',
    obraNome: 'Obra Norte',
    cliente: { id: 'cli-007', nome: 'Norte Empreendimentos' },
    empreiteira: { id: 'emp-005', nome: 'Nova Estrutura Engenharia' },
    abertaPor: 'cliente',
    categoria: 'qualidade_obra',
    status: 'resolvida',
    prioridade: 'media',
    titulo: 'Incidente de segurança reportado no canteiro',
    descricao:
      'Cliente identificou EPIs vencidos durante visita técnica e abriu chamado. Empreiteira regularizou imediatamente.',
    dataAbertura: '2024-09-15',
    dataResolucao: '2024-09-20',
    resolucao:
      'EPIs substituídos no mesmo dia. Auditoria semanal de segurança incluída no fluxo. Caso encerrado sem multa.',
    responsavelAdmin: 'compliance@xconstrucao.com',
  },
  {
    id: 'dsp-008',
    codigo: 'DSP-2025-006',
    obraId: '3',
    obraNome: 'Reforma Loja Center Norte',
    cliente: { id: 'cli-003', nome: 'Center Norte Comercial' },
    empreiteira: { id: 'emp-004', nome: 'Empresa Reformas LTDA' },
    abertaPor: 'cliente',
    categoria: 'outros',
    status: 'aberta',
    prioridade: 'baixa',
    titulo: 'Pedido de cópia da ART para auditoria interna',
    descricao:
      'Cliente solicita cópia da ART/RRT da obra para protocolo de auditoria interna. Empreiteira ainda não respondeu.',
    dataAbertura: '2025-04-30',
  },
];

export const mockDisputas: Disputa[] = rawMocks.map((d) => ({
  ...d,
  diasAberta: d.dataResolucao
    ? diffInDaysFromIso(d.dataAbertura) - diffInDaysFromIso(d.dataResolucao)
    : diffInDaysFromIso(d.dataAbertura),
}));

function buildKPI(disputas: Disputa[]): DisputasKPI {
  const totalAbertas = disputas.filter((d) => d.status === 'aberta').length;
  const emAnalise = disputas.filter((d) => d.status === 'em_analise').length;
  const prioridadeAlta = disputas.filter(
    (d) => d.prioridade === 'alta' && d.status !== 'resolvida',
  ).length;

  const cutoff = Date.now() - 30 * 86_400_000;
  const resolvidasUltimos30d = disputas.filter(
    (d) =>
      d.status === 'resolvida' &&
      d.dataResolucao &&
      new Date(d.dataResolucao).getTime() >= cutoff,
  ).length;

  const resolvidas = disputas.filter((d) => d.status === 'resolvida' && d.dataResolucao);
  const prazoMedioResolucaoDias =
    resolvidas.length === 0
      ? 0
      : Math.round(
          resolvidas.reduce((acc, d) => {
            const dur =
              new Date(d.dataResolucao!).getTime() - new Date(d.dataAbertura).getTime();
            return acc + dur / 86_400_000;
          }, 0) / resolvidas.length,
        );

  return {
    totalAbertas,
    emAnalise,
    resolvidasUltimos30d,
    prioridadeAlta,
    prazoMedioResolucaoDias,
  };
}

export const mockDisputasKPI: DisputasKPI = buildKPI(mockDisputas);
