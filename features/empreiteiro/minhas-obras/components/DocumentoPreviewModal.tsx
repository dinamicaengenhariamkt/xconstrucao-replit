'use client';

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
}

export function DocumentoPreviewModal({ doc, onOpenChange }: DocumentoPreviewModalProps) {
  if (!doc) return null;

  const url = doc.url ?? null;
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
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <IconOpenInNew className="w-4 h-4 mr-1" />
                    Abrir em nova aba
                  </a>
                </Button>
                <Button asChild>
                  <a href={url} download={doc.nome}>
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
