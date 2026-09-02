'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Textarea } from '@shared/components/ui/textarea';
import { useToast } from '@shared/hooks/use-toast';
import { FileUploader } from '@features/shared/components/FileUploader';
import type { CommitResponse } from '@features/shared/hooks/use-uploads';
import { deleteUpload } from '@features/shared/hooks/use-uploads';
import {
  IconAddTask,
  IconAdd,
  IconClose,
  IconPhotoCamera,
} from '@shared/components/icons';

interface RegistrarMedicaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obraId: string;
  obraTitulo?: string;
  isOwnWork: boolean;
}

interface FotoUpload {
  fileId: string;
  url: string;
  name: string;
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    /* keep null */
  }
  if (!res.ok) {
    const message =
      parsed && typeof parsed === 'object' && parsed && 'message' in parsed && typeof (parsed as { message?: string }).message === 'string'
        ? (parsed as { message: string }).message
        : `${res.status}: ${text || 'erro'}`;
    throw new Error(message);
  }
  return parsed as T;
}

export function RegistrarMedicaoModal({
  open,
  onOpenChange,
  obraId,
  obraTitulo,
  isOwnWork,
}: RegistrarMedicaoModalProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [etapa, setEtapa] = useState('');
  const [descricao, setDescricao] = useState('');
  const [percentual, setPercentual] = useState(10);
  const [valor, setValor] = useState('');
  const [fotos, setFotos] = useState<FotoUpload[]>([]);
  const requestIdRef = useRef<string | null>(null);

  const resetForm = () => {
    setEtapa('');
    setDescricao('');
    setPercentual(10);
    setValor('');
    setFotos([]);
    requestIdRef.current = null;
  };

  const handleClose = () => {
    onOpenChange(false);
    // espera o fade-out do dialog
    setTimeout(resetForm, 200);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const valorNum = valor.trim() ? Number(valor.replace(',', '.')) : 0;
      return postJSON<{ approvalRequired: boolean }>('/api/empreiteiro/medicoes', {
        obraId,
        etapa: etapa.trim(),
        descricao: descricao.trim() || undefined,
        percentual,
        valor: Number.isFinite(valorNum) && valorNum >= 0 ? valorNum : 0,
        fotos: fotos.map((f) => f.url).filter(Boolean),
        fotoFileIds: fotos.map((f) => f.fileId),
        requestId: requestIdRef.current ?? (requestIdRef.current = crypto.randomUUID()),
      });
    },
    onSuccess: (result) => {
      toast({
        title: result.approvalRequired ? 'Medição enviada' : 'Atualização salva',
        description: result.approvalRequired
          ? 'O contratante já pode aprovar ou contestar a medição.'
          : 'O progresso da obra foi atualizado imediatamente.',
      });
      qc.invalidateQueries({ queryKey: ['empreiteiro', 'medicoes'] });
      qc.invalidateQueries({ queryKey: ['contratante', 'medicoes'] });
      qc.invalidateQueries({ queryKey: ['obras', obraId] });
      qc.invalidateQueries({ queryKey: ['empreiteiro', 'minhas-obras', obraId] });
      qc.invalidateQueries({ queryKey: ['empreiteiro', 'minhas-obras'] });
      qc.invalidateQueries({ queryKey: ['admin', 'xgestao'] });
      handleClose();
    },
    onError: (err) => {
      toast({
        title: 'Não foi possível registrar a medição',
        description: err instanceof Error ? err.message : 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mutation.isPending) return;
    if (etapa.trim().length < 2) {
      toast({
        title: 'Informe a etapa',
        description: 'Descreva a etapa da obra que está sendo medida (mín. 2 caracteres).',
        variant: 'destructive',
      });
      return;
    }
    if (percentual < 1) {
      toast({
        title: 'Percentual inválido',
        description: 'O percentual da medição deve ser maior que 0%.',
        variant: 'destructive',
      });
      return;
    }
    mutation.mutate();
  };

  const handleUploaded = (file: CommitResponse) => {
    if (!file.publicUrl) {
      toast({
        title: 'Falha no upload',
        description: 'A foto foi enviada, mas a URL pública não retornou. Tente novamente.',
        variant: 'destructive',
      });
      return;
    }
    setFotos((prev) => [
      ...prev,
      { fileId: file.id, url: file.publicUrl as string, name: file.originalName },
    ]);
  };

  const handleRemoveFoto = async (fileId: string) => {
    setFotos((prev) => prev.filter((f) => f.fileId !== fileId));
    try {
      await deleteUpload(fileId);
    } catch {
      /* best-effort — se falhar, a foto vira órfã mas a UI fica consistente */
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
        else onOpenChange(true);
      }}
    >
      <DialogContent className="w-full max-w-lg p-0 flex flex-col gap-0 overflow-hidden max-h-[90vh]">
        <DialogHeader className="p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <IconAddTask className="text-primary text-xl" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                Registrar medição
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                {obraTitulo
                  ? `Obra: ${obraTitulo}`
                  : isOwnWork
                    ? 'Registre o avanço executado nesta obra.'
                    : 'Envie uma medição para aprovação do contratante.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto">
          <div className="p-5 flex flex-col gap-5">
            {/* Etapa */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                Etapa <span className="text-red-500">*</span>
              </label>
              <Input
                value={etapa}
                onChange={(e) => setEtapa(e.target.value)}
                placeholder="Ex: Fundação, Alvenaria, Acabamento"
                className="text-sm"
                maxLength={120}
                required
                data-testid="input-etapa-medicao"
              />
            </div>

            {/* Percentual */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-500">
                  Percentual concluído <span className="text-red-500">*</span>
                </label>
                <span className="text-2xl font-extrabold text-primary tabular-nums">{percentual}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={percentual}
                onChange={(e) => setPercentual(Number(e.target.value))}
                className="w-full h-2 rounded-full accent-primary cursor-pointer"
                data-testid="input-percentual-medicao"
              />
              <div className="flex gap-2 mt-2 flex-wrap">
                {[10, 25, 50, 75, 100].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPercentual(v)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold border border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary transition-colors cursor-pointer"
                  >
                    {v}%
                  </button>
                ))}
              </div>
            </div>

            {/* Valor */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                Valor (R$)
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className="text-sm"
                data-testid="input-valor-medicao"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Opcional. Deixe em branco se ainda não houver valor definido para esta medição.
              </p>
            </div>

            {/* Descrição */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                Descrição
              </label>
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhes do que foi executado nesta medição..."
                className="text-sm resize-none"
                rows={3}
                maxLength={2000}
                data-testid="input-descricao-medicao"
              />
            </div>

            {/* Fotos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                  <IconPhotoCamera className="text-sm" />
                  Fotos da execução
                </label>
                <span className="text-[11px] text-gray-400">{fotos.length}/20</span>
              </div>
              {fotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {fotos.map((f) => (
                    <div
                      key={f.fileId}
                      className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveFoto(f.fileId)}
                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        aria-label="Remover foto"
                        data-testid={`button-remove-foto-${f.fileId}`}
                      >
                        <IconClose className="text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <FileUploader
                kind="obra_foto"
                accept="image/jpeg,image/png,image/webp"
                label="Adicionar foto"
                helper="JPEG, PNG ou WEBP — até 8 MB cada, no máximo 20 fotos."
                buttonVariant="outline"
                testId="button-upload-foto-medicao"
                disabled={fotos.length >= 20}
                onUploaded={handleUploaded}
              />
            </div>
          </div>

          <DialogFooter className="p-5 pt-3 flex flex-row justify-end gap-2 border-t border-gray-100 dark:border-gray-800 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={mutation.isPending || etapa.trim().length < 2 || percentual < 1}
              data-testid="button-submit-medicao"
            >
              <IconAdd className="text-sm mr-1" />
              {mutation.isPending ? 'Salvando...' : isOwnWork ? 'Salvar atualização' : 'Enviar medição'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
