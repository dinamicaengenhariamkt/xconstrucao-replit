'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { formatCurrencyRounded as formatCurrency } from '@shared/lib/formatters';
import { Button } from '@shared/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@shared/components/ui/dialog';
import { toast } from '@shared/hooks/use-toast';
import {
  useMinhasCandidaturas,
  useCancelarCandidatura,
} from '@features/empreiteiro/minhas-candidaturas/hooks/use-minhas-candidaturas';
import type { MinhaCandidaturaRow } from '@features/empreiteiro/minhas-candidaturas/api/service';
import {
  IconCalendarMonth as IconCalendar, IconCheckCircle, IconClose, IconPending as IconHourglassEmpty,
  IconPayments as IconWallet, IconLocationOn, IconArrowForward as IconArrowRight,
} from '@shared/components/icons';

type FiltroStatus = 'todas' | 'pendente' | 'aceita' | 'rejeitada';

const STATUS_BADGES: Record<MinhaCandidaturaRow['status'], { label: string; cls: string; Icon: any }> = {
  pendente: { label: 'Aguardando análise', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400', Icon: IconHourglassEmpty },
  aceita: { label: 'Aprovada', cls: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400', Icon: IconCheckCircle },
  rejeitada: { label: 'Rejeitada', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', Icon: IconClose },
};

function formatDateBR(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR');
}

export default function MinhasCandidaturasPage() {
  const { data: rows, isLoading } = useMinhasCandidaturas();
  const cancelar = useCancelarCandidatura();
  const [filtro, setFiltro] = useState<FiltroStatus>('todas');
  const [confirmCancel, setConfirmCancel] = useState<MinhaCandidaturaRow | null>(null);

  const candidaturas = rows ?? [];
  const filtradas = useMemo(() => {
    if (filtro === 'todas') return candidaturas;
    return candidaturas.filter((c) => c.status === filtro);
  }, [candidaturas, filtro]);

  const counts = useMemo(() => ({
    todas: candidaturas.length,
    pendente: candidaturas.filter((c) => c.status === 'pendente').length,
    aceita: candidaturas.filter((c) => c.status === 'aceita').length,
    rejeitada: candidaturas.filter((c) => c.status === 'rejeitada').length,
  }), [candidaturas]);

  function handleCancelConfirm() {
    if (!confirmCancel) return;
    const cand = confirmCancel;
    cancelar.mutate(cand.id, {
      onSuccess: () => {
        toast({ title: 'Proposta cancelada', description: `Sua candidatura em "${cand.obraNome ?? 'obra'}" foi cancelada.` });
        setConfirmCancel(null);
      },
      onError: (err: any) => {
        const msg = String(err?.message ?? '');
        const friendly = msg.includes('INVALID_STATE')
          ? 'Esta proposta não está mais pendente.'
          : 'Não foi possível cancelar agora.';
        toast({ title: 'Erro', description: friendly, variant: 'destructive' });
        setConfirmCancel(null);
      },
    });
  }

  return (
    <div className="p-10 flex flex-col gap-6" data-testid="minhas-candidaturas-page">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Minhas Candidaturas</h1>
        <p className="text-sm text-gray-500">Acompanhe o status das propostas enviadas para obras do marketplace.</p>
      </motion.div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap" data-testid="filtros-status">
        {([
          { key: 'todas', label: 'Todas' },
          { key: 'pendente', label: 'Pendentes' },
          { key: 'aceita', label: 'Aprovadas' },
          { key: 'rejeitada', label: 'Rejeitadas' },
        ] as { key: FiltroStatus; label: string }[]).map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFiltro(opt.key)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-semibold transition-colors',
              filtro === opt.key
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary/40',
            )}
            data-testid={`filtro-${opt.key}`}
          >
            {opt.label}
            <span className="ml-2 text-xs opacity-70">{counts[opt.key]}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3" data-testid="loading-state">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center" data-testid="empty-state">
          <p className="text-base font-bold text-gray-900 dark:text-white mb-1">
            {filtro === 'todas' ? 'Nenhuma candidatura enviada ainda' : 'Nenhuma candidatura neste status'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {filtro === 'todas'
              ? 'Explore o marketplace de obras disponíveis e envie suas propostas.'
              : 'Tente outro filtro ou explore novas obras no marketplace.'}
          </p>
          <Link
            href="/empreiteiro/novas-obras"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            data-testid="link-marketplace"
          >
            Ver obras disponíveis <IconArrowRight />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtradas.map((cand) => {
            const badge = STATUS_BADGES[cand.status];
            const Icon = badge.Icon;
            const valor = Number(cand.valorProposta) || 0;
            const isCancelada = cand.canceladaPeloEmpreiteiro;
            const detalheUrl = cand.status === 'aceita' && cand.obraId
              ? `/empreiteiro/minhas-obras/${cand.obraId}`
              : cand.obraId ? `/empreiteiro/novas-obras/${cand.obraId}` : null;

            return (
              <motion.div
                key={cand.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 flex flex-col md:flex-row md:items-center gap-4"
                data-testid={`candidatura-${cand.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate" data-testid={`obra-nome-${cand.id}`}>
                      {cand.obraNome ?? 'Obra'}
                    </h3>
                    <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 flex-shrink-0', badge.cls)}>
                      <Icon className="text-xs" />
                      {isCancelada ? 'Cancelada por você' : badge.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    {(cand.obraCidade || cand.obraUf) && (
                      <span className="flex items-center gap-1"><IconLocationOn className="text-sm" /> {cand.obraCidade}{cand.obraCidade && cand.obraUf ? '/' : ''}{cand.obraUf}</span>
                    )}
                    <span className="flex items-center gap-1"><IconWallet className="text-sm" /> {formatCurrency(valor)}</span>
                    {cand.prazoEstimado && (
                      <span className="flex items-center gap-1"><IconCalendar className="text-sm" /> {cand.prazoEstimado} meses</span>
                    )}
                    {cand.createdAt && (
                      <span>Enviada em {formatDateBR(cand.createdAt)}</span>
                    )}
                  </div>
                  {cand.status === 'rejeitada' && !isCancelada && cand.motivoRejeicao && (
                    <p className="mt-2 text-xs text-gray-500 italic">Motivo: {cand.motivoRejeicao}</p>
                  )}
                  {cand.status === 'aceita' && cand.mensagemContratante && (
                    <p className="mt-2 text-xs text-green-700 dark:text-green-400 italic">
                      Mensagem do contratante: "{cand.mensagemContratante}"
                    </p>
                  )}
                  {cand.anexos && cand.anexos.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {cand.anexos.map((anexo) => (
                        <a
                          key={anexo.id}
                          href={anexo.url ?? '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 dark:border-gray-700 ${anexo.url ? 'text-gray-700 dark:text-gray-300 hover:border-primary hover:bg-primary/5' : 'opacity-50 pointer-events-none text-gray-500'}`}
                          data-testid={`anexo-${cand.id}-${anexo.id}`}
                          title={anexo.originalName}
                        >
                          📎 <span className="max-w-[200px] truncate">{anexo.originalName}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {detalheUrl && (
                    <Link
                      href={detalheUrl}
                      className="px-4 py-2 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                      data-testid={`link-detalhe-${cand.id}`}
                    >
                      {cand.status === 'aceita' ? 'Acessar obra' : 'Ver detalhes'}
                    </Link>
                  )}
                  {cand.status === 'pendente' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                      onClick={() => setConfirmCancel(cand)}
                      disabled={cancelar.isPending}
                      data-testid={`button-cancelar-${cand.id}`}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={!!confirmCancel} onOpenChange={(open) => !open && !cancelar.isPending && setConfirmCancel(null)}>
        <DialogContent data-testid="confirm-cancelar">
          <DialogHeader>
            <DialogTitle>Cancelar candidatura?</DialogTitle>
            <DialogDescription>
              Sua proposta para "{confirmCancel?.obraNome ?? 'esta obra'}" será cancelada. Você pode se candidatar novamente depois, enquanto a obra estiver aberta.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCancel(null)} disabled={cancelar.isPending}>Voltar</Button>
            <Button variant="destructive" onClick={handleCancelConfirm} disabled={cancelar.isPending} data-testid="button-confirm-cancelar">
              {cancelar.isPending ? 'Cancelando…' : 'Sim, cancelar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
