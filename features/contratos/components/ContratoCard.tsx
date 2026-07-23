'use client';

import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@shared/components/ui/button';
import { Skeleton } from '@shared/components/ui/skeleton';
import { toast } from '@shared/hooks/use-toast';
import { MarkdownView } from '@features/legal/components/MarkdownView';
import { RiFileList3Line, RiDownloadLine, RiQuillPenLine, RiCheckLine } from 'react-icons/ri';

interface ContratoApi {
  obraId: string;
  obraNome: string;
  contratoStatus: 'pendente_contratante' | 'pendente_empreiteiro' | 'assinado' | null;
  versaoTemplate: number;
  titulo: string;
  conteudo: string;
  partes: { contratanteNome: string; empreiteiraNome: string };
  assinaturas: Array<{ papel: 'contratante' | 'empreiteiro'; assinadoEm: string }>;
  papel: 'contratante' | 'empreiteiro' | 'admin';
  podeAssinar: boolean;
}

/**
 * J58 — card de contrato entre as partes, montado na tela de detalhe de cada
 * papel. Busca o contrato (com merge do template) e mostra o estado + ações:
 * assinar (quando é a vez), baixar PDF (client-side), cancelar (contratante).
 * Se a obra não tem contrato (contratoStatus null e não pendente), não renderiza.
 */
export function ContratoCard({ obraId }: { obraId: string }) {
  const qc = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery<ContratoApi>({
    queryKey: ['obra', 'contrato', obraId],
    queryFn: async () => {
      const res = await fetch(`/api/obras/${obraId}/contrato`);
      if (!res.ok) throw new Error('Erro ao carregar contrato');
      return res.json();
    },
    staleTime: 30_000,
  });

  const assinar = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/obras/${obraId}/contrato/assinar`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error === 'NAO_E_SUA_VEZ' ? 'Ainda não é a sua vez de assinar.' : 'Não foi possível assinar.');
      }
      return res.json();
    },
    onSuccess: (r) => {
      toast({
        title: r.efetivada ? 'Contrato assinado — obra iniciada!' : 'Contrato assinado',
        description: r.efetivada ? 'As duas partes assinaram. A obra foi iniciada.' : 'Aguardando a assinatura da outra parte.',
      });
      qc.invalidateQueries({ queryKey: ['obra', 'contrato', obraId] });
      qc.invalidateQueries({ queryKey: ['contratante', 'minhas-obras'] });
      qc.invalidateQueries({ queryKey: ['empreiteiro', 'minhas-obras'] });
    },
    onError: (e) => toast({ title: 'Erro', description: (e as Error).message, variant: 'destructive' }),
  });

  const cancelar = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/obras/${obraId}/contrato/cancelar`, { method: 'POST' });
      if (!res.ok) throw new Error('Não foi possível cancelar.');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Aceite cancelado', description: 'A obra foi reaberta para novas propostas.' });
      qc.invalidateQueries({ queryKey: ['obra', 'contrato', obraId] });
      qc.invalidateQueries({ queryKey: ['contratante', 'minhas-obras'] });
    },
    onError: (e) => toast({ title: 'Erro', description: (e as Error).message, variant: 'destructive' }),
  });

  const baixarPdf = async () => {
    if (!printRef.current) return;
    try {
      const { generateContratoPdf } = await import('../utils/generate-contrato-pdf');
      await generateContratoPdf(printRef.current, obraId);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível gerar o PDF.', variant: 'destructive' });
    }
  };

  if (isLoading) return <Skeleton className="h-40 w-full rounded-2xl" />;
  // Sem fluxo de contrato (obra legada ou não contratada) → não renderiza.
  if (!data || data.contratoStatus == null) return null;

  const assinou = (papel: 'contratante' | 'empreiteiro') => data.assinaturas.some((a) => a.papel === papel);
  const statusLabel =
    data.contratoStatus === 'assinado'
      ? 'Assinado pelas duas partes'
      : data.contratoStatus === 'pendente_empreiteiro'
        ? 'Aguardando assinatura do empreiteiro'
        : 'Aguardando assinatura do contratante';

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-4" data-testid="contrato-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <RiFileList3Line className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">{data.titulo}</h3>
            <p className="text-xs text-gray-500" data-testid="contrato-status-label">{statusLabel}</p>
          </div>
        </div>
        <span
          className={
            'text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ' +
            (data.contratoStatus === 'assinado'
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400')
          }
        >
          {data.contratoStatus === 'assinado' ? 'Assinado' : 'Pendente'}
        </span>
      </div>

      {/* Assinaturas */}
      <div className="flex flex-wrap gap-3 text-xs">
        {(['contratante', 'empreiteiro'] as const).map((p) => (
          <span key={p} className="inline-flex items-center gap-1.5">
            {assinou(p) ? <RiCheckLine className="w-4 h-4 text-green-600" /> : <span className="w-4 h-4 rounded-full border border-gray-300 inline-block" />}
            <span className="text-gray-600 dark:text-gray-300 capitalize">{p}</span>
          </span>
        ))}
      </div>

      {/* Conteúdo do contrato (fonte também do PDF). */}
      <div ref={printRef} className="max-h-72 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/40">
        <MarkdownView content={data.conteudo} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={baixarPdf} data-testid="button-baixar-contrato">
          <RiDownloadLine className="w-4 h-4 mr-1.5" /> Baixar contrato
        </Button>

        {data.podeAssinar && (
          <Button type="button" size="sm" onClick={() => assinar.mutate()} disabled={assinar.isPending} data-testid="button-assinar-contrato">
            <RiQuillPenLine className="w-4 h-4 mr-1.5" />
            {assinar.isPending ? 'Assinando…' : 'Li e assino'}
          </Button>
        )}

        {data.papel === 'contratante' && data.contratoStatus !== 'assinado' && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => cancelar.mutate()}
            disabled={cancelar.isPending}
            data-testid="button-cancelar-contrato"
          >
            Cancelar aceite
          </Button>
        )}
      </div>

      {data.papel === 'empreiteiro' && data.contratoStatus === 'pendente_contratante' && (
        <p className="text-xs text-gray-500">O contratante precisa assinar primeiro. Você será avisado quando for a sua vez.</p>
      )}
    </div>
  );
}
