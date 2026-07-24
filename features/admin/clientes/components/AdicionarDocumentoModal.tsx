'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RiUploadCloud2Line, RiFileTextLine, RiFilePdfLine, RiImageLine } from 'react-icons/ri';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@shared/components/ui/form';
import { Input } from '@shared/components/ui/input';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/lib/utils';
import type { ClienteDocumento, DocumentoTipo } from '../types';

const adicionarDocumentoSchema = z.object({
  nome: z.string().min(1, 'Informe o nome do documento'),
  tipo: z.enum(['pdf', 'imagem', 'outro']),
});

type AdicionarDocumentoFormData = z.infer<typeof adicionarDocumentoSchema>;

const TIPO_OPTIONS: { value: DocumentoTipo; label: string; icon: React.ElementType }[] = [
  { value: 'pdf',    label: 'PDF',    icon: RiFilePdfLine },
  { value: 'imagem', label: 'Imagem', icon: RiImageLine },
  { value: 'outro',  label: 'Outro',  icon: RiFileTextLine },
];

function detectTipo(file: File): DocumentoTipo {
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.startsWith('image/')) return 'imagem';
  return 'outro';
}

interface AdicionarDocumentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Faz upload real + POST no dossiê. Rejeita em erro (o modal exibe). */
  onSave: (args: { file: File; nome: string }) => Promise<void>;
}

export function AdicionarDocumentoModal({ open, onOpenChange, onSave }: AdicionarDocumentoModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<AdicionarDocumentoFormData>({
    resolver: zodResolver(adicionarDocumentoSchema),
    defaultValues: { nome: '', tipo: 'outro' },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setFileError(null);
    const tipo = detectTipo(file);
    form.setValue('tipo', tipo);
    if (!form.getValues('nome')) {
      form.setValue('nome', file.name.replace(/\.[^.]+$/, ''));
    }
  }

  function handleClose() {
    form.reset({ nome: '', tipo: 'outro' });
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onOpenChange(false);
  }

  const onSubmit = async (data: AdicionarDocumentoFormData) => {
    if (!selectedFile) {
      setFileError('Selecione um arquivo para enviar.');
      return;
    }
    setIsPending(true);
    setFileError(null);
    try {
      await onSave({ file: selectedFile, nome: data.nome });
      handleClose();
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Falha ao enviar o documento.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-lg p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/5 rounded-lg">
              <RiUploadCloud2Line className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Adicionar Documento
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5">
                Faça upload de um arquivo e configure as informações.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="p-6">
          <Form {...form}>
            <form
              id="form-adicionar-documento"
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
            >
              {/* File input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Arquivo <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 px-4 transition-colors cursor-pointer',
                    selectedFile
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/40 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                  )}
                >
                  <RiUploadCloud2Line className={cn('w-8 h-8', selectedFile ? 'text-primary' : 'text-gray-400')} />
                  {selectedFile ? (
                    <p className="text-sm font-semibold text-primary truncate max-w-xs">{selectedFile.name}</p>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Clique para selecionar
                      </p>
                      <p className="text-xs text-gray-400">PDF, imagens ou outros arquivos</p>
                    </>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {fileError && <p className="text-xs text-red-500">{fileError}</p>}
              </div>

              {/* Nome */}
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Nome do documento <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: RG do Titular" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/*
                Tipo é derivado do MIME do arquivo (aqui e no servidor, em
                `listarDocumentosDoCliente`). Exibido como leitura para não
                divergir do que fica gravado.
              */}
              {selectedFile && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tipo</p>
                  <div
                    className="mt-1 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800"
                    data-testid="text-tipo-documento"
                  >
                    {(() => {
                      const tipo = detectTipo(selectedFile);
                      const opt = TIPO_OPTIONS.find((o) => o.value === tipo) ?? TIPO_OPTIONS[2];
                      const Icon = opt.icon;
                      return (
                        <>
                          <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {opt.label}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </form>
          </Form>
        </div>

        {/* Footer */}
        <DialogFooter className="p-6 border-t border-gray-100 dark:border-gray-800 shrink-0 flex flex-row justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="form-adicionar-documento" disabled={isPending}>
            <RiUploadCloud2Line className="w-4 h-4 mr-2" />
            {isPending ? 'Enviando...' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
