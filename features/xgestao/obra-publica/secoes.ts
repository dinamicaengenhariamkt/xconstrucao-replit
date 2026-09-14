/**
 * Quais blocos da obra o link público expõe.
 *
 * O empreiteiro decide obra a obra. As chaves e os padrões vivem aqui porque
 * são consumidos pelo servidor (projeção), pela API (validação) e pela UI
 * (toggles) — divergir entre as três é o jeito de vazar conteúdo sem querer.
 *
 * Os padrões seguem XG04 §8: publicar o que evidencia andamento e reter o que
 * é registro operacional interno. Diário e ocorrências entram desligados por
 * conterem anotação de rotina e problema em aberto — conteúdo que o empreiteiro
 * deve escolher mostrar, não descobrir que mostrou.
 */
export const SECOES_PUBLICAS = [
  'etapas',
  'atualizacoes',
  'fotos',
  'checklists',
  'diario',
  'ocorrencias',
  'tarefas',
  'localizacao',
] as const;

export type SecaoPublica = (typeof SECOES_PUBLICAS)[number];

export type SecoesPublicas = Record<SecaoPublica, boolean>;

/**
 * Aplicado a todo link sem preferência salva, inclusive aos emitidos antes de
 * a coluna existir.
 *
 * ⚠️ **É uma mudança de comportamento deliberada, não retrocompatível.** Antes
 * desta revisão, diário e ocorrências apareciam em todo link público; com o
 * padrão abaixo, um link antigo deixa de exibi-los até que o dono os ligue.
 * A quebra foi aceita em 2026-09-02, com os links existentes ainda sendo de
 * teste — publicar registro operacional interno por herança é pior que exigir
 * uma decisão. Se um dia isso precisar ser retroativo, o caminho é um UPDATE
 * de backfill em `obra_share_links.secoes`, não mudar estes padrões.
 */
export const SECOES_PADRAO: SecoesPublicas = {
  etapas: true,
  atualizacoes: true,
  fotos: true,
  checklists: true,
  // Registro operacional: opt-in explícito.
  diario: false,
  ocorrencias: false,
  // Nunca esteve no link; entra como novidade desligada.
  tarefas: false,
  // Endereço em link sem login é risco de segurança física do canteiro (XG04 §8).
  // Mesmo ligado, expõe apenas o logradouro — nunca número, CEP ou coordenadas.
  localizacao: false,
};

/** Rótulos e explicações usados nos toggles da tela de edição. */
export const SECAO_LABELS: Record<SecaoPublica, { titulo: string; descricao: string }> = {
  etapas: { titulo: 'Etapas', descricao: 'Fases da obra com percentual concluído.' },
  // XG16 — "aprovados" era vocabulário de marketplace, onde existe um contratante
  // para aprovar. Em obra própria o avanço é registrado, não aprovado (XG15).
  atualizacoes: { titulo: 'Atualizações', descricao: 'Avanços registrados, com data e percentual.' },
  // A capa não entra aqui: ela identifica a obra no topo da página e segue
  // visível mesmo com a galeria desligada.
  fotos: { titulo: 'Galeria de fotos', descricao: 'Somente as fotos marcadas para o cliente. Não afeta a capa.' },
  checklists: { titulo: 'Checklists', descricao: 'Listas de verificação e itens concluídos.' },
  diario: { titulo: 'Diário de obra', descricao: 'Anotações do dia a dia. Reveja antes de publicar.' },
  ocorrencias: { titulo: 'Ocorrências', descricao: 'Problemas registrados, inclusive os em aberto.' },
  tarefas: { titulo: 'Tarefas', descricao: 'Pendências da equipe, com prazo e situação.' },
  localizacao: { titulo: 'Endereço', descricao: 'Mostra a rua além da cidade. Número e CEP nunca aparecem.' },
};

/**
 * Normaliza o que veio do banco. Valor ausente, malformado ou com chave
 * desconhecida cai no padrão — nunca em "tudo ligado", para que um dado
 * corrompido não vire exposição de conteúdo.
 */
export function normalizarSecoes(valor: unknown): SecoesPublicas {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return { ...SECOES_PADRAO };
  const bruto = valor as Record<string, unknown>;
  const resultado = { ...SECOES_PADRAO };
  for (const secao of SECOES_PUBLICAS) {
    if (typeof bruto[secao] === 'boolean') resultado[secao] = bruto[secao] as boolean;
  }
  return resultado;
}
