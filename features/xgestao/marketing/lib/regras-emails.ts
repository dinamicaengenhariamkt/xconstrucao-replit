/**
 * XG52 — quem recebe qual e-mail automático do xgestão, em regras puras.
 *
 * A situação da conta NÃO é recalculada aqui: vem de `situacaoAssinante`
 * (`features/xgestao/admin/lib/situacao-assinante.ts`), a mesma do admin CRM,
 * que por sua vez parte de `assinaturaXgestaoVigente` (`acesso-plano.ts`).
 *
 * Duas famílias:
 * - transacionais: sobre a conta (teste acabando, teste acabou, cobrança em
 *   atraso, cancelamento confirmado). Não pedem opt-in; os avisos de prazo
 *   respeitam o switch "Avisos sobre sua assinatura" (`email_prazo`);
 * - marketing: só com consentimento ativo e sempre com link de descadastro.
 *
 * Idempotência: (usuário, tipo, referência) único em `xgestao_emails_enviados`.
 * A referência ancora o aviso no ciclo (ex.: o dia do fim do teste), então um
 * teste novo ou uma nova inadimplência geram outro aviso, e o mesmo não repete.
 */
import type { CodigoSituacaoAssinante } from '@features/xgestao/admin/lib/situacao-assinante';
import { marketingAtivo, type EstadoConsentimento } from './consentimento';

const DIA_MS = 24 * 60 * 60 * 1000;

export const TIPOS_EMAIL = [
  'teste_acaba_7d',
  'teste_acaba_3d',
  'teste_acaba_1d',
  'teste_acabou',
  'cobranca_atraso',
  'cancelamento_confirmado',
  'sem_obra_3d',
  'volta_7d',
  'volta_30d',
] as const;
export type TipoEmailXgestao = (typeof TIPOS_EMAIL)[number];
export type CategoriaEmail = 'transacional' | 'marketing';

export const CATEGORIA_EMAIL: Record<TipoEmailXgestao, CategoriaEmail> = {
  teste_acaba_7d: 'transacional',
  teste_acaba_3d: 'transacional',
  teste_acaba_1d: 'transacional',
  teste_acabou: 'transacional',
  cobranca_atraso: 'transacional',
  cancelamento_confirmado: 'transacional',
  sem_obra_3d: 'marketing',
  volta_7d: 'marketing',
  volta_30d: 'marketing',
};

/** Avisos de prazo da assinatura: obedecem ao switch `email_prazo`. */
const AVISOS_DE_PRAZO: ReadonlySet<TipoEmailXgestao> = new Set([
  'teste_acaba_7d', 'teste_acaba_3d', 'teste_acaba_1d', 'teste_acabou', 'cobranca_atraso',
]);

/** "Cadastrou e não criou obra": a partir de 3 dias, e só para quem entrou há até 30. */
export const DIAS_SEM_OBRA = 3;
export const JANELA_SEM_OBRA_DIAS = 30;
/** Convite para voltar: 7 a 13 dias e 30 a 44 dias depois de perder o acesso. */
export const JANELAS_VOLTA: ReadonlyArray<{ tipo: 'volta_7d' | 'volta_30d'; de: number; ate: number }> = [
  { tipo: 'volta_7d', de: 7, ate: 13 },
  { tipo: 'volta_30d', de: 30, ate: 44 },
];

/** Situações em que a conta pode criar obra (o convite a começar faz sentido). */
const PODE_CRIAR_OBRA: ReadonlySet<CodigoSituacaoAssinante> = new Set([
  'sem_teste', 'em_teste', 'teste_tolerancia', 'aguardando_pagamento', 'pago',
]);

const PAPEIS_ADMIN = new Set(['admin', 'superadmin']);

export interface LinhaRotinaEmail {
  userId: string;
  email: string;
  nome: string | null;
  role: string;
  ativo: boolean;
  contaInterna: boolean;
  marketing: EstadoConsentimento;
  /** Switch "Avisos sobre sua assinatura" (`email_prazo`); ausente = ligado. */
  avisosAssinatura: boolean;
  situacao: { codigo: CodigoSituacaoAssinante; ate: string | null; diasRestantes: number | null };
  /** Quando pediu o cancelamento (situação `cancelamento_agendado`). */
  cancelamentoPedidoEm: string | null;
  /** Entrada no xgestão (`user_roles.criado_em`). */
  entradaEm: Date;
  obrasGerenciadas: number;
  /** Quando perdeu o acesso (teste vencido sem assinar ou assinatura encerrada). */
  saidaEm: Date | null;
}

export interface EmailPlanejado {
  userId: string;
  tipo: TipoEmailXgestao;
  categoria: CategoriaEmail;
  referencia: string;
}

/** Dia no fuso de São Paulo (`AAAA-MM-DD`), a âncora das referências. */
export function diaSp(data: Date | string): string {
  return new Date(data).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

/** Conta interna, admin e conta desativada nunca recebem e-mail da rotina. */
export function contaForaDaRotina(linha: Pick<LinhaRotinaEmail, 'role' | 'ativo' | 'contaInterna'>): boolean {
  return !linha.ativo || linha.contaInterna || PAPEIS_ADMIN.has(linha.role);
}

function tipoTesteAcabando(dias: number): TipoEmailXgestao | null {
  if (dias <= 1) return 'teste_acaba_1d';
  if (dias <= 3) return 'teste_acaba_3d';
  if (dias <= 7) return 'teste_acaba_7d';
  return null;
}

/** E-mails que esta conta deveria receber hoje (antes da idempotência e do teto). */
export function emailsDoDia(linha: LinhaRotinaEmail, agora = new Date()): EmailPlanejado[] {
  if (contaForaDaRotina(linha)) return [];
  const saida: EmailPlanejado[] = [];
  const add = (tipo: TipoEmailXgestao, referencia: string) => {
    if (AVISOS_DE_PRAZO.has(tipo) && !linha.avisosAssinatura) return;
    if (CATEGORIA_EMAIL[tipo] === 'marketing' && !marketingAtivo(linha.marketing)) return;
    saida.push({ userId: linha.userId, tipo, categoria: CATEGORIA_EMAIL[tipo], referencia });
  };

  const { codigo, ate, diasRestantes } = linha.situacao;
  if (codigo === 'em_teste' && ate && diasRestantes !== null) {
    const tipo = tipoTesteAcabando(diasRestantes);
    if (tipo) add(tipo, diaSp(ate));
  }
  if (codigo === 'teste_tolerancia' && ate) add('teste_acabou', diaSp(ate));
  if (codigo === 'inadimplente' && ate) add('cobranca_atraso', diaSp(ate));
  if (codigo === 'cancelamento_agendado' && ate) add('cancelamento_confirmado', diaSp(linha.cancelamentoPedidoEm ?? ate));

  const diasDesdeEntrada = (agora.getTime() - linha.entradaEm.getTime()) / DIA_MS;
  if (
    linha.obrasGerenciadas === 0
    && PODE_CRIAR_OBRA.has(codigo)
    && diasDesdeEntrada >= DIAS_SEM_OBRA
    && diasDesdeEntrada <= JANELA_SEM_OBRA_DIAS
  ) {
    add('sem_obra_3d', 'unico');
  }

  if (codigo === 'somente_leitura' && linha.saidaEm) {
    const dias = Math.floor((agora.getTime() - linha.saidaEm.getTime()) / DIA_MS);
    const janela = JANELAS_VOLTA.find((j) => dias >= j.de && dias <= j.ate);
    if (janela) add(janela.tipo, diaSp(linha.saidaEm));
  }
  return saida;
}

/** Teto diário (plano free do Brevo: 300/dia para TODOS os e-mails da conta). */
export const TETO_PADRAO = 200;
export const TETO_MAXIMO = 290;

export function tetoDiario(env: Record<string, string | undefined> = process.env): number {
  const n = Number(env.XGESTAO_EMAILS_TETO_DIARIO);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return TETO_PADRAO;
  return Math.min(n, TETO_MAXIMO);
}

/**
 * Corta pelo teto do dia, já descontando o que saiu hoje. Transacional vem
 * antes de marketing; dentro de cada grupo, a ordem de entrada é mantida.
 */
export function aplicarTeto<T extends { categoria: CategoriaEmail }>(
  planejados: readonly T[],
  teto: number,
  jaEnviadosHoje: number,
): { enviar: T[]; adiados: T[] } {
  const ordenados = [
    ...planejados.filter((p) => p.categoria === 'transacional'),
    ...planejados.filter((p) => p.categoria === 'marketing'),
  ];
  const vagas = Math.max(0, teto - jaEnviadosHoje);
  return { enviar: ordenados.slice(0, vagas), adiados: ordenados.slice(vagas) };
}
