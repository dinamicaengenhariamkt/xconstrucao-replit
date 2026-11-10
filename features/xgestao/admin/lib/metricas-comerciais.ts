/**
 * XG45 — métricas comerciais do xgestão para o admin (Lote B), em regras puras:
 * funil do teste grátis, cancelamentos e receita por plano. O servidor só lê
 * as assinaturas e entrega aqui; os testes unitários exercitam tudo sem banco.
 *
 * Vigência e situação continuam vindo de `acesso-plano.ts` e
 * `situacao-assinante.ts`: nada aqui reinterpreta se uma conta pode editar.
 */
import {
  assinaturaXgestaoVigente,
  bloqueioDoTeste,
  CARENCIA_INADIMPLENCIA_DIAS,
} from '@features/xgestao/lib/acesso-plano';
import type { CodigoSituacaoAssinante } from './situacao-assinante';

const DIA_MS = 24 * 60 * 60 * 1000;
const TESTE = 'trial';

export interface AssinaturaHistorica {
  id: string;
  userId: string;
  status: string;
  provider: string;
  tier: string;
  plano: string;
  preco: string | number;
  createdAt: Date;
  renovaEm: Date | null;
  canceladaEm: Date | null;
  /** CRM-03 — motivo informado ao cancelar (opcional; leituras antigas não trazem). */
  motivoCancelamento?: string | null;
  motivoCancelamentoTexto?: string | null;
}

function paga(a: AssinaturaHistorica): boolean {
  return a.provider !== TESTE && Number(a.preco) > 0;
}

function maisAntiga<T extends { createdAt: Date }>(lista: readonly T[]): T | null {
  return lista.reduce<T | null>((m, a) => (m === null || a.createdAt < m.createdAt ? a : m), null);
}

function maisRecente<T extends { createdAt: Date }>(lista: readonly T[]): T | null {
  return lista.reduce<T | null>((m, a) => (m === null || a.createdAt > m.createdAt ? a : m), null);
}

/** Mês civil em São Paulo (`YYYY-MM`), o mesmo fuso das datas mostradas. */
export function mesSaoPaulo(data: Date): string {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' })
    .formatToParts(data);
  const ano = partes.find((p) => p.type === 'year')!.value;
  const mes = partes.find((p) => p.type === 'month')!.value;
  return `${ano}-${mes}`;
}

/** Início do mês corrente em São Paulo (00:00 de lá = 03:00 UTC). */
export function inicioDoMesSaoPaulo(agora: Date): Date {
  const [ano, mes] = mesSaoPaulo(agora).split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, 1, 3, 0, 0));
}

function arredondar(valor: number, casas = 1): number {
  const f = 10 ** casas;
  return Math.round(valor * f) / f;
}

// ── Funil do teste ──────────────────────────────────────────────────────────

export type EstadoFunil = 'em_teste' | 'convertido' | 'perdido';

export interface JornadaTeste {
  userId: string;
  inicioTeste: Date;
  fimTeste: Date | null;
  estado: EstadoFunil;
  /** Assinou antes de a conta virar somente leitura: ganhou o +1 mês (XG43). */
  comBonus: boolean;
  /** Data da 1ª assinatura paga, se houve. */
  assinouEm: Date | null;
  diasAteAssinar: number | null;
  planoAssinado: string | null;
}

/**
 * Jornada de quem iniciou o teste. `null` para quem nunca teve teste (conta
 * liberada que ainda não abriu o xgestão, ou assinatura anterior ao teste).
 * Só conta como conversão a assinatura paga feita depois do início do teste.
 */
export function jornadaDoTeste(assinaturas: readonly AssinaturaHistorica[], agora = new Date()): JornadaTeste | null {
  const teste = maisAntiga(assinaturas.filter((a) => a.provider === TESTE));
  if (!teste) return null;
  const primeiraPaga = maisAntiga(assinaturas.filter((a) => paga(a) && a.createdAt >= teste.createdAt));
  const base = { userId: teste.userId, inicioTeste: teste.createdAt, fimTeste: teste.renovaEm };
  if (primeiraPaga) {
    const comBonus = teste.renovaEm !== null && primeiraPaga.createdAt.getTime() <= bloqueioDoTeste(teste.renovaEm).getTime();
    return {
      ...base,
      estado: 'convertido',
      comBonus,
      assinouEm: primeiraPaga.createdAt,
      diasAteAssinar: Math.max(0, (primeiraPaga.createdAt.getTime() - teste.createdAt.getTime()) / DIA_MS),
      planoAssinado: primeiraPaga.plano,
    };
  }
  const vigente = assinaturaXgestaoVigente({ ...teste, preco: teste.preco }, agora);
  return { ...base, estado: vigente ? 'em_teste' : 'perdido', comBonus: false, assinouEm: null, diasAteAssinar: null, planoAssinado: null };
}

export interface CoorteFunil {
  /** Mês de início do teste (`YYYY-MM`, São Paulo). */
  mes: string;
  iniciados: number;
  emTeste: number;
  convertidos: number;
  perdidos: number;
  /** convertidos / (convertidos + perdidos): só quem já decidiu. */
  taxaConversao: number | null;
}

export interface FunilTeste {
  iniciados: number;
  emTeste: number;
  convertidos: number;
  /** Assinaram durante o teste (com o +1 mês). */
  convertidosNoTeste: number;
  /** Assinaram depois que a conta virou somente leitura (remarketing). */
  convertidosDepois: number;
  perdidos: number;
  /** Liberados para o xgestão que nunca abriram o produto. */
  semTeste: number;
  /** convertidos / (convertidos + perdidos), em %. `null` sem ninguém decidido. */
  taxaConversao: number | null;
  /** convertidos / iniciados, em %. */
  taxaGeral: number | null;
  mediaDiasAteAssinar: number | null;
  medianaDiasAteAssinar: number | null;
  coortes: CoorteFunil[];
}

function pct(parte: number, total: number): number | null {
  return total > 0 ? arredondar((parte / total) * 100) : null;
}

function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const v = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(v.length / 2);
  return v.length % 2 ? v[meio] : (v[meio - 1] + v[meio]) / 2;
}

export const MAX_COORTES = 12;

export function calcularFunil(jornadas: readonly (JornadaTeste | null)[]): FunilTeste {
  const validas = jornadas.filter((j): j is JornadaTeste => j !== null);
  const convertidos = validas.filter((j) => j.estado === 'convertido');
  const perdidos = validas.filter((j) => j.estado === 'perdido').length;
  const dias = convertidos.map((j) => j.diasAteAssinar!).filter((d) => Number.isFinite(d));

  const porMes = new Map<string, CoorteFunil>();
  for (const j of validas) {
    const mes = mesSaoPaulo(j.inicioTeste);
    const c = porMes.get(mes) ?? { mes, iniciados: 0, emTeste: 0, convertidos: 0, perdidos: 0, taxaConversao: null };
    c.iniciados += 1;
    if (j.estado === 'em_teste') c.emTeste += 1;
    else if (j.estado === 'convertido') c.convertidos += 1;
    else c.perdidos += 1;
    porMes.set(mes, c);
  }
  const coortes = [...porMes.values()]
    .map((c) => ({ ...c, taxaConversao: pct(c.convertidos, c.convertidos + c.perdidos) }))
    .sort((a, b) => b.mes.localeCompare(a.mes))
    .slice(0, MAX_COORTES);

  return {
    iniciados: validas.length,
    emTeste: validas.filter((j) => j.estado === 'em_teste').length,
    convertidos: convertidos.length,
    convertidosNoTeste: convertidos.filter((j) => j.comBonus).length,
    convertidosDepois: convertidos.filter((j) => !j.comBonus).length,
    perdidos,
    semTeste: jornadas.length - validas.length,
    taxaConversao: pct(convertidos.length, convertidos.length + perdidos),
    taxaGeral: pct(convertidos.length, validas.length),
    mediaDiasAteAssinar: dias.length ? arredondar(dias.reduce((a, b) => a + b, 0) / dias.length) : null,
    medianaDiasAteAssinar: dias.length ? arredondar(mediana(dias)!) : null,
    coortes,
  };
}

// ── Cancelamentos ───────────────────────────────────────────────────────────

export type TipoSaida = 'agendado' | 'inadimplente' | 'encerrado';

export interface SaidaAssinante {
  userId: string;
  tipo: TipoSaida;
  plano: string;
  tier: string;
  valorMensal: number;
  /** agendado: fim do acesso; inadimplente: fim da carência; encerrado: quando perdeu o acesso. */
  data: string;
  /** CRM-03 — motivo escolhido ao cancelar (`null` = não informou ou não cancelou). */
  motivo: string | null;
  motivoTexto: string | null;
}

function motivoDe(a: AssinaturaHistorica): Pick<SaidaAssinante, 'motivo' | 'motivoTexto'> {
  return { motivo: a.motivoCancelamento ?? null, motivoTexto: a.motivoCancelamentoTexto ?? null };
}

/**
 * Quando o assinante pago perdeu (ou perde) o acesso, pela mesma regra de
 * `assinaturaXgestaoVigente`:
 * - cancelamento agendado vale até `renovaEm` (ainda `ativa`, ou já `cancelada`
 *   pelo job, que grava o evento `cancelamento_efetivado`);
 * - inadimplência (e a expiração que vem depois) vale até `renovaEm + 7 dias`;
 * - encerrada na hora (gateway, troca de plano), em `canceladaEm`.
 */
export function fimDoAcessoPago(a: AssinaturaHistorica, efetivadas: ReadonlySet<string> = new Set()): Date | null {
  const carencia = (d: Date) => new Date(d.getTime() + CARENCIA_INADIMPLENCIA_DIAS * DIA_MS);
  if (a.status === 'ativa') return a.canceladaEm ? a.renovaEm : null;
  if (a.status === 'inadimplente' || a.status === 'expirada') {
    return a.renovaEm ? carencia(a.renovaEm) : a.canceladaEm;
  }
  if (a.status === 'cancelada' && efetivadas.has(a.id) && a.renovaEm) return a.renovaEm;
  return a.canceladaEm ?? a.renovaEm;
}

export interface Cancelamentos {
  /** Início do mês corrente (São Paulo), ISO. */
  desde: string;
  agendados: { quantidade: number; mrr: number };
  inadimplentes: { quantidade: number; mrr: number };
  encerradosNoMes: { quantidade: number; mrr: number };
  /**
   * Começaram a pagar no mês: 1ª assinatura paga OU volta de quem não pagava no
   * início do mês (ADM-11). Troca de plano sem interrupção não conta.
   */
  novasNoMes: { quantidade: number; mrr: number };
  /** Parte de `novasNoMes` que já tinha pago antes (reativação). */
  reativacoesNoMes: number;
  /** Pedidos de cancelamento feitos pelo assinante no mês (eventos). */
  pedidosNoMes: number;
  /** encerrados no mês / pagantes no início do mês, em %. */
  taxaCancelamentoMes: number | null;
  pagantesInicioMes: number;
  saidas: SaidaAssinante[];
}

/**
 * Cancelamento é por assinante, não por linha: trocar de plano encerra a
 * assinatura antiga mas não é perda. Perdeu = não tem mais assinatura paga
 * vigente, e o fim do acesso caiu no mês corrente.
 */
export function calcularCancelamentos(
  porUsuario: ReadonlyMap<string, readonly AssinaturaHistorica[]>,
  pedidosNoMes: number,
  agora = new Date(),
  /** Assinaturas com o evento `cancelamento_efetivado` (fim agendado cumprido). */
  efetivadas: ReadonlySet<string> = new Set(),
): Cancelamentos {
  const desde = inicioDoMesSaoPaulo(agora);
  const r: Cancelamentos = {
    desde: desde.toISOString(),
    agendados: { quantidade: 0, mrr: 0 },
    inadimplentes: { quantidade: 0, mrr: 0 },
    encerradosNoMes: { quantidade: 0, mrr: 0 },
    novasNoMes: { quantidade: 0, mrr: 0 },
    reativacoesNoMes: 0,
    pedidosNoMes,
    taxaCancelamentoMes: null,
    pagantesInicioMes: 0,
    saidas: [],
  };
  // Instante logo antes da virada do mês: quem tinha acesso pago ali é pagante no início.
  const antesDoMes = new Date(desde.getTime() - 1);
  const cobre = (a: AssinaturaHistorica, t: Date) => {
    if (a.createdAt > t) return false;
    const fim = fimDoAcessoPago(a, efetivadas);
    return fim === null || fim > t;
  };
  for (const [userId, lista] of porUsuario) {
    const pagas = lista.filter(paga);
    if (pagas.length === 0) continue;
    const vigente = pagas
      .filter((a) => assinaturaXgestaoVigente({ ...a, preco: a.preco }, agora))
      .sort((a, b) => (a.status === 'ativa' ? 0 : 1) - (b.status === 'ativa' ? 0 : 1) || b.createdAt.getTime() - a.createdAt.getTime())[0];
    // ADM-11 — entrada no mês é por pessoa e por continuidade: quem não pagava
    // no início do mês e assinou no mês entrou, seja a 1ª vez ou uma volta.
    // Antes só a 1ª assinatura da vida contava, e a reativação inflava os
    // pagantes do início do mês (agora - novas + saídas).
    const pagavaNoInicio = pagas.some((a) => cobre(a, antesDoMes));
    if (pagavaNoInicio) r.pagantesInicioMes += 1;
    const entradaNoMes = maisAntiga(pagas.filter((a) => a.createdAt >= desde && a.createdAt <= agora));
    if (!pagavaNoInicio && entradaNoMes) {
      r.novasNoMes.quantidade += 1;
      r.novasNoMes.mrr += Number(entradaNoMes.preco);
      if (pagas.some((a) => a.createdAt < desde)) r.reativacoesNoMes += 1;
    }
    if (vigente) {
      const base = { userId, plano: vigente.plano, tier: vigente.tier, valorMensal: Number(vigente.preco), ...motivoDe(vigente) };
      if (vigente.status === 'inadimplente') {
        r.inadimplentes.quantidade += 1;
        r.inadimplentes.mrr += base.valorMensal;
        r.saidas.push({ ...base, tipo: 'inadimplente', data: fimDoAcessoPago(vigente, efetivadas)!.toISOString() });
      } else if (vigente.canceladaEm) {
        r.agendados.quantidade += 1;
        r.agendados.mrr += base.valorMensal;
        r.saidas.push({ ...base, tipo: 'agendado', data: vigente.renovaEm!.toISOString() });
      }
      continue;
    }
    const ultima = maisRecente(pagas)!;
    const fim = fimDoAcessoPago(ultima, efetivadas);
    if (fim && fim >= desde && fim <= agora) {
      r.encerradosNoMes.quantidade += 1;
      r.encerradosNoMes.mrr += Number(ultima.preco);
      r.saidas.push({ userId, plano: ultima.plano, tier: ultima.tier, valorMensal: Number(ultima.preco), tipo: 'encerrado', data: fim.toISOString(), ...motivoDe(ultima) });
    }
  }
  r.taxaCancelamentoMes = pct(r.encerradosNoMes.quantidade, r.pagantesInicioMes);
  r.saidas.sort((a, b) => a.data.localeCompare(b.data));
  return r;
}

// ── Receita por plano ───────────────────────────────────────────────────────

export interface LinhaReceitaPlano {
  tier: string;
  /** Pagando e renovando. */
  pagantes: number;
  /** Receita que renova no próximo ciclo (só `pago`). */
  mrr: number;
  /** Pagaram o período, mas cancelaram: não renovam. */
  saindo: number;
  mrrSaindo: number;
  inadimplentes: number;
  mrrEmRisco: number;
  emTeste: number;
  /** CRM-04 — assinaram no teste e ainda não pagaram: fora do recorrente. */
  aguardando: number;
  mrrAguardando: number;
}

export interface ReceitaPlanos {
  porPlano: LinhaReceitaPlano[];
  mrr: number;
  pagantes: number;
  /** mrr / pagantes; `null` sem pagantes. */
  ticketMedio: number | null;
  mrrSaindo: number;
  mrrEmRisco: number;
  /** CRM-04 — valor mensal de quem assinou no teste e ainda não pagou. */
  aguardandoPrimeiroPagamento: number;
  mrrAguardando: number;
}

export const ORDEM_TIERS = ['basic', 'basic_plus', 'premium', 'pro', 'enterprise'] as const;

export function calcularReceitaPorPlano(
  assinantes: ReadonlyArray<{ situacao: { codigo: CodigoSituacaoAssinante }; plano: { tier: string; valorMensal: number } }>,
): ReceitaPlanos {
  const linhas = new Map<string, LinhaReceitaPlano>();
  const linha = (tier: string) => {
    let l = linhas.get(tier);
    if (!l) {
      l = { tier, pagantes: 0, mrr: 0, saindo: 0, mrrSaindo: 0, inadimplentes: 0, mrrEmRisco: 0, emTeste: 0, aguardando: 0, mrrAguardando: 0 };
      linhas.set(tier, l);
    }
    return l;
  };
  for (const tier of ORDEM_TIERS.slice(0, 3)) linha(tier);
  for (const a of assinantes) {
    const { codigo } = a.situacao;
    const valor = a.plano.valorMensal;
    if (codigo === 'pago') { const l = linha(a.plano.tier); l.pagantes += 1; l.mrr += valor; }
    else if (codigo === 'cancelamento_agendado') { const l = linha(a.plano.tier); l.saindo += 1; l.mrrSaindo += valor; }
    else if (codigo === 'inadimplente') { const l = linha(a.plano.tier); l.inadimplentes += 1; l.mrrEmRisco += valor; }
    // CRM-04 — assinou no teste e não pagou: não é recorrente pago.
    else if (codigo === 'aguardando_pagamento') { const l = linha(a.plano.tier); l.aguardando += 1; l.mrrAguardando += valor; }
    else if (codigo === 'em_teste' || codigo === 'teste_tolerancia') linha(a.plano.tier).emTeste += 1;
  }
  const ordem = (t: string) => {
    const i = (ORDEM_TIERS as readonly string[]).indexOf(t);
    return i < 0 ? 99 : i;
  };
  const porPlano = [...linhas.values()].sort((a, b) => ordem(a.tier) - ordem(b.tier));
  const soma = (k: keyof LinhaReceitaPlano) => porPlano.reduce((t, l) => t + (l[k] as number), 0);
  const mrr = soma('mrr');
  const pagantes = soma('pagantes');
  return {
    porPlano,
    mrr,
    pagantes,
    ticketMedio: pagantes > 0 ? arredondar(mrr / pagantes, 2) : null,
    mrrSaindo: soma('mrrSaindo'),
    mrrEmRisco: soma('mrrEmRisco'),
    aguardandoPrimeiroPagamento: soma('aguardando'),
    mrrAguardando: soma('mrrAguardando'),
  };
}
