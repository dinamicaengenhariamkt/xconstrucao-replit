'use client';

/**
 * XG44 — peças visuais da situação de um assinante, usadas na home, na lista
 * e no detalhe. Um só lugar para cor e texto: as três telas não podem chamar
 * a mesma situação de jeitos diferentes.
 */
import { cn } from '@shared/lib/utils';
import { RiMailLine, RiWhatsappLine } from 'react-icons/ri';
import { linkEmail, linkWhatsapp } from '../lib/contato-assinante';
import { rotuloMotivoCancelamento } from '@features/xgestao/lib/motivo-cancelamento';
import {
  ROTULO_DATA_SITUACAO,
  type CodigoSituacaoAssinante,
  type MotivoAtencao,
  type NivelUso,
  type SituacaoAssinante,
  type UsoRecurso,
} from '../lib/situacao-assinante';

const dataCurta = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeZone: 'America/Sao_Paulo' });

export const SITUACAO_STYLE: Record<CodigoSituacaoAssinante, string> = {
  em_teste: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  teste_tolerancia: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  aguardando_pagamento: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  pago: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  cancelamento_agendado: 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300',
  inadimplente: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  somente_leitura: 'bg-gray-100 text-gray-600 dark:bg-muted dark:text-slate-300',
  sem_teste: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
};

export function formatarDataAdmin(iso: string | null): string {
  if (!iso) return '—';
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? '—' : dataCurta.format(data);
}

/** "Teste até 12 de fev. de 2027 (5 dias)" ou só o motivo, no somente leitura. */
export function descricaoSituacao(situacao: SituacaoAssinante): string | null {
  if (situacao.motivo) return situacao.motivo;
  const rotulo = ROTULO_DATA_SITUACAO[situacao.codigo];
  if (!rotulo || !situacao.ate) return null;
  const dias = situacao.diasRestantes;
  const sufixo = dias === null ? '' : dias === 0 ? ' (hoje)' : ` (${dias} ${dias === 1 ? 'dia' : 'dias'})`;
  // CRM-12 — inadimplente: quantos dias de atraso, além do fim da carência.
  const atraso = situacao.diasEmAtraso;
  const emAtraso = atraso !== null && atraso !== undefined && atraso > 0 ? ` · ${atraso} ${atraso === 1 ? 'dia' : 'dias'} em atraso` : '';
  return `${rotulo} ${formatarDataAdmin(situacao.ate)}${sufixo}${emAtraso}`;
}

export function SituacaoAssinanteBadge({
  situacao,
  detalhe = false,
  testId,
}: {
  situacao: SituacaoAssinante;
  /** Mostra a data/motivo abaixo do selo. */
  detalhe?: boolean;
  testId?: string;
}) {
  const descricao = detalhe ? descricaoSituacao(situacao) : null;
  return (
    <div data-testid={testId} data-situacao={situacao.codigo}>
      <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', SITUACAO_STYLE[situacao.codigo])}>
        {situacao.rotulo}
      </span>
      {descricao && <p className="mt-1 text-xs text-gray-500 dark:text-muted-foreground">{descricao}</p>}
    </div>
  );
}

const NIVEL_BARRA: Record<NivelUso, string> = {
  livre: 'bg-emerald-500',
  perto: 'bg-amber-500',
  no_limite: 'bg-orange-500',
  acima: 'bg-red-500',
  sem_limite: 'bg-primary/60',
  bloqueado: 'bg-gray-300 dark:bg-gray-600',
};

const NIVEL_TEXTO: Record<NivelUso, string> = {
  livre: 'text-gray-500 dark:text-muted-foreground',
  perto: 'text-amber-700 dark:text-amber-300',
  no_limite: 'text-orange-700 dark:text-orange-300',
  acima: 'text-red-700 dark:text-red-300',
  sem_limite: 'text-gray-500 dark:text-muted-foreground',
  bloqueado: 'text-gray-500 dark:text-muted-foreground',
};

/** "2 de 5", "3 · sem limite", "1 · somente leitura". */
export function textoUso(uso: UsoRecurso): string {
  if (uso.nivel === 'bloqueado') return `${uso.usado} · somente leitura`;
  if (uso.limite === null) return `${uso.usado} · sem limite`;
  return `${uso.usado} de ${uso.limite}`;
}

export function UsoRecursoBarra({
  rotulo,
  uso,
  testId,
  compacto = false,
}: {
  rotulo: string;
  uso: UsoRecurso;
  testId?: string;
  compacto?: boolean;
}) {
  const largura = uso.limite === null || uso.nivel === 'bloqueado'
    ? (uso.nivel === 'bloqueado' ? 100 : 0)
    : Math.min(100, uso.limite === 0 ? 100 : (uso.usado / uso.limite) * 100);
  return (
    <div data-testid={testId} data-nivel={uso.nivel} className={compacto ? 'space-y-0.5' : 'space-y-1'}>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-gray-500 dark:text-muted-foreground">{rotulo}</span>
        <span className={cn('font-semibold', NIVEL_TEXTO[uso.nivel])}>{textoUso(uso)}</span>
      </div>
      <div className={cn('overflow-hidden rounded-full bg-gray-100 dark:bg-muted', compacto ? 'h-1' : 'h-1.5')}>
        <div className={cn('h-full rounded-full', NIVEL_BARRA[uso.nivel])} style={{ width: `${largura}%` }} />
      </div>
    </div>
  );
}

const SEVERIDADE_STYLE: Record<MotivoAtencao['severidade'], string> = {
  critica: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300',
  atencao: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300',
};

export function MotivosAtencao({ motivos, testId }: { motivos: readonly MotivoAtencao[]; testId?: string }) {
  if (motivos.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" data-testid={testId}>
      {motivos.map((motivo) => (
        <li
          key={`${motivo.codigo}-${motivo.texto}`}
          data-codigo={motivo.codigo}
          className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', SEVERIDADE_STYLE[motivo.severidade])}
        >
          {motivo.texto}
        </li>
      ))}
    </ul>
  );
}

/**
 * CRM-01 — botões de contato: WhatsApp (só com telefone válido, nova aba) e
 * e-mail. Mesmo visual dos botões `outline` pequenos do admin.
 */
export function BotoesContato({
  telefone,
  email,
  testId,
  compacto = false,
}: {
  telefone: string | null | undefined;
  email: string | null | undefined;
  testId?: string;
  compacto?: boolean;
}) {
  const whatsapp = linkWhatsapp(telefone);
  const mailto = linkEmail(email);
  if (!whatsapp && !mailto) return null;
  const estilo = cn(
    'inline-flex items-center gap-1 rounded-full border border-gray-200 font-semibold text-gray-600 transition-colors hover:border-primary/40 hover:text-primary dark:border-border dark:text-slate-300',
    compacto ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
  );
  return (
    <div className="flex flex-wrap gap-1.5" data-testid={testId}>
      {whatsapp && (
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={estilo} data-testid={testId ? `${testId}-whatsapp` : undefined}>
          <RiWhatsappLine /> WhatsApp
        </a>
      )}
      {mailto && (
        <a href={mailto} className={estilo} data-testid={testId ? `${testId}-email` : undefined}>
          <RiMailLine /> E-mail
        </a>
      )}
    </div>
  );
}

const CHIP_INFO = 'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold';

/** CRM-08/10 — chips de saída e de troca de plano, na lista e no detalhe. */
export function ChipsSegmento({
  saida,
  trocas,
  totalPago,
  motivoCancelamento,
  retorno,
  testId,
}: {
  saida: { em: string | null; motivo: string } | null;
  trocas: { descidaAgendada: { em: string; plano: string } | null; subidaRecente: { em: string; plano: string } | null };
  totalPago: number;
  motivoCancelamento?: string | null;
  /** XG50 — voltou depois de cancelar e alerta de cancela-e-volta. */
  retorno?: { voltou: boolean; voltouEm: string | null; ciclos90d: number; tentativasBloqueadas: number; frequente: boolean } | null;
  testId?: string;
}) {
  if (!saida && !trocas.descidaAgendada && !trocas.subidaRecente && !retorno?.voltou && !retorno?.frequente) return null;
  return (
    <div className="flex flex-wrap gap-1" data-testid={testId}>
      {saida && (
        <span className={cn(CHIP_INFO, 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300')} data-chip="saiu">
          Cancelou / saiu{saida.em ? ` em ${formatarDataAdmin(saida.em)}` : ''}
          {motivoCancelamento ? ` · ${rotuloMotivoCancelamento(motivoCancelamento)}` : ''}
          {` · pagou ${totalPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
        </span>
      )}
      {trocas.descidaAgendada && (
        <span className={cn(CHIP_INFO, 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300')} data-chip="descida">
          Descida agendada: {trocas.descidaAgendada.plano} em {formatarDataAdmin(trocas.descidaAgendada.em)}
        </span>
      )}
      {retorno?.voltou && (
        <span className={cn(CHIP_INFO, 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300')} data-chip="voltou">
          Voltou depois de cancelar{retorno.voltouEm ? ` em ${formatarDataAdmin(retorno.voltouEm)}` : ''}
        </span>
      )}
      {retorno?.frequente && (
        <span className={cn(CHIP_INFO, 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300')} data-chip="cancela-volta">
          Cancela e volta com frequência
          {retorno.ciclos90d > 0 ? ` · ${retorno.ciclos90d} ${retorno.ciclos90d === 1 ? 'volta' : 'voltas'} em 90 dias` : ''}
          {retorno.tentativasBloqueadas > 0 ? ` · ${retorno.tentativasBloqueadas} ${retorno.tentativasBloqueadas === 1 ? 'tentativa bloqueada' : 'tentativas bloqueadas'}` : ''}
        </span>
      )}
      {trocas.subidaRecente && (
        <span className={cn(CHIP_INFO, 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300')} data-chip="subida">
          Subiu para {trocas.subidaRecente.plano} em {formatarDataAdmin(trocas.subidaRecente.em)}
        </span>
      )}
    </div>
  );
}
