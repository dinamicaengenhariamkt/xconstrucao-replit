import type { ObraContratanteDetalhe, CandidaturaRecebida } from '../types';
import { mockObrasContratante } from './minhas-obras.mock';

const mockCandidaturasObra5: CandidaturaRecebida[] = [
  {
    id: 'c1',
    empreiteiro: { nome: 'Construtora Horizonte', iniciais: 'CH', cor: 'bg-blue-500', empresa: 'Horizonte Engenharia Ltda.', telefone: '(11) 98800-1234', avaliacao: 4.8 },
    valorProposto: 3200000,
    prazoMeses: 28,
    dataEnvio: 'Há 2 dias',
    status: 'em_analise',
    descricao: 'Empresa com 18 anos de atuação no mercado paulista, especializada em edificações de alto padrão. Equipe própria de engenheiros e mestre de obras. Mais de 60 projetos entregues no prazo.',
    dataInicio: 'Abril 2026',
    dataTermino: 'Agosto 2028',
    observacoesPrazo: 'Prazo pode ser reduzido em até 2 meses caso a documentação de licença seja antecipada. Trabalho em regime contínuo com equipe de 40 profissionais.',
    observacoesFinanceiras: 'Proposta inclui todos os materiais, mão de obra e equipamentos. Medições mensais com aprovação prévia. Pagamento em 30 dias após medição aprovada.',
    atividades: [
      { id: 'a1', descricao: 'Fundação e contenção (sondagem, escavação, estacas)', valor: 640000, observacoes: 'Inclui sondagem SPT, contenção de vizinhos e esgotamento' },
      { id: 'a2', descricao: 'Estrutura de concreto armado (18 pavimentos)', valor: 960000, observacoes: 'Concreto fck 30 MPa, formas metálicas, armação CA-50' },
      { id: 'a3', descricao: 'Alvenaria, vedações e fachada', valor: 480000, observacoes: 'Bloco cerâmico, reboco, fachada em vidro e ACM' },
      { id: 'a4', descricao: 'Instalações hidráulicas, elétricas e SPDA', valor: 560000, observacoes: 'Projeto aprovado pela concessionária incluído' },
      { id: 'a5', descricao: 'Acabamento, revestimentos e área de lazer', valor: 560000, observacoes: 'Pisos porcelanato 120x120, pintura textura, paisagismo incluso' },
    ],
  },
  {
    id: 'c2',
    empreiteiro: { nome: 'João Ferreira', iniciais: 'JF', cor: 'bg-amber-500', empresa: 'JF Construções', telefone: '(11) 97700-5678', avaliacao: 4.5 },
    valorProposto: 3450000,
    prazoMeses: 26,
    dataEnvio: 'Há 3 dias',
    status: 'em_analise',
    descricao: 'Empresa familiar com 12 anos no mercado, foco em entrega rápida e qualidade de acabamento. Parcerias com fornecedores diretos garantem economia de materiais.',
    dataInicio: 'Março 2026',
    dataTermino: 'Maio 2028',
    observacoesPrazo: 'Prazo de 26 meses é firmado em contrato. Usamos metodologia de construção acelerada com pré-moldados para a estrutura.',
    observacoesFinanceiras: 'Proposta inclui materiais de alto padrão. Possibilidade de parcelamento em até 36 medições. Reajuste anual pelo INCC.',
    atividades: [
      { id: 'a1', descricao: 'Fundação profunda e estrutura dos subsolos', valor: 800000, observacoes: 'Estacas raiz com profundidade média de 18m' },
      { id: 'a2', descricao: 'Estrutura pré-moldada e lajes', valor: 1050000, observacoes: 'Sistema de pré-moldados reduz prazo em 30%' },
      { id: 'a3', descricao: 'Alvenaria e instalações', valor: 700000 },
      { id: 'a4', descricao: 'Acabamento completo e área comum', valor: 900000, observacoes: 'Inclui academia, piscina aquecida e salão de festas' },
    ],
  },
  {
    id: 'c3',
    empreiteiro: { nome: 'Grupo Edificar', iniciais: 'GE', cor: 'bg-green-600', empresa: 'Edificar Construção Civil', telefone: '(11) 96600-9012', avaliacao: 4.9 },
    valorProposto: 3100000,
    prazoMeses: 30,
    dataEnvio: 'Há 4 dias',
    status: 'em_analise',
    descricao: 'Maior construtora da região com ISO 9001 e certificação PBQP-H nível A. Referência em sustentabilidade e gestão BIM. Portfólio de 200+ obras entregues.',
    dataInicio: 'Maio 2026',
    dataTermino: 'Novembro 2028',
    observacoesPrazo: 'Prazo conservador com margem de contingência de 15%. Gerenciamento via MS Project com relatórios semanais ao contratante.',
    observacoesFinanceiras: 'Proposta mais competitiva do mercado por economia de escala. Medições quinzenais. Garantia de 5 anos sobre estrutura.',
    atividades: [
      { id: 'a1', descricao: 'Serviços preliminares e fundação', valor: 520000 },
      { id: 'a2', descricao: 'Estrutura de concreto', valor: 930000, observacoes: 'Projeto estrutural BIM com otimização de concreto e aço' },
      { id: 'a3', descricao: 'Vedações e impermeabilizações', valor: 420000 },
      { id: 'a4', descricao: 'Instalações prediais completas', valor: 480000, observacoes: 'Automação residencial e fibra ótica incluídas' },
      { id: 'a5', descricao: 'Acabamentos e áreas comuns', valor: 750000 },
    ],
  },
  {
    id: 'c4',
    empreiteiro: { nome: 'Paulo Maia', iniciais: 'PM', cor: 'bg-purple-500', empresa: 'Maia Obras e Projetos', telefone: '(11) 95500-3456', avaliacao: 4.3 },
    valorProposto: 3380000,
    prazoMeses: 27,
    dataEnvio: 'Há 5 dias',
    status: 'em_analise',
    descricao: 'Empresa com 8 anos de mercado, especialista em retrofit e construção nova na capital. Equipe técnica com engenheiros seniores e mestre de obras com experiência em grandes obras.',
    dataInicio: 'Abril 2026',
    dataTermino: 'Julho 2028',
    observacoesPrazo: 'Cronograma detalhado disponível para apresentação. Possibilidade de antecipação de 2 meses mediante aumento de equipe.',
    observacoesFinanceiras: 'Proposta inclui seguro de responsabilidade civil e garantia de entrega. Condições de pagamento flexíveis conforme fluxo do contratante.',
    atividades: [
      { id: 'a1', descricao: 'Fundação e estrutura dos subsolos', valor: 720000 },
      { id: 'a2', descricao: 'Superestrutura (pavimentos tipo)', valor: 1100000, observacoes: 'Fôrmas convencionais com supervisão de engenheiro residente' },
      { id: 'a3', descricao: 'Fechamentos e instalações', valor: 680000 },
      { id: 'a4', descricao: 'Acabamento e entrega', valor: 880000, observacoes: 'Vistorias parciais com o contratante a cada etapa' },
    ],
  },
];

const detalhesMap: Record<string, Partial<ObraContratanteDetalhe>> = {
  '1': {
    descricao: 'Construção de residência de alto padrão com 3 pavimentos, piscina e área gourmet completa.',
    valorPago: 189000,
    valorRestante: 231000,
    diasRestantes: 185,
    tarefasConcluidas: 28,
    tarefasTotal: 45,
    etapas: [
      {
        id: 'e1', nome: 'Fundação', progresso: 100,
        tarefas: [
          { id: 't1', titulo: 'Escavação do terreno', concluida: true },
          { id: 't2', titulo: 'Concretagem da base', concluida: true },
          { id: 't3', titulo: 'Impermeabilização', concluida: true },
        ],
      },
      {
        id: 'e2', nome: 'Estrutura', progresso: 85,
        tarefas: [
          { id: 't4', titulo: 'Pilares do térreo', concluida: true },
          { id: 't5', titulo: 'Laje do 1º andar', concluida: true },
          { id: 't6', titulo: 'Pilares do 1º andar', concluida: true },
          { id: 't7', titulo: 'Laje do 2º andar', concluida: false },
        ],
      },
      {
        id: 'e3', nome: 'Alvenaria', progresso: 40,
        tarefas: [
          { id: 't8', titulo: 'Paredes do térreo', concluida: true },
          { id: 't9', titulo: 'Paredes do 1º andar', concluida: false },
          { id: 't10', titulo: 'Paredes do 2º andar', concluida: false },
        ],
      },
      {
        id: 'e4', nome: 'Acabamento', progresso: 0,
        tarefas: [
          { id: 't11', titulo: 'Reboco interno', concluida: false },
          { id: 't12', titulo: 'Piso cerâmico', concluida: false },
          { id: 't13', titulo: 'Pintura', concluida: false },
        ],
      },
    ],
    tarefas: [
      { id: 'tk1', titulo: 'Escavação do terreno', etapa: 'Fundação', responsavel: 'Equipe Carlos', prazo: '2025-01-20', status: 'concluido', prioridade: 'alta' },
      { id: 'tk2', titulo: 'Concretagem da base', etapa: 'Fundação', responsavel: 'Equipe Carlos', prazo: '2025-02-05', status: 'concluido', prioridade: 'alta' },
      { id: 'tk3', titulo: 'Impermeabilização', etapa: 'Fundação', responsavel: 'Equipe Carlos', prazo: '2025-02-15', status: 'concluido', prioridade: 'media' },
      { id: 'tk4', titulo: 'Pilares do térreo', etapa: 'Estrutura', responsavel: 'Equipe Pedro', prazo: '2025-03-10', status: 'concluido', prioridade: 'alta' },
      { id: 'tk5', titulo: 'Laje do 1º andar', etapa: 'Estrutura', responsavel: 'Equipe Pedro', prazo: '2025-04-05', status: 'concluido', prioridade: 'alta' },
      { id: 'tk6', titulo: 'Pilares do 1º andar', etapa: 'Estrutura', responsavel: 'Equipe Pedro', prazo: '2025-05-01', status: 'concluido', prioridade: 'alta' },
      { id: 'tk7', titulo: 'Concretagem laje 2º andar', etapa: 'Estrutura', responsavel: 'Equipe Pedro', prazo: '2025-06-25', status: 'em_andamento', prioridade: 'alta', progresso: 60, descricao: 'Concretagem da laje do segundo pavimento em andamento.' },
      { id: 'tk8', titulo: 'Paredes do térreo', etapa: 'Alvenaria', responsavel: 'Equipe João', prazo: '2025-05-20', status: 'concluido', prioridade: 'media' },
      { id: 'tk9', titulo: 'Paredes do 1º andar', etapa: 'Alvenaria', responsavel: 'Equipe João', prazo: '2025-07-10', status: 'em_andamento', prioridade: 'media', progresso: 35 },
      { id: 'tk10', titulo: 'Instalação esquadrias metálicas', etapa: 'Alvenaria', responsavel: 'Fornecedor', prazo: '2025-07-28', status: 'bloqueado', prioridade: 'alta', bloqueioMotivo: 'Aguardando material', bloqueioInfo: 'Fornecedor confirmou entrega para 28/07. Pedido nº 4872.' },
      { id: 'tk11', titulo: 'Paredes do 2º andar', etapa: 'Alvenaria', responsavel: 'Equipe João', prazo: '2025-08-15', status: 'pendente', prioridade: 'media' },
      { id: 'tk12', titulo: 'Reboco interno', etapa: 'Acabamento', responsavel: 'A definir', prazo: '2025-09-10', status: 'pendente', prioridade: 'baixa' },
      { id: 'tk13', titulo: 'Piso cerâmico', etapa: 'Acabamento', responsavel: 'A definir', prazo: '2025-10-05', status: 'pendente', prioridade: 'baixa' },
      { id: 'tk14', titulo: 'Pintura', etapa: 'Acabamento', responsavel: 'A definir', prazo: '2025-11-01', status: 'pendente', prioridade: 'baixa' },
    ],
    equipe: [
      { id: 'm1', nome: 'Carlos Silva', funcao: 'Mestre de Obras', iniciais: 'CS', cor: 'bg-blue-500', telefone: '(11) 98765-4321' },
      { id: 'm2', nome: 'Ana Costa', funcao: 'Engenheira Civil', iniciais: 'AC', cor: 'bg-purple-500', telefone: '(11) 97654-3210' },
      { id: 'm3', nome: 'Roberto Mendes', funcao: 'Eletricista', iniciais: 'RM', cor: 'bg-amber-500', telefone: '(11) 96543-2109' },
      { id: 'm4', nome: 'Fátima Oliveira', funcao: 'Arquiteta', iniciais: 'FO', cor: 'bg-green-600', telefone: '(11) 95432-1098' },
    ],
    financeiro: [
      { id: 'f1', descricao: 'Medição 1 - Fundação', valor: 120000, tipo: 'saida', data: '15/02/2025', status: 'pago', categoria: 'Medição' },
      { id: 'f2', descricao: 'Material - Cimento e Aço', valor: 85000, tipo: 'saida', data: '01/03/2025', status: 'pago', categoria: 'Material' },
      { id: 'f3', descricao: 'Medição 2 - Estrutura', valor: 143000, tipo: 'saida', data: '20/04/2025', status: 'pago', categoria: 'Medição' },
      { id: 'f4', descricao: 'Material - Tijolos e Argamassa', valor: 45000, tipo: 'saida', data: '15/05/2025', status: 'pendente', categoria: 'Material' },
      { id: 'f5', descricao: 'Medição 3 - Alvenaria', valor: 95000, tipo: 'saida', data: '10/06/2025', status: 'pendente', categoria: 'Medição' },
    ],
    timeline: [
      { id: 'tl1', tipo: 'progresso', titulo: 'Progresso atualizado: 65%', descricao: 'Alvenaria do 1º andar concluída com sucesso', autor: 'João Silva', data: 'Hoje, 14:32' },
      { id: 'tl2', tipo: 'tarefa', titulo: 'Tarefa concluída: Laje do 1º andar', descricao: 'Concretagem da laje finalizada — cura mínima de 28 dias aguardada', autor: 'Equipe Pedro', data: 'Ontem, 17:15' },
      { id: 'tl3', tipo: 'documento', titulo: 'Documento anexado', descricao: 'Relatorio_Semanal_Junho.pdf adicionado ao sistema', autor: 'Ana Costa', data: 'Há 2 dias' },
      { id: 'tl4', tipo: 'problema', titulo: 'Problema reportado: Atraso de material', descricao: 'Esquadrias metálicas com atraso de 15 dias. Fornecedor confirmou nova data de entrega.', autor: 'Carlos Eng.', data: 'Há 3 dias' },
      { id: 'tl5', tipo: 'progresso', titulo: 'Progresso atualizado: 55%', descricao: 'Pilares do 1º andar concluídos', autor: 'João Silva', data: 'Há 5 dias' },
      { id: 'tl6', tipo: 'nota', titulo: 'Reunião de alinhamento realizada', descricao: 'Novo cronograma definido com equipe técnica e aprovado pelo engenheiro responsável', autor: 'João Silva', data: 'Há 7 dias' },
      { id: 'tl7', tipo: 'tarefa', titulo: 'Tarefa concluída: Pilares do térreo', descricao: 'Todos os pilares do térreo concluídos e aprovados na vistoria', autor: 'Equipe Pedro', data: 'Há 10 dias' },
    ],
    ocorrencias: [
      { id: 'oc1', titulo: 'Atraso na entrega de esquadrias metálicas', descricao: 'Fornecedor não entregou as esquadrias na data prevista. Nova data confirmada para 28/07. Isso impacta o cronograma em aproximadamente 15 dias.', gravidade: 'medio', status: 'aberta', responsavel: 'Carlos Eng.', dataAbertura: '03/06/2025', fotoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400' },
      { id: 'oc2', titulo: 'Infiltração detectada na laje de fundação', descricao: 'Identificada pequena infiltração na laje de fundação. Equipe de impermeabilização será acionada para avaliação e correção.', gravidade: 'critico', status: 'aberta', responsavel: 'Ana Costa', dataAbertura: '05/06/2025' },
      { id: 'oc3', titulo: 'Trinca superficial no bloco L3', descricao: 'Trinca superficial identificada no bloco L3 da alvenaria. Avaliação indicou ser apenas estética sem comprometer estrutura.', gravidade: 'baixo', status: 'resolvida', responsavel: 'Equipe João', dataAbertura: '20/05/2025', dataResolucao: '25/05/2025', resolvidoPor: 'Roberto Mendes' },
      { id: 'oc4', titulo: 'Instalação elétrica interrompida por falta de material', descricao: 'Eletrodutos insuficientes para completar a instalação do pavimento térreo. Material reposto no dia seguinte.', gravidade: 'baixo', status: 'resolvida', responsavel: 'Equipe Elétrica', dataAbertura: '15/05/2025', dataResolucao: '16/05/2025', resolvidoPor: 'Roberto Mendes' },
    ],
    fotos: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400', data: 'Hoje, 14:32', etapa: 'Estrutura', fase: 'agora' as const, tag: 'Estrutura', enviadaAoContratante: true },
      { id: 'p2', url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400', data: 'Ontem', etapa: 'Estrutura', fase: 'durante' as const, tag: 'Estrutura', enviadaAoContratante: true },
      { id: 'p3', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400', data: 'Há 3 dias', etapa: 'Alvenaria', fase: 'durante' as const, tag: 'Alvenaria', enviadaAoContratante: true },
      { id: 'p4', url: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=400', data: 'Há 5 dias', etapa: 'Alvenaria', tag: 'Alvenaria', enviadaAoContratante: false },
      { id: 'p5', url: 'https://images.unsplash.com/photo-1590274853856-f22d5ee3d228?w=400', data: 'Há 7 dias', etapa: 'Fundação', fase: 'antes' as const, tag: 'Fundação', enviadaAoContratante: true },
      { id: 'p6', url: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=400', data: 'Há 10 dias', etapa: 'Fundação', fase: 'antes' as const, tag: 'Fundação', enviadaAoContratante: false },
    ],
    localizacao: {
      cidade: 'Campinas',
      estado: 'SP',
      bairro: 'Parque das Flores',
      rua: 'Rua das Orquídeas, 450',
      cep: '13080-000',
    },
  },
  '5': {
    descricao: 'Edifício residencial de alto padrão com 18 andares, 2 subsolos de garagem, área de lazer completa com piscina, academia e salão de festas. Projeto aprovado e documentação regularizada.',
    valorPago: 0,
    valorRestante: 3500000,
    diasRestantes: 665,
    tarefasConcluidas: 0,
    tarefasTotal: 0,
    etapas: [
      {
        id: 'e1', nome: 'Fundação e Estrutura', progresso: 0,
        tarefas: [
          { id: 't1', titulo: 'Sondagem e estudos do solo', concluida: false },
          { id: 't2', titulo: 'Escavação e contenção', concluida: false },
          { id: 't3', titulo: 'Execução das fundações', concluida: false },
          { id: 't4', titulo: 'Estrutura de concreto armado', concluida: false },
        ],
      },
      {
        id: 'e2', nome: 'Alvenaria e Vedação', progresso: 0,
        tarefas: [
          { id: 't5', titulo: 'Alvenaria dos subsolos', concluida: false },
          { id: 't6', titulo: 'Alvenaria dos andares tipo', concluida: false },
          { id: 't7', titulo: 'Fachada e vedações externas', concluida: false },
        ],
      },
      {
        id: 'e3', nome: 'Instalações', progresso: 0,
        tarefas: [
          { id: 't8', titulo: 'Instalações hidráulicas e sanitárias', concluida: false },
          { id: 't9', titulo: 'Instalações elétricas e SPDA', concluida: false },
          { id: 't10', titulo: 'Sistema de ar condicionado central', concluida: false },
          { id: 't11', titulo: 'Elevadores e escadas rolantes', concluida: false },
        ],
      },
      {
        id: 'e4', nome: 'Acabamento', progresso: 0,
        tarefas: [
          { id: 't12', titulo: 'Revestimentos e pisos', concluida: false },
          { id: 't13', titulo: 'Pintura interna e externa', concluida: false },
          { id: 't14', titulo: 'Área de lazer e paisagismo', concluida: false },
          { id: 't15', titulo: 'Vistoria final e entrega', concluida: false },
        ],
      },
    ],
    tarefas: [],
    equipe: [],
    financeiro: [],
    timeline: [],
    ocorrencias: [],
    fotos: [],
    localizacao: {
      cidade: 'São Paulo',
      estado: 'SP',
      bairro: 'Consolação',
      rua: 'Rua Augusta, 500',
      cep: '01305-000',
    },
    candidaturasLista: mockCandidaturasObra5,
  },
};

export function getObraContratanteDetalheMock(id: string): ObraContratanteDetalhe | null {
  const obraBase = mockObrasContratante.find((o) => o.id === id);
  if (!obraBase) return null;

  const extra = detalhesMap[id] || detalhesMap['1'];

  return {
    ...obraBase,
    descricao: extra.descricao || 'Obra em andamento com acompanhamento completo.',
    valorPago: extra.valorPago || obraBase.orcamento * (obraBase.progresso / 100),
    valorRestante: extra.valorRestante || obraBase.orcamento * (1 - obraBase.progresso / 100),
    diasRestantes: extra.diasRestantes || 120,
    tarefasConcluidas: extra.tarefasConcluidas || Math.round(45 * obraBase.progresso / 100),
    tarefasTotal: extra.tarefasTotal || 45,
    etapas: extra.etapas || [],
    tarefas: extra.tarefas || [],
    timeline: extra.timeline || [],
    ocorrencias: extra.ocorrencias || [],
    equipe: extra.equipe || [],
    financeiro: extra.financeiro || [],
    fotos: extra.fotos || [],
    localizacao: extra.localizacao,
    candidaturasLista: extra.candidaturasLista,
  };
}
