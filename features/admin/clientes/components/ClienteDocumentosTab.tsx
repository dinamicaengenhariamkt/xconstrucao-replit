'use client';

import { useState } from 'react';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/components/ui/button';
import { Skeleton } from '@shared/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import {
  RiAddLine,
  RiFilePdfLine,
  RiImageLine,
  RiFileTextLine,
  RiDownload2Line,
  RiEyeLine,
  RiDeleteBinLine,
  RiFolderOpenLine,
} from 'react-icons/ri';
import { formatDate } from '@shared/lib/formatters';
import { useToast } from '@shared/hooks/use-toast';
import type { ClienteDocumento, DocumentoTipo } from '../types';

const TIPO_CONFIG: Record<DocumentoTipo, { icon: React.ElementType; iconBg: string; iconColor: string }> = {
  pdf: {
    icon: RiFilePdfLine,
    iconBg: 'bg-red-50 dark:bg-red-900/20',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  imagem: {
    icon: RiImageLine,
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  outro: {
    icon: RiFileTextLine,
    iconBg: 'bg-gray-100 dark:bg-gray-800',
    iconColor: 'text-gray-500 dark:text-gray-400',
  },
};

interface ClienteDocumentosTabProps {
  documentos: ClienteDocumento[];
  isLoading: boolean;
  onAddDocumento: () => void;
  onDeleteDocumento: (id: string) => void;
}

export function ClienteDocumentosTab({
  documentos,
  isLoading,
  onAddDocumento,
  onDeleteDocumento,
}: ClienteDocumentosTabProps) {
  const [visualizarDoc, setVisualizarDoc] = useState<ClienteDocumento | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  function handleDownload(doc: ClienteDocumento) {
    if (doc.url) {
      const a = document.createElement('a');
      a.href = doc.url;
      a.download = doc.nome;
      a.click();
      return;
    }
    // Sem URL o arquivo não pôde ser assinado (credencial de storage expirada,
    // bucket fora do ar, ou registro órfão). Antes gerávamos um PDF com o texto
    // "Documento simulado" — o admin baixava um arquivo placebo achando que era
    // o documento real do cliente, sem nenhum erro. Falhar é o comportamento
    // correto: o documento existe, o que falhou foi o acesso a ele.
    toast({
      variant: 'destructive',
      title: 'Não foi possível baixar o documento',
      description:
        'O arquivo não está acessível no momento. Verifique a configuração de armazenamento e tente novamente.',
    });
  }

  function handleVisualizar(doc: ClienteDocumento) {
    if (doc.url) {
      window.open(doc.url, '_blank');
    } else {
      setVisualizarDoc(doc);
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Documentos Anexados</h3>
          <Button size="sm" className="gap-2" onClick={onAddDocumento}>
            <RiAddLine className="w-4 h-4" />
            Adicionar Documento
          </Button>
        </div>

        {documentos.length === 0 ? (
          <div className="text-center py-12">
            <RiFolderOpenLine className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Nenhum documento</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Nenhum documento foi anexado ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentos.map((doc) => {
              const tipoCfg = TIPO_CONFIG[doc.tipo];
              const Icon = tipoCfg.icon;
              return (
                <div
                  key={doc.id}
                  className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-800"
                >
                  <div className="flex items-start gap-4">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', tipoCfg.iconBg)}>
                      <Icon className={cn('w-6 h-6', tipoCfg.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{doc.nome}</p>
                      <p className="text-xs text-muted-foreground mt-1">Enviado em: {formatDate(doc.dataEnvio)}</p>
                      <div className="flex gap-1 mt-3">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-primary dark:hover:text-white transition-colors cursor-pointer"
                          title="Baixar"
                        >
                          <RiDownload2Line className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleVisualizar(doc)}
                          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-primary dark:hover:text-white transition-colors cursor-pointer"
                          title="Visualizar"
                        >
                          <RiEyeLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(doc.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <RiDeleteBinLine className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm delete dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir documento</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Deseja excluir este documento permanentemente?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setConfirmDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDeleteDocumento(confirmDeleteId!);
                setConfirmDeleteId(null);
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visualizar mock doc info dialog */}
      {visualizarDoc && (
        <Dialog open={!!visualizarDoc} onOpenChange={() => setVisualizarDoc(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                {(() => {
                  const cfg = TIPO_CONFIG[visualizarDoc.tipo];
                  const Icon = cfg.icon;
                  return (
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.iconBg)}>
                      <Icon className={cn('w-5 h-5', cfg.iconColor)} />
                    </div>
                  );
                })()}
                <div>
                  <DialogTitle className="text-base leading-snug">{visualizarDoc.nome}</DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {visualizarDoc.tipo.toUpperCase()} · Enviado em {formatDate(visualizarDoc.dataEnvio)}
                  </p>
                </div>
              </div>
              <DialogDescription>
                O arquivo original deste documento não está disponível para visualização neste ambiente.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setVisualizarDoc(null)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
