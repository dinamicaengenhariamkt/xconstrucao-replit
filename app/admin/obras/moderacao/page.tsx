'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@shared/lib/utils';
import { useAdminObras } from '@features/admin/obras/hooks/use-obras-list';
import {
  OBRA_MODERACAO_LABEL,
  OBRA_MODERACAO_COLOR,
  type AdminObraStatusModeracao,
} from '@features/admin/obras/types/list';
import { Button } from '@shared/components/ui/button';
import { Skeleton } from '@shared/components/ui/skeleton';
import { useToast } from '@shared/hooks/use-toast';
import { formatCurrency } from '@shared/lib/formatters';
import {
  RiShieldCheckLine,
  RiCheckLine,
  RiCloseLine,
  RiTimeLine,
  RiAlertLine,
  RiArrowRightLine,
} from 'react-icons/ri';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@shared/components/ui/dialog';
import { Textarea } from '@shared/components/ui/textarea';

const TABS: { value: AdminObraStatusModeracao; label: string; icon: React.ElementType }[] = [
  { value: 'pendente', label: 'Em revisão', icon: RiTimeLine },
  { value: 'rejeitada', label: 'Rejeitadas', icon: RiAlertLine },
  { value: 'aprovada', label: 'Aprovadas', icon: RiCheckLine },
];

const toNum = (v: string | null | undefined): number => {
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export default function AdminObrasModeracaoPage() {
  const [tab, setTab] = useState<AdminObraStatusModeracao>('pendente');
  const [rejeitarId, setRejeitarId] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useAdminObras({
    page: 1,
    pageSize: 50,
    visibilidade: 'publicada',
    statusModeracao: tab,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'obras'] });
    qc.invalidateQueries({ queryKey: ['contratante', 'minhas-obras'] });
  };

  const aprovar = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/obras/${id}/aprovar`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Erro ${res.status}`);
      }
    },
    onSuccess: () => {
      toast({ title: 'Obra aprovada', description: 'Já aparece no marketplace.' });
      invalidate();
    },
    onError: (err) => {
      toast({
        title: 'Falha ao aprovar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const rejeitar = useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const res = await fetch(`/api/admin/obras/${id}/rejeitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ motivo }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Erro ${res.status}`);
      }
    },
    onSuccess: () => {
      toast({ title: 'Obra rejeitada', description: 'O contratante verá o motivo no detalhe.' });
      setRejeitarId(null);
      setMotivo('');
      invalidate();
    },
    onError: (err) => {
      toast({
        title: 'Falha ao rejeitar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const obras = data?.rows ?? [];

  return (
    <div className="p-6 md:p-10 space-y-8" data-testid="admin-obras-moderacao-page">
      <div className="flex items-start gap-3">
        <div className="p-3 bg-primary/10 text-primary rounded-2xl">
          <RiShieldCheckLine className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Moderação de obras
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aprove ou rejeite obras publicadas antes que cheguem ao marketplace.
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-100 dark:border-gray-800">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors',
              tab === t.value
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
            )}
            data-testid={`tab-moderacao-${t.value}`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : obras.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <RiShieldCheckLine className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">
            Nada por aqui
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Nenhuma obra com status "{OBRA_MODERACAO_LABEL[tab]}".
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {obras.map((obra) => {
            const modStatus = (obra.statusModeracao ?? 'pendente') as AdminObraStatusModeracao;
            const modColor = OBRA_MODERACAO_COLOR[modStatus];
            const cidadeUf = [obra.cidade, obra.uf].filter(Boolean).join(' - ');
            return (
              <div
                key={obra.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col md:flex-row gap-4 md:items-center"
                data-testid={`row-moderacao-${obra.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider', modColor)}>
                      {OBRA_MODERACAO_LABEL[modStatus]}
                    </span>
                    <span className="text-xs text-muted-foreground">{obra.tipo ?? '—'}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                    {obra.nome}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {obra.clienteNome ?? '—'}
                    {cidadeUf ? ` · ${cidadeUf}` : ''}
                  </p>
                  {obra.statusModeracao === 'rejeitada' && obra.motivoModeracao && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2 italic">
                      Motivo: {obra.motivoModeracao}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Valor total</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {formatCurrency(toNum(obra.valorTotal))}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/obras/${obra.id}`}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    data-testid={`link-detail-${obra.id}`}
                  >
                    Detalhes <RiArrowRightLine className="w-4 h-4" />
                  </Link>
                  {tab === 'pendente' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => {
                          setRejeitarId(obra.id);
                          setMotivo('');
                        }}
                        data-testid={`button-rejeitar-${obra.id}`}
                      >
                        <RiCloseLine className="w-4 h-4" />
                        Rejeitar
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => aprovar.mutate(obra.id)}
                        disabled={aprovar.isPending}
                        data-testid={`button-aprovar-${obra.id}`}
                      >
                        <RiCheckLine className="w-4 h-4" />
                        Aprovar
                      </Button>
                    </>
                  )}
                  {tab === 'rejeitada' && (
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => aprovar.mutate(obra.id)}
                      disabled={aprovar.isPending}
                      data-testid={`button-reaprovar-${obra.id}`}
                    >
                      <RiCheckLine className="w-4 h-4" />
                      Aprovar mesmo assim
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog
        open={rejeitarId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRejeitarId(null);
            setMotivo('');
          }
        }}
      >
        <DialogContent data-testid="dialog-rejeitar">
          <DialogHeader>
            <DialogTitle>Rejeitar obra</DialogTitle>
            <DialogDescription>
              Explique para o contratante o motivo da rejeição (5–500 caracteres). Ele poderá editar e republicar.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: O endereço informado não confere com a documentação. Anexe o IPTU atualizado."
            rows={5}
            maxLength={500}
            data-testid="input-motivo-rejeicao"
          />
          <p className="text-xs text-muted-foreground text-right">{motivo.length}/500</p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setRejeitarId(null);
                setMotivo('');
              }}
              disabled={rejeitar.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (rejeitarId) rejeitar.mutate({ id: rejeitarId, motivo: motivo.trim() });
              }}
              disabled={rejeitar.isPending || motivo.trim().length < 5}
              data-testid="confirm-rejeitar"
            >
              Confirmar rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
