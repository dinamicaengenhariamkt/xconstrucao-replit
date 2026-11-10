/**
 * XG44 — leitura administrativa de cada assinante do xgestão, em regras puras
 * (sem banco e sem `server-only`): o servidor monta as telas com elas e os
 * testes unitários as exercitam direto.
 *
 * A vigência NÃO é recalculada aqui: tudo parte de `assinaturaXgestaoVigente`
 * (`features/xgestao/lib/acesso-plano.ts`), a mesma regra da escrita, da aba
 * Plano do assinante e dos limites. O admin só dá nome ao estado.
 */
import {
  assinaturaXgestaoVigente,
  bloqueioDoTeste,
  CARENCIA_INADIMPLENCIA_DIAS,
  type AssinaturaXgestaoLida,
} from '@features/xgestao/lib/acesso-plano';
import { semUsoComRisco, type EngajamentoAssinante } from './engajamento';
import { getPlanCatalog, type PlanoTier } from '@shared/lib/plans-catalog';

const DIA_MS = 24 * 60 * 60 * 1000;

export type CodigoSituacaoAssinante =
  | 'em_teste'
  | 'teste_tolerancia'
  /** CRM-04 — assinou no teste (ou com 1ª cobrança futura) e ainda não pagou nada. */
  | 'aguardando_pagamento'
  | 'pago'
  | 'cancelamento_agendado'
  | 'inadimplente'
  | 'somente_leitura'
  | 'sem_teste';

/** Ordem de exibição: do funil (teste) para a base paga e depois quem saiu. */
export const SITUACOES_ASSINANTE: readonly CodigoSituacaoAssinante[] = [
  'em_teste',
  'teste_tolerancia',
  'aguardando_pagamento',
  'pago',
  'cancelamento_agendado',
  'inadimplente',
  'somente_leitura',
  'sem_teste',
];

export const ROTULO_SITUACAO: Record<CodigoSituacaoAssinante, string> = {
  em_teste: 'Em teste grátis',
  teste_tolerancia: 'Teste vencido (24h de tolerância)',
  aguardando_pagamento: 'Assinou no teste, aguardando 1º pagamento',
  pago: 'Assinatura paga',
  cancelamento_agendado: 'Cancelamento agendado',
  inadimplente: 'Pagamento pendente',
  somente_leitura: 'Somente leitura',
  sem_teste: 'Teste não iniciado',
};

/** O que a data `ate` significa em cada situação, para a tela não adivinhar. */
export const ROTULO_DATA_SITUACAO: Record<CodigoSituacaoAssinante, string | null> = {
  em_teste: 'Teste até',
  teste_tolerancia: 'Somente leitura em',
  aguardando_pagamento: '1ª cobrança em',
  pago: 'Próxima cobrança',
  cancelamento_agendado: 'Acesso até',
  inadimplente: 'Carência até',
  somente_leitura: null,
  sem_teste: null,
};

export function isCodigoSituacaoAssinante(valor: unknown): valor is CodigoSituacaoAssinante {
  return typeof valor === 'string' && (SITUACOES_ASSINANTE as readonly string[]).includes(valor);
}

export interface SituacaoAssinante {
  codigo: CodigoSituacaoAssinante;
  rotulo: string;
  /** Data-limite da situação (ver `ROTULO_DATA_SITUACAO`); ISO. */
  ate: string | null;
  /** Dias inteiros até `ate`, arredondados para cima; nunca negativo. */
  diasRestantes: number | null;
  /** Por que a conta está em somente leitura; `null` nas demais situações. */
  motivo: string | null;
  /**
   * CRM-12 — só no `inadimplente`: dias inteiros desde o vencimento não pago
   * (`renovaEm`). `null` nas demais situações.
   */
  diasEmAtraso: number | null;
}

/**
 * Campos da assinatura que a situação lê. `primeiroPagamentoEm` e `fimTesteEm`
 * são opcionais: leituras antigas (e testes) que não os trazem continuam
 * vendo "Assinatura paga" como antes.
 */
export type AssinaturaParaSituacao = AssinaturaXgestaoLida & {
  primeiroPagamentoEm?: Date | null;
  fimTesteEm?: Date | null;
};

export type AssinaturaCandidata = AssinaturaParaSituacao & { createdAt: Date };

/**
 * Escolhe a assinatura que vale para o titular, na MESMA ordem de
 * `situacaoPlanoXgestao` (`plano-empresa.ts`): ativa, depois inadimplente,
 * depois as demais; empate pela mais recente. Se a escolha fosse diferente, o
 * admin poderia dizer "pago" para quem o app trata como somente leitura.
 */
export function escolherAssinaturaCanonica<T extends AssinaturaCandidata>(linhas: readonly T[]): T | null {
  const peso = (status: string) => (status === 'ativa' ? 0 : status === 'inadimplente' ? 1 : 2);
  let escolhida: T | null = null;
  for (const linha of linhas) {
    if (
      !escolhida
      || peso(linha.status) < peso(escolhida.status)
      || (peso(linha.status) === peso(escolhida.status) && linha.createdAt > escolhida.createdAt)
    ) {
      escolhida = linha;
    }
  }
  return escolhida;
}

function diasAte(data: Date, agora: Date): number {
  return Math.max(0, Math.ceil((data.getTime() - agora.getTime()) / DIA_MS));
}

function situacao(
  codigo: CodigoSituacaoAssinante,
  agora: Date,
  ate: Date | null = null,
  motivo: string | null = null,
  diasEmAtraso: number | null = null,
): SituacaoAssinante {
  return {
    codigo,
    rotulo: ROTULO_SITUACAO[codigo],
    ate: ate ? ate.toISOString() : null,
    diasRestantes: ate ? diasAte(ate, agora) : null,
    motivo,
    diasEmAtraso,
  };
}

/**
 * CRM-04 — assinatura paga ativa que ainda não teve o 1º pagamento e cuja 1ª
 * cobrança (`renovaEm`) é futura. Não é receita: não entra no recorrente pago.
 *
 * `primeiroPagamentoEm` só existe desde 10/11/2026; assinaturas anteriores têm
 * a coluna nula mesmo já pagas. Por isso a regra exige um sinal a mais: a
 * assinatura recebeu o mês bônus (`fimTesteEm`) ou o caixa não tem nenhuma
 * mensalidade do cliente (`jaPagou === false`). Sem esse sinal, segue "paga".
 */
export function aguardandoPrimeiroPagamento(
  assinatura: AssinaturaParaSituacao,
  agora = new Date(),
  jaPagou?: boolean,
): boolean {
  if (assinatura.provider === 'trial' || assinatura.status !== 'ativa' || assinatura.canceladaEm) return false;
  if (!(Number(assinatura.preco) > 0) || assinatura.primeiroPagamentoEm) return false;
  if (!assinatura.renovaEm || assinatura.renovaEm.getTime() <= agora.getTime()) return false;
  return Boolean(assinatura.fimTesteEm) || jaPagou === false;
}

/** Situação comercial do assinante a partir da assinatura canônica (ou nenhuma). */
export function situacaoAssinante(
  assinatura: AssinaturaParaSituacao | null,
  agora = new Date(),
  /** CRM-04 — o caixa tem alguma mensalidade deste cliente? `undefined` = não sabe. */
  opcoes: { jaPagou?: boolean } = {},
): SituacaoAssinante {
  // Sem nenhuma assinatura xgestão: o teste começa no primeiro acesso ao
  // produto (XG43), então esta conta ainda não abriu o xgestão.
  if (!assinatura) return situacao('sem_teste', agora);

  const renovaEm = assinatura.renovaEm;
  if (assinaturaXgestaoVigente(assinatura, agora)) {
    if (assinatura.provider === 'trial') {
      // Vigente implica `renovaEm` preenchido (ver `assinaturaXgestaoVigente`).
      return renovaEm!.getTime() > agora.getTime()
        ? situacao('em_teste', agora, renovaEm)
        : situacao('teste_tolerancia', agora, bloqueioDoTeste(renovaEm!));
    }
    if (assinatura.status === 'inadimplente') {
      const atraso = Math.max(0, Math.floor((agora.getTime() - renovaEm!.getTime()) / DIA_MS));
      return situacao('inadimplente', agora, new Date(renovaEm!.getTime() + CARENCIA_INADIMPLENCIA_DIAS * DIA_MS), null, atraso);
    }
    if (assinatura.canceladaEm) return situacao('cancelamento_agendado', agora, renovaEm);
    if (aguardandoPrimeiroPagamento(assinatura, agora, opcoes.jaPagou)) return situacao('aguardando_pagamento', agora, renovaEm);
    return situacao('pago', agora, renovaEm);
  }

  let motivo = 'Assinatura encerrada';
  if (assinatura.provider === 'trial') motivo = 'Teste grátis encerrado sem assinatura';
  else if (!(Number(assinatura.preco) > 0)) motivo = 'Sem plano pago';
  else if (assinatura.status === 'cancelada' || assinatura.canceladaEm) motivo = 'Assinatura cancelada';
  else if (assinatura.status === 'inadimplente') motivo = 'Pagamento não regularizado na carência';
  return situacao('somente_leitura', agora, null, motivo);
}

// ── Uso do plano ────────────────────────────────────────────────────────────

/**
 * - `livre`: abaixo de 80% do limite;
 * - `perto`: de 80% até antes do limite (oportunidade de upgrade);
 * - `no_limite`: usou tudo; o próximo cadastro é recusado;
 * - `acima`: mais do que o plano permite (rebaixou de plano com o uso maior);
 * - `sem_limite`: o plano não limita esse recurso;
 * - `bloqueado`: conta em somente leitura, nada novo pode ser criado.
 */
export type NivelUso = 'livre' | 'perto' | 'no_limite' | 'acima' | 'sem_limite' | 'bloqueado';

export interface UsoRecurso {
  usado: number;
  /** `null` = sem limite. */
  limite: number | null;
  nivel: NivelUso;
  /** Percentual do limite (pode passar de 100); `null` sem limite ou bloqueado. */
  percentual: number | null;
}

export const LIMIAR_PERTO_DO_LIMITE = 0.8;
/** Catálogo antigo usa 9999 como "sem limite"; a oferta nova usa `-1`/`null`. */
const SEM_LIMITE_A_PARTIR_DE = 9999;

/**
 * Regra única de "sem limite" do admin: `null`/`undefined` e negativo (`-1`) da
 * oferta nova, e o 9999 do catálogo antigo. Tela, lista e CSV leem daqui.
 */
export function limiteSemTeto(limite: number | null | undefined): boolean {
  return limite === null || limite === undefined || !Number.isFinite(limite) || limite < 0 || limite >= SEM_LIMITE_A_PARTIR_DE;
}

/** Limite como texto para tela e CSV: "sem limite" ou o número. */
export function formatarLimite(limite: number | null | undefined): string {
  return limiteSemTeto(limite) ? 'sem limite' : String(limite);
}

export function usoRecurso(usado: number, limite: number | null | undefined, somenteLeitura: boolean): UsoRecurso {
  const qtd = Math.max(0, Math.trunc(Number(usado) || 0));
  if (somenteLeitura) return { usado: qtd, limite: 0, nivel: 'bloqueado', percentual: null };
  if (limite === null || limite === undefined || limiteSemTeto(limite)) {
    return { usado: qtd, limite: null, nivel: 'sem_limite', percentual: null };
  }
  const percentual = limite === 0 ? (qtd === 0 ? 100 : Infinity) : Math.round((qtd / limite) * 100);
  let nivel: NivelUso = 'livre';
  if (qtd > limite) nivel = 'acima';
  else if (qtd === limite) nivel = 'no_limite';
  else if (qtd / limite >= LIMIAR_PERTO_DO_LIMITE) nivel = 'perto';
  return { usado: qtd, limite, nivel, percentual: Number.isFinite(percentual) ? percentual : null };
}

/**
 * Teto de links por obra no catálogo antigo, que não tem `linksPorObra`.
 * Espelha `LIMITE_LINKS_ATIVOS` de `obra-publica/server/token.ts` (que é
 * `server-only`); um teste unitário garante que os dois não se separem.
 */
export const LIMITE_LINKS_LEGADO = 5;

export interface LimitesAdmin {
  obras: number | null;
  pessoas: number | null;
  linksPorObra: number | null;
}

/**
 * Limites do tier vigente, com a mesma leitura que o app aplica na escrita:
 * obras pelo catálogo; pessoas só quando o catálogo define a cota (o legado
 * não tem); links pelo catálogo ou, no legado, pelo teto técnico de 5.
 */
export function limitesDoTier(tier: PlanoTier | null): LimitesAdmin {
  if (!tier) return { obras: 0, pessoas: 0, linksPorObra: 0 };
  const limites = getPlanCatalog('xgestao', tier).limites;
  const has = (chave: string) => Object.hasOwn(limites, chave);
  return {
    obras: has('obrasAtivas') ? limites.obrasAtivas : null,
    pessoas: has('pessoasEmpresa') ? limites.pessoasEmpresa : null,
    linksPorObra: has('linksPorObra') ? limites.linksPorObra : LIMITE_LINKS_LEGADO,
  };
}

// ── Atenção ─────────────────────────────────────────────────────────────────

export type SeveridadeAtencao = 'critica' | 'atencao' | 'info';

export interface MotivoAtencao {
  codigo:
    | 'inadimplente'
    | 'teste_tolerancia'
    | 'teste_acabando'
    /** CRM-04 — assinou no teste e a 1ª cobrança vence em até 7 dias. */
    | 'primeira_cobranca'
    | 'cancelamento_agendado'
    | 'acima_do_limite'
    | 'no_limite'
    | 'perto_do_limite'
    | 'somente_leitura_com_obras'
    /** XG46 — paga ou está no teste e não usa há 14 dias ou mais. */
    | 'sem_uso';
  severidade: SeveridadeAtencao;
  texto: string;
}

/** Teste que termina em até N dias entra na lista de atenção (remarketing). */
export const DIAS_TESTE_ACABANDO = 7;

const NOME_RECURSO = { obras: 'obras', pessoas: 'pessoas na equipe', links: 'links por obra' } as const;
export type RecursoPlano = keyof typeof NOME_RECURSO;

export interface UsoPlanoAdmin {
  obras: UsoRecurso;
  pessoas: UsoRecurso;
  /** Pior obra: o limite de links é por obra, então vale a que tem mais links. */
  links: UsoRecurso;
}

const PESO: Record<SeveridadeAtencao, number> = { critica: 0, atencao: 1, info: 2 };

function plural(n: number, um: string, varios: string) {
  return `${n} ${n === 1 ? um : varios}`;
}

/**
 * Por que o admin deveria olhar para este assinante agora, do mais grave ao
 * menos grave. Lista vazia = nada a fazer.
 */
export function motivosAtencao(
  situacaoAtual: SituacaoAssinante,
  uso: UsoPlanoAdmin,
  obrasGerenciadas: number,
  engajamento?: EngajamentoAssinante,
): MotivoAtencao[] {
  const motivos: MotivoAtencao[] = [];
  const dias = situacaoAtual.diasRestantes ?? 0;

  switch (situacaoAtual.codigo) {
    case 'inadimplente': {
      // CRM-12 — quantos dias de atraso, além de quando a carência acaba.
      const atraso = situacaoAtual.diasEmAtraso;
      const prefixo = atraso !== null && atraso > 0 ? `${plural(atraso, 'dia', 'dias')} em atraso; ` : 'Pagamento pendente; ';
      motivos.push({ codigo: 'inadimplente', severidade: 'critica', texto: `${prefixo}carência termina em ${plural(dias, 'dia', 'dias')}` });
      break;
    }
    case 'aguardando_pagamento':
      if (dias <= DIAS_TESTE_ACABANDO) {
        motivos.push({ codigo: 'primeira_cobranca', severidade: 'info', texto: dias === 0 ? '1ª cobrança vence hoje' : `1ª cobrança em ${plural(dias, 'dia', 'dias')}` });
      }
      break;
    case 'teste_tolerancia':
      motivos.push({ codigo: 'teste_tolerancia', severidade: 'critica', texto: 'Teste vencido; a conta vira somente leitura em menos de 24h' });
      break;
    case 'em_teste':
      if (dias <= DIAS_TESTE_ACABANDO) {
        motivos.push({ codigo: 'teste_acabando', severidade: 'atencao', texto: dias === 0 ? 'Teste grátis termina hoje' : `Teste grátis termina em ${plural(dias, 'dia', 'dias')}` });
      }
      break;
    case 'cancelamento_agendado':
      motivos.push({ codigo: 'cancelamento_agendado', severidade: 'atencao', texto: `Cancelou; acesso termina em ${plural(dias, 'dia', 'dias')}` });
      break;
    case 'somente_leitura':
      if (obrasGerenciadas > 0) {
        motivos.push({ codigo: 'somente_leitura_com_obras', severidade: 'info', texto: `Somente leitura com ${plural(obrasGerenciadas, 'obra cadastrada', 'obras cadastradas')}` });
      }
      break;
    default:
      break;
  }

  if (engajamento && semUsoComRisco(situacaoAtual.codigo, engajamento)) {
    motivos.push({
      codigo: 'sem_uso',
      severidade: 'atencao',
      texto: engajamento.diasSemUso === null ? 'Nenhum uso registrado' : `Sem usar há ${plural(engajamento.diasSemUso, 'dia', 'dias')}`,
    });
  }

  for (const recurso of ['obras', 'pessoas', 'links'] as const) {
    const item = uso[recurso];
    const nome = NOME_RECURSO[recurso];
    if (item.nivel === 'acima') {
      motivos.push({ codigo: 'acima_do_limite', severidade: 'critica', texto: `Acima do limite de ${nome} (${item.usado} de ${item.limite})` });
    } else if (item.nivel === 'no_limite') {
      motivos.push({ codigo: 'no_limite', severidade: 'info', texto: `No limite de ${nome} (${item.usado} de ${item.limite})` });
    } else if (item.nivel === 'perto') {
      motivos.push({ codigo: 'perto_do_limite', severidade: 'info', texto: `Perto do limite de ${nome} (${item.usado} de ${item.limite})` });
    }
  }

  return motivos.sort((a, b) => PESO[a.severidade] - PESO[b.severidade]);
}

/** Severidade mais alta de uma lista, para ordenar assinantes entre si. */
export function severidadeMaxima(motivos: readonly MotivoAtencao[]): SeveridadeAtencao | null {
  return motivos.reduce<SeveridadeAtencao | null>(
    (pior, motivo) => (pior === null || PESO[motivo.severidade] < PESO[pior] ? motivo.severidade : pior),
    null,
  );
}

/** Compara assinantes pela urgência: severidade, depois quantidade de motivos. */
export function compararAtencao(a: readonly MotivoAtencao[], b: readonly MotivoAtencao[]): number {
  const pa = severidadeMaxima(a);
  const pb = severidadeMaxima(b);
  const va = pa === null ? 9 : PESO[pa];
  const vb = pb === null ? 9 : PESO[pb];
  return va - vb || b.length - a.length;
}

export interface ResumoAssinaturas {
  total: number;
  porSituacao: Record<CodigoSituacaoAssinante, number>;
  precisamAtencao: number;
  criticos: number;
  pertoOuNoLimite: number;
  /** CRM-06 — em teste e o teste acaba em até 7 dias (atalho da home). */
  testeAcabando7d: number;
}

export function resumirAssinaturas(
  linhas: ReadonlyArray<{ situacao: SituacaoAssinante; atencao: readonly MotivoAtencao[] }>,
): ResumoAssinaturas {
  const porSituacao = Object.fromEntries(SITUACOES_ASSINANTE.map((codigo) => [codigo, 0])) as Record<CodigoSituacaoAssinante, number>;
  let precisamAtencao = 0;
  let criticos = 0;
  let pertoOuNoLimite = 0;
  let testeAcabando7d = 0;
  for (const linha of linhas) {
    if (linha.situacao.codigo === 'em_teste' && (linha.situacao.diasRestantes ?? Infinity) <= DIAS_TESTE_ACABANDO) testeAcabando7d += 1;
    porSituacao[linha.situacao.codigo] += 1;
    if (linha.atencao.length > 0) precisamAtencao += 1;
    if (severidadeMaxima(linha.atencao) === 'critica') criticos += 1;
    if (linha.atencao.some((m) => m.codigo === 'perto_do_limite' || m.codigo === 'no_limite' || m.codigo === 'acima_do_limite')) {
      pertoOuNoLimite += 1;
    }
  }
  return { total: linhas.length, porSituacao, precisamAtencao, criticos, pertoOuNoLimite, testeAcabando7d };
}

// ── Histórico ───────────────────────────────────────────────────────────────

const ROTULO_EVENTO: Record<string, string> = {
  // XG50 — anti-abuso e duplicidade.
  bonus_negado: 'Mês bônus negado (CPF/CNPJ já usado)',
  teste_negado: 'Teste negado (CPF/CNPJ já usado)',
  assinatura_duplicada_cancelada: 'Assinatura duplicada cancelada no gateway',
  pagamento_duplicado_estornado: 'Pagamento em dobro estornado automaticamente',
  pagamento_duplicado_estorno_falhou: 'Estorno automático do pagamento em dobro falhou (estornar no painel do Asaas)',
  teste_iniciado: 'Teste grátis iniciado',
  teste_aviso_confirmado: 'Aviso do teste confirmado',
  teste_oferta_atualizada: 'Oferta do teste atualizada',
  teste_expirado: 'Teste grátis encerrado',
  checkout: 'Assinou um plano',
  payment_created: 'Cobrança gerada',
  payment_succeeded: 'Pagamento confirmado',
  payment_failed: 'Pagamento recusado',
  renovacao: 'Renovação',
  falha_cobranca: 'Falha na cobrança',
  inadimplente: 'Ficou inadimplente',
  reativacao: 'Assinatura reativada',
  gateway_confirmed_reactivation: 'Reativação confirmada pelo gateway',
  gateway_unreachable_too_long: 'Encerrada: gateway sem resposta',
  grace_period_expired: 'Carência encerrada',
  cancelamento: 'Cancelamento',
  cancelamento_agendado: 'Cancelamento agendado pelo assinante',
  cancelamento_efetivado: 'Cancelamento efetivado',
  payment_refunded: 'Estorno ou chargeback',
  payment_deleted: 'Cobrança apagada no gateway',
  subscription_canceled: 'Assinatura cancelada no gateway',
};

/** Nome legível do evento; tipo desconhecido aparece cru em vez de sumir. */
export function rotuloEventoAssinatura(tipo: string): string {
  return ROTULO_EVENTO[tipo] ?? tipo;
}

const ROTULO_STATUS_ASSINATURA: Record<string, string> = {
  ativa: 'Ativa',
  inadimplente: 'Inadimplente',
  cancelada: 'Cancelada',
  expirada: 'Expirada',
  pendente_reativacao: 'Pendente de reativação',
};

export function rotuloStatusAssinatura(status: string): string {
  return ROTULO_STATUS_ASSINATURA[status] ?? status;
}
