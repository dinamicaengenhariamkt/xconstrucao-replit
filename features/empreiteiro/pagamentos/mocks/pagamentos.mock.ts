import type { MedicaoEmpreiteiro, PagamentosEmpriteiroKPI } from '../types';

export const mockMedicoesEmpreiteiro: MedicaoEmpreiteiro[] = [
  {
    id: 'm1-1',
    obraId: '1',
    obraNome: 'Residência Parque das Flores',
    numero: 1,
    periodo: 'Fevereiro 2025',
    valor: 120000,
    status: 'recebido',
    dataEnvio: '2025-02-14',
    dataRecebimento: '2025-02-28',
    descricao: 'Fundação completa — escavação, concretagem e impermeabilização',
  },
  {
    id: 'm1-2',
    obraId: '1',
    obraNome: 'Residência Parque das Flores',
    numero: 2,
    periodo: 'Abril 2025',
    valor: 143000,
    status: 'recebido',
    dataEnvio: '2025-04-18',
    dataRecebimento: '2025-04-30',
    descricao: 'Estrutura — pilares e lajes do térreo e 1º andar',
  },
  {
    id: 'm1-3',
    obraId: '1',
    obraNome: 'Residência Parque das Flores',
    numero: 3,
    periodo: 'Junho 2025',
    valor: 95000,
    status: 'aguardando_aprovacao',
    dataEnvio: '2025-06-09',
    descricao: 'Alvenaria do térreo e instalações elétricas parciais',
  },
  {
    id: 'm1-4',
    obraId: '1',
    obraNome: 'Residência Parque das Flores',
    numero: 4,
    periodo: 'Setembro 2025',
    valor: 62000,
    status: 'pendente',
    dataEnvio: '2025-09-12',
    descricao: 'Cobertura, telhado e instalações hidráulicas',
  },
  {
    id: 'm2-1',
    obraId: '2',
    obraNome: 'Edifício Comercial Horizonte',
    numero: 1,
    periodo: 'Fevereiro 2025',
    valor: 250000,
    status: 'recebido',
    dataEnvio: '2025-02-10',
    dataRecebimento: '2025-02-25',
    descricao: 'Fundação e estrutura do subsolo',
  },
  {
    id: 'm2-2',
    obraId: '2',
    obraNome: 'Edifício Comercial Horizonte',
    numero: 2,
    periodo: 'Maio 2025',
    valor: 480000,
    status: 'recebido',
    dataEnvio: '2025-05-05',
    dataRecebimento: '2025-05-20',
    descricao: 'Estrutura dos andares 1 ao 5',
  },
  {
    id: 'm2-3',
    obraId: '2',
    obraNome: 'Edifício Comercial Horizonte',
    numero: 3,
    periodo: 'Agosto 2025',
    valor: 390000,
    status: 'aguardando_aprovacao',
    dataEnvio: '2025-08-01',
    descricao: 'Alvenaria, instalações hidráulicas e elétricas dos andares 1-5',
  },
  {
    id: 'm2-4',
    obraId: '2',
    obraNome: 'Edifício Comercial Horizonte',
    numero: 4,
    periodo: 'Outubro 2025',
    valor: 320000,
    status: 'rejeitado',
    dataEnvio: '2025-10-03',
    descricao: 'Estrutura dos andares 6 ao 10 — devolvida com pedido de revisão técnica',
  },
  {
    id: 'm3-1',
    obraId: '3',
    obraNome: 'Reforma Loja Center Norte',
    numero: 1,
    periodo: 'Julho 2025',
    valor: 90000,
    status: 'aguardando_aprovacao',
    dataEnvio: '2025-07-14',
    descricao: 'Demolição, regularização e instalações iniciais',
  },
  {
    id: 'm3-2',
    obraId: '3',
    obraNome: 'Reforma Loja Center Norte',
    numero: 2,
    periodo: 'Outubro 2025',
    valor: 70000,
    status: 'pendente',
    dataEnvio: '2025-10-15',
    descricao: 'Acabamentos, fachada e ambientação final',
  },
  {
    id: 'm4-1',
    obraId: '4',
    obraNome: 'Casa de Praia Ubatuba',
    numero: 1,
    periodo: 'Novembro 2024',
    valor: 200000,
    status: 'recebido',
    dataEnvio: '2024-11-15',
    dataRecebimento: '2024-11-30',
    descricao: 'Fundação e estrutura da casa',
  },
  {
    id: 'm4-2',
    obraId: '4',
    obraNome: 'Casa de Praia Ubatuba',
    numero: 2,
    periodo: 'Janeiro 2025',
    valor: 280000,
    status: 'recebido',
    dataEnvio: '2025-01-10',
    dataRecebimento: '2025-01-25',
    descricao: 'Alvenaria, cobertura e instalações',
  },
  {
    id: 'm4-3',
    obraId: '4',
    obraNome: 'Casa de Praia Ubatuba',
    numero: 3,
    periodo: 'Fevereiro 2025',
    valor: 170000,
    status: 'recebido',
    dataEnvio: '2025-02-05',
    dataRecebimento: '2025-02-15',
    descricao: 'Acabamentos, pintura e entrega final',
  },
  {
    id: 'm5-1',
    obraId: '5',
    obraNome: 'Galpão Logístico Anhanguera',
    numero: 1,
    periodo: 'Março 2025',
    valor: 410000,
    status: 'recebido',
    dataEnvio: '2025-03-08',
    dataRecebimento: '2025-03-26',
    descricao: 'Terraplanagem e fundação rasa para piso industrial',
  },
  {
    id: 'm5-2',
    obraId: '5',
    obraNome: 'Galpão Logístico Anhanguera',
    numero: 2,
    periodo: 'Junho 2025',
    valor: 530000,
    status: 'recebido',
    dataEnvio: '2025-06-04',
    dataRecebimento: '2025-06-24',
    descricao: 'Estrutura metálica e cobertura',
  },
  {
    id: 'm5-3',
    obraId: '5',
    obraNome: 'Galpão Logístico Anhanguera',
    numero: 3,
    periodo: 'Setembro 2025',
    valor: 285000,
    status: 'aguardando_aprovacao',
    dataEnvio: '2025-09-05',
    descricao: 'Fechamento lateral e instalações elétricas',
  },
  {
    id: 'm5-4',
    obraId: '5',
    obraNome: 'Galpão Logístico Anhanguera',
    numero: 4,
    periodo: 'Novembro 2025',
    valor: 180000,
    status: 'pendente',
    dataEnvio: '2025-11-10',
    descricao: 'Pavimentação externa e acabamentos finais',
  },
];

function diffInDays(start: string, end: string): number {
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  return Math.round((b - a) / 86_400_000);
}

function buildKPI(medicoes: MedicaoEmpreiteiro[]): PagamentosEmpriteiroKPI {
  const totalContratado = medicoes.reduce((acc, m) => acc + m.valor, 0);
  const totalRecebido = medicoes
    .filter((m) => m.status === 'recebido')
    .reduce((acc, m) => acc + m.valor, 0);
  const aguardandoAprovacao = medicoes
    .filter((m) => m.status === 'aguardando_aprovacao')
    .reduce((acc, m) => acc + m.valor, 0);
  const aLiberar = medicoes
    .filter((m) => m.status === 'pendente')
    .reduce((acc, m) => acc + m.valor, 0);
  const rejeitado = medicoes
    .filter((m) => m.status === 'rejeitado')
    .reduce((acc, m) => acc + m.valor, 0);

  const recebidas = medicoes.filter((m) => m.status === 'recebido' && m.dataRecebimento);
  const prazoMedioRecebimentoDias =
    recebidas.length === 0
      ? 0
      : Math.round(
          recebidas.reduce((acc, m) => acc + diffInDays(m.dataEnvio, m.dataRecebimento!), 0) /
            recebidas.length,
        );

  return {
    totalContratado,
    totalRecebido,
    aguardandoAprovacao,
    aLiberar,
    rejeitado,
    prazoMedioRecebimentoDias,
  };
}

export const mockPagamentosKPI: PagamentosEmpriteiroKPI = buildKPI(mockMedicoesEmpreiteiro);
