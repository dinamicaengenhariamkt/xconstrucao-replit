'use client';

import { useRef, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { Input } from '@shared/components/ui/input';
import { Textarea } from '@shared/components/ui/textarea';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/lib/utils';
import type { ObraDocumento } from '../types';
import { IconUploadFile, IconCheckCircle, IconClose } from '@shared/components/icons';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIAS: { value: ObraDocumento['categoria']; label: string }[] = [
  { value: 'contrato', label: 'Contrato' },
  { value: 'art_rrt', label: 'ART / RRT' },
  { value: 'planta', label: 'Planta / Projeto' },
  { value: 'relatorio', label: 'Relatório' },
  { value: 'alvara', label: 'Alvará' },
  { value: 'laudo', label: 'Laudo Técnico' },
];

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório').max(100, 'Máximo 100 caracteres'),
  categoria: z.enum(['contrato', 'art_rrt', 'planta', 'relatorio', 'alvara', 'laudo', 'foto', 'outros'], {
    required_error: 'Selecione uma categoria',
  }),
  observacoes: z.string().max(200, 'Máximo 200 caracteres').optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface EnviarDocumentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoriaInicial?: ObraDocumento['categoria'];
  onConfirmar: (doc: Omit<ObraDocumento, 'id'>) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EnviarDocumentoModal({
  open,
  onOpenChange,
  categoriaInicial,
  onConfirmar,
}: EnviarDocumentoModalProps) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      categoria: categoriaInicial,
      observacoes: '',
    },
  });

  const handleFile = useCallback(
    (file: File) => {
      setArquivo(file);
      // Auto-fill nome from filename (strip extension)
      const nomeBase = file.name.replace(/\.[^/.]+$/, '');
      form.setValue('nome', nomeBase, { shouldValidate: true });
      if (categoriaInicial) {
        form.setValue('categoria', categoriaInicial);
      }
    },
    [form, categoriaInicial]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleClose = () => {
    setArquivo(null);
    setDragging(false);
    form.reset({ nome: '', categoria: categoriaInicial, observacoes: '' });
    onOpenChange(false);
  };

  const onSubmit = (data: FormData) => {
    onConfirmar({
      nome: data.nome.trim(),
      categoria: data.categoria,
      tamanho: arquivo ? formatarTamanho(arquivo.size) : undefined,
      data: 'Hoje',
      status: 'novo',
      observacoes: data.observacoes?.trim() || undefined,
    });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/5 rounded-lg">
              <IconUploadFile className="text-primary text-xl" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                Enviar Documento
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                Selecione o arquivo e preencha os dados
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            className={cn(
              'p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer text-center',
              dragging
                ? 'border-primary bg-primary/5'
                : arquivo
                  ? 'border-success/50 bg-success/5'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 hover:border-primary/40 hover:bg-primary/5'
            )}
          >
            {arquivo ? (
              <div className="flex items-center justify-center gap-3">
                <IconCheckCircle className="text-success text-3xl" />
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px]">
                    {arquivo.name}
                  </p>
                  <p className="text-xs text-gray-500">{formatarTamanho(arquivo.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setArquivo(null); form.setValue('nome', ''); }}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded cursor-pointer"
                  aria-label="Remover arquivo"
                >
                  <IconClose className="text-lg" />
                </button>
              </div>
            ) : (
              <>
                <IconUploadFile className="text-gray-400 text-4xl mb-2 block" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {dragging ? 'Solte o arquivo aqui' : 'Arraste ou clique para selecionar'}
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF, DWG, XLS, DOC, IMG — máx. 50MB</p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.dwg,.xls,.xlsx,.doc,.docx,image/*"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />

          {/* Form */}
          <Form {...form}>
            <form id="form-documento" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {/* Nome */}
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do documento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Contrato Assinado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Categoria */}
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!!categoriaInicial}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIAS.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Observações */}
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Observações{' '}
                      <span className="text-gray-400 font-normal">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Registro CREA-SP, número de pranchas, vigência..."
                        className="resize-none h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        {/* Footer */}
        <DialogFooter className="p-6 pt-0 flex flex-row justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-documento">
            <IconUploadFile className="text-sm mr-1" />
            Enviar Documento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
