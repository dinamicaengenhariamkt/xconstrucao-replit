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
import { cn } from '@shared/lib/utils';
import { IconShare, IconCheck, IconContentCopy, IconMail, IconLink } from '@shared/components/icons';
import {
  toAbsoluteShareUrl,
  useAtualizarSecoes,
  useCriarObraShare,
  useObraShares,
  useRevogarObraShare,
  type ObraShare,
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

/** Prazos oferecidos ao criar o link. `0` = sem prazo. */
type ValidadeDias = 0 | 7 | 30 | 90;

const VALIDADES: { valor: ValidadeDias; label: string }[] = [
  { valor: 0, label: 'Sem prazo' },
  { valor: 7, label: '7 dias' },
  { valor: 30, label: '30 dias' },
  { valor: 90, label: '90 dias' },
];

/** XG30 — sugestões de nome; o primeiro link costuma ser o do cliente. */
const NOMES_SUGERIDOS = ['Cliente', 'Arquiteto'];

/** ISO do fim do prazo, ou `null` para link permanente. */
function expiraEmISO(dias: ValidadeDias): string | null {
  if (dias === 0) return null;
  return new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CompartilharModal({
  open,
  onOpenChange,
  obra,
}: CompartilharModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [revogando, setRevogando] = useState<ObraShare | null>(null);
  // XG30 — um link por público. `null` segue o primeiro da lista; `'novo'`
  // abre o formulário de criação.
  const [selecionado, setSelecionado] = useState<string | 'novo' | null>(null);
  const [nomeNovo, setNomeNovo] = useState('');
  // XG14 — validade do link, escolhida na criação.
  const [validadeDias, setValidadeDias] = useState<ValidadeDias>(0);

  // O estado mora na query compartilhada: o bloco de detalhes da obra lê a
  // mesma chave e por isso reflete criar/revogar sem callback.
  const sharesQuery = useObraShares(obra.id, open);
  const criar = useCriarObraShare(obra.id);
  const revogar = useRevogarObraShare(obra.id);
  // XG12 — decidir o que cada público vê acontece aqui, link a link.
  const secoesMutation = useAtualizarSecoes(obra.id);

  const shares = sharesQuery.data?.shares ?? [];
  const limite = sharesQuery.data?.limite ?? 5;
  const noLimite = shares.length >= limite;
  const criando = selecionado === 'novo' || (!sharesQuery.isLoading && shares.length === 0);
  const shareLink = criando
    ? null
    : (shares.find((share) => share.id === selecionado) ?? shares[0] ?? null);

  const url = toAbsoluteShareUrl(shareLink);
  const loading = sharesQuery.isLoading;
  // Sem link ainda, o primeiro nome sugerido é "Cliente"; depois, "Arquiteto".
  const nomePadrao = NOMES_SUGERIDOS.find((nome) => !shares.some((s) => s.nome === nome)) ?? '';

  const handleCriar = async () => {
    const nome = (nomeNovo.trim() || nomePadrao).slice(0, 40);
    if (!nome) {
      toast({ title: 'Dê um nome ao link', description: 'Ex.: Cliente, Arquiteto.', variant: 'destructive' });
      return;
    }
    try {
      const share = await criar.mutateAsync({ nome, expiraEm: expiraEmISO(validadeDias) });
      setSelecionado(share.id);
      setNomeNovo('');
      setCopied(false);
      toast({
        title: `Link "${share.nome}" criado`,
        description:
          validadeDias === 0
            ? 'Escolha abaixo o que este link mostra e envie para quem vai acompanhar.'
            : `Escolha abaixo o que este link mostra. Expira em ${validadeDias} dias.`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao criar link',
        description: error instanceof Error ? error.message : 'Não foi possível criar o link agora.',
        variant: 'destructive',
      });
    }
  };

  const handleRevogar = async () => {
    const alvo = revogando;
    setRevogando(null);
    if (!alvo) return;
    try {
      await revogar.mutateAsync(alvo.id);
      setSelecionado(null);
      setCopied(false);
      toast({ title: `Link "${alvo.nome}" revogado`, description: 'Quem tiver este link não conseguirá mais abrir a obra.' });
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
            {/* XG30 — um link por público. Cada um tem endereço e seções
                próprios: o do cliente pode mostrar pagamentos, o do arquiteto
                não. */}
            {shares.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Links desta obra</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Links desta obra">
                  {shares.map((share) => (
                    <button
                      key={share.id}
                      type="button"
                      onClick={() => {
                        setSelecionado(share.id);
                        setCopied(false);
                      }}
                      aria-pressed={shareLink?.id === share.id}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-xs transition-colors cursor-pointer',
                        shareLink?.id === share.id
                          ? 'border-primary bg-primary/10 font-bold text-primary'
                          : 'border-gray-200 font-semibold text-gray-600 hover:border-primary/40 dark:border-gray-700 dark:text-gray-300',
                      )}
                      data-testid={`xgestao-share-link-${share.id}`}
                    >
                      {share.nome}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelecionado('novo')}
                    disabled={noLimite}
                    aria-pressed={criando}
                    className={cn(
                      'rounded-lg border border-dashed px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
                      criando
                        ? 'border-primary text-primary'
                        : 'border-gray-300 text-gray-600 hover:border-primary/40 dark:border-gray-600 dark:text-gray-300',
                    )}
                    data-testid="xgestao-share-novo"
                  >
                    + Novo link
                  </button>
                </div>
                {noLimite && (
                  <p className="mt-2 text-[11px] text-gray-500">
                    Limite de {limite} links ativos. Revogue um para criar outro.
                  </p>
                )}
              </div>
            )}

            {loading ? (
              <p className="text-xs text-gray-500">Consultando links…</p>
            ) : criando ? (
              <div className="flex flex-col gap-3" data-testid="xgestao-share-form">
                <div>
                  <label htmlFor="xgestao-share-nome" className="text-xs font-semibold text-gray-500">
                    Para quem é este link?
                  </label>
                  <Input
                    id="xgestao-share-nome"
                    value={nomeNovo}
                    onChange={(e) => setNomeNovo(e.target.value)}
                    placeholder={nomePadrao ? `Ex.: ${nomePadrao}` : 'Ex.: Engenheiro, Síndico'}
                    maxLength={40}
                    className="mt-2 text-sm"
                    data-testid="xgestao-share-nome"
                  />
                  <p className="mt-1 text-[11px] text-gray-500">
                    Só você vê este nome. Crie um link por pessoa para escolher o que cada uma vê.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Validade do link</p>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Validade do link">
                    {VALIDADES.map((opcao) => (
                      <button
                        key={opcao.valor}
                        type="button"
                        onClick={() => setValidadeDias(opcao.valor)}
                        aria-pressed={validadeDias === opcao.valor}
                        className={
                          validadeDias === opcao.valor
                            ? 'rounded-lg border border-primary bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors cursor-pointer'
                            : 'rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-primary/40 dark:border-gray-700 dark:text-gray-300 cursor-pointer'
                        }
                        data-testid={`xgestao-share-validade-${opcao.valor}`}
                      >
                        {opcao.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-gray-500">
                    Depois do prazo o link deixa de abrir. Você pode revogar antes disso quando quiser.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCriar}
                  disabled={criar.isPending || noLimite}
                  className="self-start"
                  data-testid="xgestao-share-gerar"
                >
                  {criar.isPending ? 'Criando…' : 'Criar link'}
                </Button>
              </div>
            ) : shareLink ? (
              <>
                {/* URL + Copiar */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Link de {shareLink.nome}</p>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={url}
                      className="flex-1 text-xs bg-gray-50 dark:bg-gray-800 cursor-text"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      data-testid="xgestao-share-url"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant={copied ? 'outline' : 'default'}
                      onClick={handleCopiar}
                      disabled={!url}
                      className="shrink-0"
                    >
                      {copied ? <IconCheck className="text-sm mr-1" /> : <IconContentCopy className="text-sm mr-1" />}
                      {copied ? 'Copiado' : 'Copiar'}
                    </Button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-[11px] text-gray-500">
                      {shareLink.expiraEm ? `Expira em ${formatarData(shareLink.expiraEm)}` : 'Não expira'}
                      {' · '}
                      {shareLink.visualizacoes === 0
                        ? 'ainda não foi aberto'
                        : `${shareLink.visualizacoes} ${shareLink.visualizacoes === 1 ? 'visualização' : 'visualizações'}`}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setRevogando(shareLink)}
                      disabled={revogar.isPending}
                      className="text-destructive hover:text-destructive"
                      data-testid="xgestao-share-revogar"
                    >
                      {revogar.isPending ? 'Revogando…' : 'Revogar'}
                    </Button>
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
                      disabled={!url}
                      className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                    >
                      <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                        <IconLink className="text-white text-xl" />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Copiar link</span>
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-500">O que {shareLink.nome} vê</p>
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
                              { linkId: shareLink.id, secoes: { ...shareLink.secoes, [secao]: marcado } },
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
                    Valores só aparecem com Pagamentos ligado. Custos, lucro, equipe e o endereço
                    exato nunca são compartilhados.
                  </p>
                </div>
              </>
            ) : null}
          </div>

          {/* Footer */}
          <DialogFooter className="p-5 pt-0 flex flex-row justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={revogando !== null} onOpenChange={(aberto) => !aberto && setRevogando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar o link de {revogando?.nome}?</AlertDialogTitle>
            <AlertDialogDescription>
              Este link deixa de funcionar na hora. Os outros links da obra continuam valendo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevogar} data-testid="xgestao-share-confirmar">
              Revogar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
