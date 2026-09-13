'use client';

import { useEffect, useState } from 'react';
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
  FormDescription,
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
import { useToast } from '@shared/hooks/use-toast';
import { FileUploader } from '@features/shared/components/FileUploader';
import { IconLink, IconUploadFile } from '@shared/components/icons';
import type { ObraDocumento } from '../types';
import { useCriarAnexo, type ObraAnexoTipo } from '../hooks/use-obra-anexos';

/**
 * XG10 — envio de documento da obra.
 *
 * Antes o modal simulava o upload e devolvia o objeto para o estado local; o
 * arquivo nunca subia. Agora usa o `FileUploader` real (presign → PUT no R2 →
 * commit) e vincula à obra pela API.
 *
 * A aba "Link" atende ao pedido da reunião: "a maioria dos projetos vem em
 * Drive... tem que poder colocar um link de fácil acesso" (16:21).
 */

/** Categoria da UI → `tipo` aceito por `obra_anexos`. */
const CATEGORIA_PARA_TIPO: Record<ObraDocumento['categoria'], ObraAnexoTipo> = {
  contrato: 'contrato',
  art_rrt: 'art_rrt',
  planta: 'projeto_arquitetonico',
  relatorio: 'outros',
  alvara: 'alvara',
  laudo: 'outros',
  foto: 'foto_local',
  outros: 'outros',
};

const CATEGORIAS: { value: ObraDocumento['categoria']; label: string }[] = [
  { value: 'contrato', label: 'Contrato' },
  { value: 'art_rrt', label: 'ART / RRT' },
  { value: 'planta', label: 'Planta / Projeto' },
  { value: 'relatorio', label: 'Relatório' },
  { value: 'alvara', label: 'Alvará' },
  { value: 'laudo', label: 'Laudo Técnico' },
  { value: 'outros', label: 'Outros' },
];

/**
 * Espelha os MIMEs aceitos em `KIND_RULES.obra_anexo` (shared/lib/storage).
 * As extensões entram junto porque DWG/DXF não têm MIME confiável: o browser
 * costuma reportar `application/octet-stream`, e sem a extensão no `accept` o
 * seletor de arquivos esconderia a planta do usuário.
 */
const ACCEPT = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  '.dwg',
  '.dxf',
  '.xls',
  '.xlsx',
  '.csv',
  '.doc',
  '.docx',
  'video/mp4',
  'video/quicktime',
].join(',');

const schema = z.object({
  categoria: z.enum(
    ['contrato', 'art_rrt', 'planta', 'relatorio', 'alvara', 'laudo', 'foto', 'outros'],
    { required_error: 'Selecione uma categoria' },
  ),
  observacoes: z.string().max(500, 'Máximo 500 caracteres').optional(),
  titulo: z.string().max(160).optional(),
  linkUrl: z.string().max(2000).optional(),
});

type FormData = z.infer<typeof schema>;
type Modo = 'arquivo' | 'link';

interface EnviarDocumentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoriaInicial?: ObraDocumento['categoria'];
  obraId: string;
}

export function EnviarDocumentoModal({
  open,
  onOpenChange,
  categoriaInicial,
  obraId,
}: EnviarDocumentoModalProps) {
  const { toast } = useToast();
  const criarAnexo = useCriarAnexo(obraId);
  const [modo, setModo] = useState<Modo>('arquivo');

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoria: categoriaInicial ?? 'contrato',
      observacoes: '',
      titulo: '',
      linkUrl: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    setModo('arquivo');
    form.reset({
      categoria: categoriaInicial ?? 'contrato',
      observacoes: '',
      titulo: '',
      linkUrl: '',
    });
  }, [open, categoriaInicial, form]);

  /** Chamado pelo FileUploader depois que o arquivo já está no bucket. */
  const vincularArquivo = async (fileId: string) => {
    const { categoria, observacoes } = form.getValues();
    await criarAnexo.mutateAsync({
      fileId,
      tipo: CATEGORIA_PARA_TIPO[categoria],
      observacao: observacoes?.trim() || null,
    });
    onOpenChange(false);
  };

  const salvarLink = async () => {
    const { categoria, observacoes, titulo, linkUrl } = form.getValues();
    const url = linkUrl?.trim() ?? '';
    const nome = titulo?.trim() ?? '';

    if (!nome) {
      form.setError('titulo', { message: 'Dê um nome ao link' });
      return;
    }
    if (!/^https?:\/\/.+/i.test(url)) {
      form.setError('linkUrl', { message: 'Informe um endereço começando com http:// ou https://' });
      return;
    }

    try {
      await criarAnexo.mutateAsync({
        linkUrl: url,
        titulo: nome,
        tipo: CATEGORIA_PARA_TIPO[categoria],
        observacao: observacoes?.trim() || null,
      });
      toast({ title: 'Link adicionado', description: nome });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Não foi possível adicionar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar documento</DialogTitle>
          <DialogDescription>
            Envie um arquivo da obra ou aponte para um projeto hospedado fora.
          </DialogDescription>
        </DialogHeader>

        {/* Alternador arquivo / link */}
        <div className="grid grid-cols-2 gap-2">
          {(['arquivo', 'link'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              className={cn(
                'flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold border transition-colors',
                modo === m
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800',
              )}
              data-testid={`modo-${m}`}
            >
              {m === 'arquivo' ? <IconUploadFile className="text-base" /> : <IconLink className="text-base" />}
              {m === 'arquivo' ? 'Arquivo' : 'Link'}
            </button>
          ))}
        </div>

        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-categoria-documento">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIAS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {modo === 'link' && (
              <>
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do link</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ex.: Projeto arquitetônico (Drive)"
                          data-testid="input-titulo-link"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="linkUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          inputMode="url"
                          placeholder="https://drive.google.com/..."
                          data-testid="input-url-link"
                        />
                      </FormControl>
                      <FormDescription>
                        Confira se o link está compartilhado com quem precisa abrir.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação (opcional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} maxLength={500} data-testid="input-observacao-documento" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {modo === 'arquivo' && (
              <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4 text-center">
                <FileUploader
                  kind="obra_anexo"
                  accept={ACCEPT}
                  obraId={obraId}
                  label="Escolher arquivo"
                  helper="Imagem até 10 MB · PDF, DWG, planilha e documento até 20 MB · vídeo até 50 MB"
                  testId="upload-documento-obra"
                  onUploaded={(file) => vincularArquivo(file.id)}
                />
              </div>
            )}
          </div>
        </Form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {modo === 'arquivo' ? 'Fechar' : 'Cancelar'}
          </Button>
          {modo === 'link' && (
            <Button type="button" onClick={salvarLink} disabled={criarAnexo.isPending} data-testid="button-salvar-link">
              {criarAnexo.isPending ? 'Salvando…' : 'Adicionar link'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
