'use client';

import { useState, type MouseEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { IconDownload, IconOpenInNew } from '@shared/components/icons';
import type { ObraDocumento } from '../types';

/**
 * XG10 — visualização do documento sem sair da obra.
 *
 * "Eu não consigo abrir ela... eu tenho que baixar ela, é isso mesmo? Ela não
 * fica carregada aqui pra eu poder abrir daqui" (15:44–15:55). Na verdade nem
 * baixar dava: o botão era `window.open('#')`, um placeholder.
 *
 * PDF e imagem abrem embutidos; o resto (DWG, planilha) não tem visualizador
 * no browser, então oferecemos download em vez de fingir um preview quebrado.
 */

function ehImagem(mime?: string) {
  return Boolean(mime?.startsWith('image/'));
}

function ehPdf(mime?: string) {
  return mime === 'application/pdf';
}

interface DocumentoPreviewModalProps {
  doc: ObraDocumento | null;
  onOpenChange: (open: boolean) => void;
  /**
   * E2E-08 — gera uma URL assinada nova. A da abertura vale 15 min; com o
   * modal aberto mais que isso, a imagem falha e os botões dariam erro.
   */
  onAssinar?: (doc: ObraDocumento) => Promise<string | null>;
}

export function DocumentoPreviewModal(props: DocumentoPreviewModalProps) {
  if (!props.doc) return null;
  // `key` zera o estado (URL renovada, tentativa feita) a cada documento.
  return <PreviewConteudo key={`${props.doc.id}:${props.doc.url ?? ''}`} {...props} doc={props.doc} />;
}

function PreviewConteudo({
  doc,
  onOpenChange,
  onAssinar,
}: DocumentoPreviewModalProps & { doc: ObraDocumento }) {
  const [urlRenovada, setUrlRenovada] = useState<string | null>(null);
  const [jaRenovou, setJaRenovou] = useState(false);

  const url = urlRenovada ?? doc.url ?? null;

  // Imagem que falhou ao carregar: assina de novo uma vez só.
  const aoFalharImagem = () => {
    if (jaRenovou || !onAssinar) return;
    setJaRenovou(true);
    void onAssinar(doc).then((nova) => {
      if (nova && nova !== url) setUrlRenovada(nova);
    });
  };

  const abrirAssinado = async (e: MouseEvent<HTMLAnchorElement>) => {
    if (!onAssinar || doc.isLink) return;
    e.preventDefault();
    const nova = (await onAssinar(doc)) ?? url;
    if (nova) window.open(nova, '_blank', 'noopener,noreferrer');
  };
  const podeExibir = Boolean(url) && (ehImagem(doc.mime) || ehPdf(doc.mime));

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate">{doc.nome}</DialogTitle>
          <DialogDescription>
            {[doc.tamanho, doc.data].filter(Boolean).join(' · ') || 'Documento da obra'}
          </DialogDescription>
        </DialogHeader>

        {!url ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Não foi possível gerar o endereço deste arquivo.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tente recarregar a página; o link de leitura expira depois de alguns minutos.
            </p>
          </div>
        ) : ehImagem(doc.mime) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={doc.nome}
            className="w-full max-h-[65vh] object-contain rounded-lg bg-gray-50 dark:bg-gray-900"
            data-testid="preview-imagem"
            onError={aoFalharImagem}
          />
        ) : ehPdf(doc.mime) ? (
          <iframe
            src={url}
            title={doc.nome}
            className="w-full h-[65vh] rounded-lg border border-gray-200 dark:border-gray-800"
            data-testid="preview-pdf"
          />
        ) : (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Este formato não abre aqui dentro.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Baixe o arquivo para visualizar no programa adequado.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <span className="text-xs text-muted-foreground self-center">
            {podeExibir ? 'Visualização rápida' : 'Sem visualização no navegador'}
          </span>
          <div className="flex gap-2">
            {url && (
              <>
                <Button variant="outline" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer" onClick={abrirAssinado}>
                    <IconOpenInNew className="w-4 h-4 mr-1" />
                    Abrir em nova aba
                  </a>
                </Button>
                <Button asChild>
                  <a href={url} download={doc.nome} onClick={abrirAssinado}>
                    <IconDownload className="w-4 h-4 mr-1" />
                    Baixar
                  </a>
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
