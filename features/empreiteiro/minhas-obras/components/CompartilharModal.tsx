'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/components/ui/alert-dialog';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { useToast } from '@shared/hooks/use-toast';
import { IconShare, IconCheck, IconContentCopy, IconMail, IconLink } from '@shared/components/icons';
import {
  toAbsoluteShareUrl,
  useAtualizarSecoes,
  useGerarObraShare,
  useObraShare,
  useRevogarObraShare,
} from '@features/xgestao/obra-publica/hooks/use-obra-share';
import { SECAO_LABELS, SECOES_PUBLICAS } from '@features/xgestao/obra-publica/secoes';
import { Switch } from '@shared/components/ui/switch';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CompartilharModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Só id e título são usados. Tipar o mínimo deixa o modal servir tanto o
   * console (que passa o detalhe completo) quanto a tela de edição, sem cópia.
   */
  obra: { id: string; titulo: string };
}

/** Ações que invalidam o link já entregue ao cliente e por isso pedem confirmação. */
type ConfirmacaoPendente = 'rotacionar' | 'revogar' | null;

// ─── Component ────────────────────────────────────────────────────────────────

export function CompartilharModal({
  open,
  onOpenChange,
  obra,
}: CompartilharModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [confirmacao, setConfirmacao] = useState<ConfirmacaoPendente>(null);

  // O estado do link mora na query compartilhada: a tela de edição lê a mesma
  // chave e por isso reflete gerar/revogar sem callback entre os componentes.
  const shareQuery = useObraShare(obra.id, open);
  const gerar = useGerarObraShare(obra.id);
  const revogar = useRevogarObraShare(obra.id);
  // XG12 — decidir o que o cliente vê passa a acontecer aqui. Antes o toggle
  // morava na tela de edição e o envio no modal: para escolher as seções era
  // preciso estar numa tela, para mandar o link na outra.
  const secoesMutation = useAtualizarSecoes(obra.id);
  const shareLink = shareQuery.data ?? null;

  const url = toAbsoluteShareUrl(shareQuery.data);
  const loading = shareQuery.isLoading || gerar.isPending;

  const handleGerar = async () => {
    setConfirmacao(null);
    try {
      await gerar.mutateAsync(null);
      setCopied(false);
      toast({ title: 'Link público gerado', description: 'Envie este link para acompanhar a obra sem login.' });
    } catch {
      toast({ title: 'Erro ao gerar link', description: 'Não foi possível criar o link agora.', variant: 'destructive' });
    }
  };

  const handleRevogar = async () => {
    setConfirmacao(null);
    try {
      await revogar.mutateAsync();
      setCopied(false);
      toast({ title: 'Link revogado', description: 'Quem tiver o link não conseguirá mais abrir esta obra.' });
    } catch {
      toast({ title: 'Erro ao revogar link', description: 'Não foi possível revogar o link agora.', variant: 'destructive' });
    }
  };

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: 'Link copiado!', description: 'URL copiada para a área de transferência.' });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível copiar o link.', variant: 'destructive' });
    }
  };

  const mensagem = `Acompanhe o andamento da obra "${obra.titulo}": ${url}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(`Obra: ${obra.titulo}`)}&body=${encodeURIComponent(mensagem)}`;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-md flex-col gap-0 overflow-y-auto p-0 sm:w-full">
          {/* Header */}
          <DialogHeader className="p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <IconShare className="text-primary text-xl" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                  Compartilhar link
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                  {obra.titulo}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Body */}
          <div className="p-5 flex flex-col gap-4">
            {/* URL + Copiar */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Link público da obra</p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={url}
                  placeholder={loading ? 'Consultando link…' : 'Gere um link para compartilhar'}
                  className="flex-1 text-xs bg-gray-50 dark:bg-gray-800 cursor-text"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  data-testid="xgestao-share-url"
                />
                <Button
                  type="button"
                  size="sm"
                  variant={copied ? 'outline' : 'default'}
                  onClick={handleCopiar}
                  disabled={!url || loading}
                  className="shrink-0"
                >
                  {copied ? <IconCheck className="text-sm mr-1" /> : <IconContentCopy className="text-sm mr-1" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  // Gerar o primeiro link não destrói nada; rotacionar invalida
                  // o que o cliente já tem salvo, então só esse caso confirma.
                  onClick={() => (url ? setConfirmacao('rotacionar') : handleGerar())}
                  disabled={loading}
                  data-testid="xgestao-share-gerar"
                >
                  {url ? 'Gerar novo link' : 'Gerar link'}
                </Button>
                {url && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmacao('revogar')}
                    disabled={revogar.isPending || loading}
                    className="text-destructive hover:text-destructive"
                    data-testid="xgestao-share-revogar"
                  >
                    {revogar.isPending ? 'Revogando…' : 'Revogar'}
                  </Button>
                )}
              </div>
            </div>

            {/* Compartilhar via */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-3">Compartilhar via</p>
              <div className="flex gap-3">
                {/* E-mail */}
                <a
                  href={url ? emailUrl : undefined}
                  aria-disabled={!url}
                  className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all aria-disabled:pointer-events-none aria-disabled:opacity-50"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <IconMail className="text-white text-xl" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">E-mail</span>
                </a>

                {/* Copiar direto */}
                <button
                  type="button"
                  onClick={handleCopiar}
                  disabled={!url || loading}
                  className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                >
                  <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                    <IconLink className="text-white text-xl" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Copiar link</span>
                </button>
              </div>
            </div>

            {/* Só faz sentido escolher o conteúdo quando há link ativo: sem ele
                não existe nada publicado para restringir. */}
            {shareLink && (
              <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-500">O que o cliente vê</p>
                <p className="mt-1 text-xs text-gray-500">
                  Vale só para este link. Desmarcar esconde a seção na hora, sem trocar o
                  endereço.
                </p>
                <div className="mt-3 grid gap-2">
                  {SECOES_PUBLICAS.map((secao) => (
                    <label
                      key={secao}
                      htmlFor={`secao-${secao}`}
                      className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-gray-100 p-3 dark:border-gray-800"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                          {SECAO_LABELS[secao].titulo}
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-500">
                          {SECAO_LABELS[secao].descricao}
                        </span>
                      </span>
                      <Switch
                        id={`secao-${secao}`}
                        checked={shareLink.secoes[secao]}
                        disabled={secoesMutation.isPending}
                        onCheckedChange={(marcado) =>
                          secoesMutation.mutate(
                            { ...shareLink.secoes, [secao]: marcado },
                            {
                              onError: () =>
                                toast({
                                  title: 'Não foi possível atualizar o link',
                                  description: 'A alteração foi desfeita. Tente novamente.',
                                  variant: 'destructive',
                                }),
                            },
                          )
                        }
                        data-testid={`xgestao-secao-${secao}`}
                      />
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  Valores, lucro, equipe e o endereço exato nunca são compartilhados.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="p-5 pt-0 flex flex-row justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmacao !== null} onOpenChange={(aberto) => !aberto && setConfirmacao(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmacao === 'revogar' ? 'Revogar o link público?' : 'Gerar um link novo?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmacao === 'revogar'
                ? 'O link atual deixa de funcionar na hora. Quem já recebeu não conseguirá mais acompanhar a obra.'
                : 'O link atual deixa de funcionar e você precisará enviar o novo endereço para o cliente.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmacao === 'revogar' ? handleRevogar : handleGerar}
              data-testid="xgestao-share-confirmar"
            >
              {confirmacao === 'revogar' ? 'Revogar' : 'Gerar novo link'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
