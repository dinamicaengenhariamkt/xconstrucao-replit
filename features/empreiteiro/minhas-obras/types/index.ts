import type { ObraStatus, FilterChipOption } from '@features/shared/types';

export interface MinhaObra {
  id: string;
  titulo: string;
  endereco: string;
  imagemUrl: string;
  status: ObraStatus;
  progresso: number;
  /**
   * XG27 — o `progresso` acima é confiável para esta obra?
   *
   * `false` na obra própria sem nenhuma etapa cadastrada: não há cronograma
   * para medir, e o `0` do campo acima é só o valor de fallback. Quem exibe
   * deve dizer "cronograma não iniciado" em vez de "0%" — foi exatamente o
   * "0%" sem lastro que gerou o relato desta jornada.
   */
  progressoDisponivel: boolean;
  orcamento: number;
  /**
   * XG27 — dias além da data prevista (0 quando no prazo, sem prazo ou
   * concluída). `listMinhasObrasReal` já calculava isto para derivar o
   * `status`; passou a expor porque o dashboard mostra prazo no lugar do
   * percentual de execução.
   */
  diasAtraso: number;
  /**
   * XG27 — custo real da obra: saídas pagas onde o dono é o pagador. Vem dos
   * lançamentos, **não** de `obras.valor_pago` — coluna que a XG22 já havia
   * abandonado no detalhe por nunca ser escrita no xgestão.
   */
  custoReal: number;
  /**
   * XG27 — `custoReal` sobre o orçamento, em %. `null` quando a obra não tem
   * orçamento lançado: sem denominador não há percentual, e exibir verde
   * afirmaria uma folga que ninguém verificou.
   */
  consumoOrcamento: number | null;
  /** XG27 — ocorrências com status 'aberta'; já era contado, só não era exposto. */
  ocorrenciasAbertas: number;
  /**
   * Status cru do enum `obra_status`. Convive com `status` (derivado da UI do
   * marketplace): a obra própria do xgestão exibe o que o dono escolheu, o
   * marketplace segue exibindo o derivado.
   *
   * XG28 — subiu do `MinhaObraDetalhe` para cá, como a XG27 fez com
   * `diasAtraso`. A tabela do dashboard precisa do estado que o dono escolheu
   * (pausada, concluída), e o `status` acima não serve: ele **mistura** atraso
   * e pendências, que agora têm coluna própria — uma obra pausada apareceria
   * como "com atraso" ali. Custo zero: a query já traz a linha inteira de
   * `obras`.
   */
  statusObra?: 'planejamento' | 'em_andamento' | 'pausada' | 'concluida';
  dataInicio: string;
  dataPrevisaoFim: string;
  contratante: {
    nome: string;
    iniciais: string;
    cor: string;
    email?: string;
    avatarUrl?: string;
  };
  /** False para obra própria do xgestão (`clienteId = null`). */
  temContratante: boolean;
  /** Identifica obra operacional do xgestão sem alterar o contrato marketplace. */
  isObraPropria: boolean;
  tipo: string;
}

export interface MinhaObraDetalhe extends MinhaObra {
  // XG28 — `statusObra` subiu para `MinhaObra`, mesmo motivo que levou
  // `diasAtraso` para lá na XG27: a lista passou a entregar o campo que só o
  // detalhe entregava, e redeclarar aqui era um convite a divergirem.
  /** Editáveis no xgestão e visíveis no link público; o marketplace não usa. */
  descricao?: string;
  areaM2?: string;
  valorPago: number;
  aReceber: number;
  // XG27 — `diasAtraso` subiu para `MinhaObra`: a lista passou a expor o mesmo
  // número que o detalhe já entregava. Redeclarar aqui era inofensivo para o
  // compilador e um convite a divergirem.
  tarefasPendentes: number;
  /** XG10 — só as `em_andamento`; `tarefasPendentes` conta tudo que não fechou. */
  tarefasEmAndamento?: number;
  tarefasTotal: number;
  problemasAbertos: number;
  /** XG10 — contagem real por gravidade (o subtítulo do card era fixo). */
  problemasPorGravidade?: { critico: number; medio: number; baixo: number };
  equipeAtiva: number;
  etapas: MinhaObraEtapa[];
  tarefas: MinhaObraTarefa[];
  timeline: TimelineEvent[];
  fotos: ObraFoto[];
  checklists: MinhaObraChecklist[];
  documentos: ObraDocumento[];
  atividades: ObraAtividade[];
  ocorrencias: ObraOcorrencia[];
  financeiro: ObraFinanceiro;
  equipe: MembroEquipe[];
  localizacao?: {
    cidade: string;
    estado: string;
    bairro: string;
    rua: string;
    numero?: string;
    complemento?: string;
    cep: string;
  };
}

export interface MinhaObraEtapa {
  id: string;
  nome: string;
  progresso: number;
  tarefas: { id: string; titulo: string; concluida: boolean }[];
}

export interface MinhaObraTarefa {
  id: string;
  titulo: string;
  etapa: string;
  etapaId?: string | null;
  responsavel: string;
  prazo: string;
  status: 'pendente' | 'em_andamento' | 'bloqueado' | 'concluido';
  prioridade: 'alta' | 'media' | 'baixa';
  progresso?: number;
  bloqueioMotivo?: string;
  bloqueioInfo?: string;
  anexos?: number;
  descricao?: string;
}

export interface ChecklistItem {
  id: string;
  titulo: string;
  concluida: boolean;
}

export interface MinhaObraChecklist {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'seguranca' | 'diario' | 'etapa';
  status: 'pendente' | 'completo' | 'em_andamento';
  itens: ChecklistItem[];
  completadoEm?: string;
  progresso?: number;
  assinadoPor?: string;
  assinadoEm?: string;
  registroProfissional?: string;
  /**
   * XG21 — de quanto em quanto tempo o checklist zera. Ortogonal ao `tipo`:
   * o pedido foi reset diário num checklist de Segurança/EPIs.
   */
  recorrencia?: 'nenhuma' | 'diaria' | 'semanal';
  /** 0=domingo … 6=sábado. Só vale para `recorrencia: 'semanal'`. */
  recorrenciaDiaSemana?: number;
  /** Recorrente e ainda com item por marcar no período corrente. */
  pendenteNoPeriodo?: boolean;
}

export interface TimelineEvent {
  id: string;
  tipo: 'progresso' | 'tarefa' | 'documento' | 'problema' | 'nota';
  titulo: string;
  descricao: string;
  autor: string | null;
  data: string;
}

export interface ObraFoto {
  id: string;
  fileId?: string;
  url: string;
  data: string;
  tag?: string;
  fase?: 'antes' | 'durante' | 'agora';
  enviadaAoContratante?: boolean;
}

export interface ObraDocumento {
  id: string;
  nome: string;
  categoria: 'contrato' | 'art_rrt' | 'planta' | 'relatorio' | 'alvara' | 'laudo' | 'foto' | 'outros';
  tamanho?: string;
  data: string;
  status?: 'assinado' | 'valido' | 'vencendo' | 'novo';
  venceEmDias?: number;
  observacoes?: string;
  url?: string;
  /** XG10 — tipo do arquivo; decide se o preview abre embutido. */
  mime?: string;
  /** XG10 — anexo que é link externo (Drive, etc), não arquivo do bucket. */
  isLink?: boolean;
}

export interface ObraAtividade {
  id: string;
  nome: string;
  responsavel: string;
  inicio: string;
  fim: string;
  progresso: number;
  status: 'concluido' | 'em_andamento' | 'atrasado' | 'pendente';
  descricao?: string;
}

export interface ObraOcorrencia {
  id: string;
  titulo: string;
  descricao: string;
  severidade: 'critico' | 'medio' | 'baixo';
  status: 'aberto' | 'resolvido';
  responsavel: string;
  dataAbertura: string;
  prazo?: string;
  resolvidoEm?: string;
  resolvidoPor?: string;
  observacoesResolucao?: string;
  fotoUrl?: string;
}

export interface ObraMedicao {
  id: string;
  numero: number;
  data: string;
  valor: number;
  status: 'aprovada' | 'aguardando' | 'rejeitada';
}

export interface ObraFinanceiro {
  valorContratado: number;
  aditivos: number;
  valorTotal: number;
  saldoReceber: number;
  percentualRecebido: number;
  percentualExecutado: number;
  /**
   * ⚠️ **Não são medições.** Apesar do nome, `build-detalhe-server.ts` monta
   * este array a partir de linhas da tabela `financeiro` (lançamentos), com
   * `numero` gerado pelo índice do array. Não tem etapa, percentual, descrição,
   * fotos nem autor — e não terá, porque a origem é outra tabela.
   *
   * As medições de verdade vêm de `GET /api/obras/[id]/medicoes`
   * (`useObraMedicoes`). Renomear este campo tocaria vários consumidores e
   * ficou como dívida (XG12 §13) — até lá, **não use isto como fonte de
   * `medicaoId`**: era assim que as disputas recebiam IDs que não casavam.
   */
  medicoes: ObraMedicao[];
  /** Soma de entradas pagas (recebedor = empreiteiro). */
  receitaTotal: number;
  /** Soma de saídas pagas (pagador = empreiteiro: materiais, mão de obra, equipamentos). */
  custoTotal: number;
  /**
   * XG22 — soma dos valores de contrato dos prestadores da equipe ("prévia de
   * gasto da obra"). É **previsto**, não realizado: contrapõe-se a `custoTotal`,
   * que só existe depois que o dinheiro saiu. Só conta membros reais e ativos.
   */
  custoPrevistoEquipe: number;
}

export interface MembroEquipe {
  id: string;
  nome: string;
  iniciais: string;
  cor: string;
  papel: string;
  tipo: 'contratante' | 'engenheiro' | 'mestre' | 'equipe';
  telefone?: string;
  email?: string;
  registro?: string;
  ativo?: boolean;
  membros?: string;
  permissao?: 'visualizar' | 'editar' | 'admin';
  /**
   * XG22 — chave PIX do prestador, em qualquer formato (CPF, e-mail, aleatória).
   *
   * `null` é significativo nos campos deste bloco: o formulário o usa para
   * **limpar** o valor no PATCH, onde `undefined` significaria "não mexer".
   */
  pixChave?: string | null;
  /** XG22 — valor combinado; alimenta a prévia de gasto da obra. */
  valorContrato?: number | null;
  /** XG22 — contrato assinado: arquivo enviado OU link externo, nunca os dois. */
  contratoFileId?: string | null;
  contratoLinkUrl?: string | null;
  /** URL pronta para abrir o contrato (assinada quando é arquivo). */
  contratoUrl?: string;
  /** Nome original do arquivo, para rotular o link no card. */
  contratoNome?: string;
}

export interface MinhaObraCardProps {
  obra: MinhaObra;
}

export interface MinhasObrasGridProps {
  obras: MinhaObra[];
  basePath?: string;
  /**
   * XG29 — a listagem está servindo o xgestão?
   *
   * A flag existia em `MinhasObrasView` e **morria lá**: a grid era chamada sem
   * ela, e por isso o card não tinha como saber em que produto estava. Foi essa
   * lacuna que deixou o percentual de execução e o badge de saúde na tela do
   * xgestão depois de três jornadas que os removeram de todo o resto.
   */
  xgestao?: boolean;
}

export interface MinhasObrasFilterProps {
  filters: FilterChipOption[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
}
