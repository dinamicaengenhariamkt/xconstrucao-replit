import type { MedicaoContratante, MedicoesContratanteKPI } from '../types';

export const mockMedicoesContratante: MedicaoContratante[] = [
  {
    id: 'mc1',
    obraId: '1',
    obraNome: 'Residência Parque das Flores',
    empreiteiroNome: 'João Silva Engenharia',
    numero: 1,
    periodo: 'Fevereiro 2025',
    valor: 120000,
    status: 'paga',
    dataEnvio: '2025-02-14',
    dataAvaliacao: '2025-02-20',
    descricao: 'Fundação completa — escavação, concretagem e impermeabilização',
  },
  {
    id: 'mc2',
    obraId: '1',
    obraNome: 'Residência Parque das Flores',
    empreiteiroNome: 'João Silva Engenharia',
    numero: 2,
    periodo: 'Abril 2025',
    valor: 143000,
    status: 'paga',
    dataEnvio: '2025-04-18',
    dataAvaliacao: '2025-04-23',
    descricao: 'Estrutura — pilares e lajes do térreo e 1º andar',
  },
  {
    id: 'mc3',
    obraId: '1',
    obraNome: 'Residência Parque das Flores',
    empreiteiroNome: 'João Silva Engenharia',
    numero: 3,
    periodo: 'Junho 2025',
    valor: 95000,
    status: 'aguardando_aprovacao',
    dataEnvio: '2025-06-09',
    descricao: 'Alvenaria do térreo e instalações elétricas parciais',
  },
  {
    id: 'mc4',
    obraId: '2',
    obraNome: 'Edifício Comercial Horizonte',
    empreiteiroNome: 'Construtora Pedro Lima',
    numero: 1,
    periodo: 'Fevereiro 2025',
    valor: 250000,
    status: 'paga',
    dataEnvio: '2025-02-10',
    dataAvaliacao: '2025-02-15',
    descricao: 'Fundação e estrutura do subsolo',
  },
  {
    id: 'mc5',
    obraId: '2',
    obraNome: 'Edifício Comercial Horizonte',
    empreiteiroNome: 'Construtora Pedro Lima',
    numero: 2,
    periodo: 'Maio 2025',
    valor: 480000,
    status: 'paga',
    dataEnvio: '2025-05-05',
    dataAvaliacao: '2025-05-10',
    descricao: 'Estrutura dos andares 1 ao 5',
  },
  {
    id: 'mc6',
    obraId: '2',
    obraNome: 'Edifício Comercial Horizonte',
    empreiteiroNome: 'Construtora Pedro Lima',
    numero: 3,
    periodo: 'Agosto 2025',
    valor: 390000,
    status: 'aguardando_aprovacao',
    dataEnvio: '2025-08-01',
    descricao: 'Alvenaria, instalações hidráulicas e elétricas dos andares 1-5',
  },
  {
    id: 'mc7',
    obraId: '2',
    obraNome: 'Edifício Comercial Horizonte',
    empreiteiroNome: 'Construtora Pedro Lima',
    numero: 4,
    periodo: 'Outubro 2025',
    valor: 320000,
    status: 'rejeitada',
    dataEnvio: '2025-10-03',
    dataAvaliacao: '2025-10-08',
    descricao: 'Estrutura dos andares 6 ao 10',
    motivoRejeicao:
      'Quantitativos divergentes do projeto estrutural aprovado. Solicitar revisão técnica e reenvio.',
  },
  {
    id: 'mc8',
    obraId: '3',
    obraNome: 'Reforma Loja Center Norte',
    empreiteiroNome: 'Empresa Reformas LTDA',
    numero: 1,
    periodo: 'Julho 2025',
    valor: 90000,
    status: 'aguardando_aprovacao',
    dataEnvio: '2025-07-14',
    descricao: 'Demolição, regularização e instalações iniciais',
  },
  {
    id: 'mc9',
    obraId: '3',
    obraNome: 'Reforma Loja Center Norte',
    empreiteiroNome: 'Empresa Reformas LTDA',
    numero: 2,
    periodo: 'Outubro 2025',
    valor: 70000,
    status: 'aprovada',
    dataEnvio: '2025-10-15',
    dataAvaliacao: '2025-10-22',
    descricao: 'Acabamentos, fachada e ambientação final',
  },
  {
    id: 'mc10',
    obraId: '4',
    obraNome: 'Casa de Praia Ubatuba',
    empreiteiroNome: 'Mariana Almeida Construções',
    numero: 1,
    periodo: 'Novembro 2024',
    valor: 200000,
    status: 'paga',
    dataEnvio: '2024-11-15',
    dataAvaliacao: '2024-11-20',
    descricao: 'Fundação e estrutura da casa',
  },
  {
    id: 'mc11',
    obraId: '4',
    obraNome: 'Casa de Praia Ubatuba',
    empreiteiroNome: 'Mariana Almeida Construções',
    numero: 2,
    periodo: 'Janeiro 2025',
    valor: 280000,
    status: 'paga',
    dataEnvio: '2025-01-10',
    dataAvaliacao: '2025-01-16',
    descricao: 'Alvenaria, cobertura e instalações',
  },
  {
    id: 'mc12',
    obraId: '4',
    obraNome: 'Casa de Praia Ubatuba',
    empreiteiroNome: 'Mariana Almeida Construções',
    numero: 3,
    periodo: 'Fevereiro 2025',
    valor: 170000,
    status: 'paga',
    dataEnvio: '2025-02-05',
    dataAvaliacao: '2025-02-09',
    descricao: 'Acabamentos, pintura e entrega final',
  },
];

function diffInDays(start: string, end: string): number {
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  return Math.round((b - a) / 86_400_000);
}

function buildKPI(medicoes: MedicaoContratante[]): MedicoesContratanteKPI {
  const totalContratado = medicoes.reduce((acc, m) => acc + m.valor, 0);
  const totalAprovado = medicoes
    .filter((m) => m.status === 'aprovada' || m.status === 'paga')
    .reduce((acc, m) => acc + m.valor, 0);
  const aguardandoLista = medicoes.filter((m) => m.status === 'aguardando_aprovacao');
  const aguardandoMinhaAprovacao = aguardandoLista.reduce((acc, m) => acc + m.valor, 0);
  const rejeitado = medicoes
    .filter((m) => m.status === 'rejeitada')
    .reduce((acc, m) => acc + m.valor, 0);

  const avaliadas = medicoes.filter((m) => m.dataAvaliacao);
  const prazoMedioAvaliacaoDias =
    avaliadas.length === 0
      ? 0
      : Math.round(
          avaliadas.reduce((acc, m) => acc + diffInDays(m.dataEnvio, m.dataAvaliacao!), 0) /
            avaliadas.length,
        );

  return {
    totalContratado,
    totalAprovado,
    aguardandoMinhaAprovacao,
    rejeitado,
    countAguardando: aguardandoLista.length,
    prazoMedioAvaliacaoDias,
  };
}

export const mockMedicoesContratanteKPI: MedicoesContratanteKPI = buildKPI(
  mockMedicoesContratante,
);
