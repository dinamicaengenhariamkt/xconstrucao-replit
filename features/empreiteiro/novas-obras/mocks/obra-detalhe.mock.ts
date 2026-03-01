import type { ObraDetalhe } from '../types';

export const mockObraDetalhe: Record<string, ObraDetalhe> = {
  'nova-1': {
    id: 'nova-1',
    titulo: 'Casa de Praia Premium',
    endereco: 'Condomínio Riviera - Bertioga, SP',
    imagemUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
    tipo: 'Residencial',
    complexidade: 'media',
    orcamento: 780000,
    prazo: '12 meses',
    descricao: 'Projeto de construção completa de casa de praia de alto padrão em condomínio fechado. A residência contará com 3 suítes, piscina com deck molhado, área gourmet com churrasqueira, sala integrada com vista para o mar e garagem para 3 veículos. O projeto segue conceitos de sustentabilidade com captação de água da chuva e energia solar.',
    contratante: { nome: 'Maria Clara Santos', iniciais: 'MC', cor: 'bg-blue-500', email: 'maria.clara@email.com' },
    destaque: true,
    applicationStatus: 'nao_aplicado',
    dataPublicacao: '3 dias atrás',
    candidaturas: 8,
    areaTotal: '380 m²',
    tipoObra: 'Construção completa',
    inicioPrevisto: 'Jun/2026',
    situacaoProjeto: 'Projeto Aprovado',
    observacoes: 'Procuramos um empreiteiro com experiência em construções residenciais de alto padrão. O terreno já está limpo e nivelado. Temos preferência por profissionais que possam começar na data prevista e que tenham disponibilidade para reuniões semanais de acompanhamento. Valorizamos qualidade de acabamento e cumprimento de prazos. Estamos abertos a sugestões de otimização no cronograma, desde que não comprometam a qualidade final.',
    localizacao: { cidade: 'Bertioga', estado: 'SP', bairro: 'Riviera de São Lourenço', rua: 'Condomínio Riviera', cep: '11250-000' },
    sinapi: {
      custoPorM2: 2150,
      referenciaMes: 'Dez/2025',
      regiao: 'Bertioga - SP',
      statusVsSinapi: 'abaixo',
      breakdown: [
        { etapa: 'Fundação', valor: 122550 },
        { etapa: 'Estrutura', valor: 196080 },
        { etapa: 'Alvenaria e Cobertura', valor: 155240 },
        { etapa: 'Instalações', valor: 130560 },
        { etapa: 'Acabamentos', valor: 212570 },
      ],
    },
    etapas: [
      { id: 'e1', nome: 'Fundação e Estrutura', descricao: 'Terraplanagem, fundação e estrutura de concreto', prazo: '3 meses', icone: 'foundation', status: 'pendente' },
      { id: 'e2', nome: 'Alvenaria e Cobertura', descricao: 'Levantamento de paredes, laje e telhado', prazo: '2 meses', icone: 'roofing', status: 'pendente' },
      { id: 'e3', nome: 'Instalações', descricao: 'Elétrica, hidráulica e gás', prazo: '2 meses', icone: 'electrical_services', status: 'pendente' },
      { id: 'e4', nome: 'Acabamentos', descricao: 'Revestimentos, pisos, pintura e esquadrias', prazo: '3 meses', icone: 'format_paint', status: 'pendente' },
      { id: 'e5', nome: 'Paisagismo e Piscina', descricao: 'Jardim, deck, piscina e área externa', prazo: '2 meses', icone: 'park', status: 'pendente' },
    ],
    documentos: [
      { id: 'd1', nome: 'Projeto Arquitetônico', tipo: 'PDF', tamanho: '4.2 MB', url: '#' },
      { id: 'd2', nome: 'Memorial Descritivo', tipo: 'PDF', tamanho: '1.8 MB', url: '#' },
      { id: 'd3', nome: 'Planilha Orçamentária', tipo: 'XLSX', tamanho: '890 KB', url: '#' },
      { id: 'd4', nome: 'Cronograma Físico-Financeiro', tipo: 'PDF', tamanho: '650 KB', url: '#' },
    ],
    requisitos: [
      'Experiência mínima de 5 anos em construções residenciais',
      'Equipe mínima de 15 profissionais',
      'Certificação de qualidade (PBQP-H ou ISO)',
      'Seguro de obra ativo e válido',
      'Referências de pelo menos 3 obras similares concluídas',
    ],
  },
};

export function getObraDetalheMock(id: string): ObraDetalhe | null {
  if (mockObraDetalhe[id]) return mockObraDetalhe[id];
  const defaultObra = { ...mockObraDetalhe['nova-1'], id, titulo: `Obra ${id}` };
  return defaultObra;
}
