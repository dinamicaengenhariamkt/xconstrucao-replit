'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  RiSendPlaneLine,
  RiPauseCircleLine,
  RiPlayCircleLine,
  RiArchiveLine,
  RiAttachment2,
  RiDownloadLine,
  RiDeleteBinLine,
  RiTimeLine,
  RiAlertLine,
  RiShieldCheckLine,
} from 'react-icons/ri';
import { Button } from '@shared/components/ui/button';
import { useToast } from '@shared/hooks/use-toast';
import { FileUploader } from '@features/shared/components/FileUploader';
import type { CommitResponse } from '@features/shared/hooks/use-uploads';

type Visibilidade = 'rascunho' | 'publicada' | 'pausada' | 'arquivada';
type StatusModeracao = 'pendente' | 'aprovada' | 'rejeitada';

interface Anexo {
  id: string;
  tipo: string;
  observacao: string | null;
  originalName: string;
  mime: string;
  sizeBytes: number | null;
  url: string | null;
  createdAt: string;
}

interface Props {
  obraId: string;
  visibilidade: Visibilidade;
  statusModeracao?: StatusModeracao | null;
  motivoModeracao?: string | null;
}

async function fetchAnexos(obraId: string): Promise<Anexo[]> {
  const res = await fetch(`/api/obras/${obraId}/anexos`, { credentials: 'include' });
  if (!res.ok) return [];
  const payload = await res.json();
  return Array.isArray(payload?.anexos) ? payload.anexos : Array.isArray(payload) ? payload : [];
}

const VISIBILIDADE_LABEL: Record<Visibilidade, string> = {
  rascunho: 'Rascunho',
  publicada: 'Publicada',
  pausada: 'Pausada',
  arquivada: 'Arquivada',
};

const VISIBILIDADE_CLASS: Record<Visibilidade, string> = {
  rascunho: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  publicada: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  pausada: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  arquivada: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const TIPOS = [
  { value: 'projeto_arquitetonico', label: 'Projeto arquitetônico' },
  { value: 'projeto_estrutural', label: 'Projeto estrutural' },
  { value: 'art_rrt', label: 'ART/RRT' },
  { value: 'alvara', label: 'Alvará' },
  { value: 'foto_local', label: 'Foto do local' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'outros', label: 'Outros' },
] as const;

export function ObraVisibilidadeActions({ obraId, visibilidade, statusModeracao, motivoModeracao }: Props) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tipoAnexo, setTipoAnexo] = useState<string>('outros');
  const [observacao, setObservacao] = useState<string>('');

  const ANEXOS_KEY = ['obra', obraId, 'anexos'] as const;
  const { data: anexos = [] } = useQuery({
    queryKey: ANEXOS_KEY,
    queryFn: () => fetchAnexos(obraId),
    staleTime: 30 * 1000,
  });

  const patchVisibilidade = useMutation({
    mutationFn: async (next: Visibilidade) => {
      const res = await fetch(`/api/obras/${obraId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ visibilidade: next }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Erro ${res.status}`);
      }
      return next;
    },
    onSuccess: (next) => {
      toast({
        title: 'Visibilidade atualizada',
        description: `A obra agora está ${VISIBILIDADE_LABEL[next]}.`,
      });
      qc.invalidateQueries({ queryKey: ['contratante', 'minhas-obras'] });
      qc.invalidateQueries({ queryKey: ['contratante', 'minhas-obras', obraId] });
    },
    onError: (err) => {
      toast({
        title: 'Falha ao atualizar visibilidade',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const commitAnexo = useMutation({
    mutationFn: async ({ fileId, tipo, observacao }: { fileId: string; tipo: string; observacao: string }) => {
      const res = await fetch(`/api/obras/${obraId}/anexos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fileId, tipo, observacao: observacao || null }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Erro ${res.status}`);
      }
    },
    onSuccess: () => {
      toast({ title: 'Anexo adicionado' });
      setObservacao('');
      qc.invalidateQueries({ queryKey: ANEXOS_KEY });
      qc.invalidateQueries({ queryKey: ['contratante', 'minhas-obras', obraId] });
    },
    onError: (err) => {
      toast({
        title: 'Falha ao anexar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const removeAnexo = useMutation({
    mutationFn: async (anexoId: string) => {
      const res = await fetch(`/api/obras/${obraId}/anexos/${anexoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Erro ${res.status}`);
      }
    },
    onSuccess: () => {
      toast({ title: 'Anexo removido' });
      qc.invalidateQueries({ queryKey: ANEXOS_KEY });
      qc.invalidateQueries({ queryKey: ['contratante', 'minhas-obras', obraId] });
    },
    onError: (err) => {
      toast({
        title: 'Falha ao remover anexo',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const handleUploaded = async (file: CommitResponse) => {
    await commitAnexo.mutateAsync({ fileId: file.id, tipo: tipoAnexo, observacao });
  };

  const acaoBusy = patchVisibilidade.isPending;
  const canPublish = visibilidade === 'rascunho';
  const canPause = visibilidade === 'publicada';
  // Permite re-submeter à moderação quando rejeitada (já está com visibilidade=publicada
  // mas precisa de gesto explícito do contratante para resetar status_moderacao→pendente).
  const canResubmit = visibilidade === 'publicada' && statusModeracao === 'rejeitada';
  const canRepublish = visibilidade === 'pausada';
  const canArchive = visibilidade !== 'arquivada';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 flex flex-col gap-5"
      data-testid="obra-visibilidade-actions"
    >
      {visibilidade === 'publicada' && statusModeracao && statusModeracao !== 'aprovada' && (
        <div
          className={`rounded-xl border p-4 flex gap-3 ${
            statusModeracao === 'rejeitada'
              ? 'border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/10'
              : 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/10'
          }`}
          data-testid={`moderacao-banner-${statusModeracao}`}
        >
          {statusModeracao === 'rejeitada' ? (
            <RiAlertLine className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          ) : (
            <RiTimeLine className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-sm">
            <p className={`font-bold ${statusModeracao === 'rejeitada' ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'}`}>
              {statusModeracao === 'rejeitada' ? 'Obra rejeitada pela moderação' : 'Aguardando aprovação da equipe XConstrução'}
            </p>
            <p className={`mt-1 ${statusModeracao === 'rejeitada' ? 'text-red-700 dark:text-red-200' : 'text-amber-700 dark:text-amber-200'}`}>
              {statusModeracao === 'rejeitada'
                ? motivoModeracao
                  ? `Motivo: ${motivoModeracao}`
                  : 'Veja os comentários da moderação e edite a obra antes de reenviar.'
                : 'Sua obra ainda não aparece no marketplace para empreiteiros — costuma sair em até 24h.'}
            </p>
            {statusModeracao === 'rejeitada' && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                Edite os dados e clique em <strong>Republicar</strong> para reenviar à moderação.
              </p>
            )}
          </div>
        </div>
      )}

      {visibilidade === 'publicada' && statusModeracao === 'aprovada' && (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/10 p-3 flex items-center gap-2 text-sm"
          data-testid="moderacao-banner-aprovada"
        >
          <RiShieldCheckLine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-emerald-800 dark:text-emerald-300 font-semibold">
            Obra aprovada e visível no marketplace.
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Visibilidade no marketplace</span>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${VISIBILIDADE_CLASS[visibilidade]}`}
            data-testid="obra-visibilidade-badge"
          >
            {VISIBILIDADE_LABEL[visibilidade]}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {canPublish && (
            <Button
              size="sm"
              variant="default"
              onClick={() => patchVisibilidade.mutate('publicada')}
              disabled={acaoBusy}
              data-testid="action-publicar"
              className="gap-1.5"
            >
              <RiSendPlaneLine className="w-4 h-4" />
              Publicar
            </Button>
          )}
          {canPause && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => patchVisibilidade.mutate('pausada')}
              disabled={acaoBusy}
              data-testid="action-pausar"
              className="gap-1.5"
            >
              <RiPauseCircleLine className="w-4 h-4" />
              Pausar
            </Button>
          )}
          {canRepublish && (
            <Button
              size="sm"
              variant="default"
              onClick={() => patchVisibilidade.mutate('publicada')}
              disabled={acaoBusy}
              data-testid="action-republicar"
              className="gap-1.5"
            >
              <RiPlayCircleLine className="w-4 h-4" />
              Republicar
            </Button>
          )}
          {canResubmit && (
            <Button
              size="sm"
              variant="default"
              onClick={async () => {
                // Re-submeter à moderação: pausa + publica novamente, resetando status_moderacao→pendente
                // (via lógica da PATCH que detecta transição rascunho/pausada → publicada).
                // Sequencial com await + try/catch — se o publicar falhar, tenta reverter pra publicada
                // pra não deixar a obra travada como 'pausada' contra a intenção do usuário.
                try {
                  await patchVisibilidade.mutateAsync('pausada');
                  await patchVisibilidade.mutateAsync('publicada');
                } catch (err) {
                  // Tentativa best-effort de rollback — se pausou mas falhou ao publicar.
                  try {
                    await patchVisibilidade.mutateAsync('publicada');
                  } catch {
                    /* rollback falhou; toast de erro já foi mostrado pelo onError */
                  }
                }
              }}
              disabled={acaoBusy}
              data-testid="action-reenviar-moderacao"
              className="gap-1.5"
            >
              <RiSendPlaneLine className="w-4 h-4" />
              Reenviar para moderação
            </Button>
          )}
          {canArchive && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (!window.confirm('Arquivar essa obra? Ela some do marketplace e da lista padrão.')) return;
                patchVisibilidade.mutate('arquivada');
              }}
              disabled={acaoBusy}
              data-testid="action-arquivar"
              className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <RiArchiveLine className="w-4 h-4" />
              Arquivar
            </Button>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
        <div className="flex items-center gap-2 mb-3">
          <RiAttachment2 className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Anexos da obra</span>
          <span className="text-xs text-muted-foreground">({anexos.length})</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr_auto] gap-2 mb-3">
          <select
            value={tipoAnexo}
            onChange={(e) => setTipoAnexo(e.target.value)}
            className="h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm px-2"
            data-testid="anexo-tipo-select"
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <input
            type="text"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Observação (opcional)"
            maxLength={500}
            className="h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm px-3"
            data-testid="anexo-observacao-input"
          />
          <FileUploader
            kind="obra_anexo"
            accept="application/pdf,image/*"
            label="Anexar arquivo"
            buttonVariant="default"
            testId="anexo-upload-button"
            extras={{ tipoDocumento: tipoAnexo, observacao }}
            onUploaded={handleUploaded}
          />
        </div>

        {anexos.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3">Nenhum anexo enviado ainda.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {anexos.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 py-2.5"
                data-testid={`anexo-row-${a.id}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{a.originalName}</p>
                  <p className="text-xs text-muted-foreground">
                    {(TIPOS.find((t) => t.value === a.tipo)?.label ?? a.tipo)}
                    {a.observacao ? ` · ${a.observacao}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {a.url && (
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                      title="Baixar"
                      data-testid={`anexo-download-${a.id}`}
                    >
                      <RiDownloadLine className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm(`Remover "${a.originalName}"?`)) return;
                      removeAnexo.mutate(a.id);
                    }}
                    disabled={removeAnexo.isPending}
                    className="p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 disabled:opacity-50"
                    title="Remover"
                    data-testid={`anexo-remove-${a.id}`}
                  >
                    <RiDeleteBinLine className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
