'use client';

import { useEffect } from 'react';
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
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/lib/utils';
import type { MembroEquipe } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPO_OPTIONS: { value: MembroEquipe['tipo']; label: string }[] = [
  { value: 'contratante', label: 'Contratante' },
  { value: 'engenheiro', label: 'Engenheiro' },
  { value: 'mestre', label: 'Mestre de Obras' },
  { value: 'equipe', label: 'Equipe' },
];

const COR_OPTIONS: { value: string; label: string; bg: string }[] = [
  { value: 'bg-blue-500', label: 'Azul', bg: 'bg-blue-500' },
  { value: 'bg-primary', label: 'Principal', bg: 'bg-primary' },
  { value: 'bg-amber-500', label: 'Âmbar', bg: 'bg-amber-500' },
  { value: 'bg-purple-500', label: 'Roxo', bg: 'bg-purple-500' },
  { value: 'bg-emerald-500', label: 'Verde', bg: 'bg-emerald-500' },
  { value: 'bg-red-500', label: 'Vermelho', bg: 'bg-red-500' },
  { value: 'bg-gray-500', label: 'Cinza', bg: 'bg-gray-500' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gerarIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório').max(80, 'Máximo 80 caracteres'),
  papel: z.string().min(1, 'Papel obrigatório').max(80, 'Máximo 80 caracteres'),
  tipo: z.enum(['contratante', 'engenheiro', 'mestre', 'equipe']),
  cor: z.string().min(1, 'Selecione uma cor'),
  telefone: z.string().max(20, 'Máximo 20 caracteres').optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  registro: z.string().max(50, 'Máximo 50 caracteres').optional(),
  membros: z.string().max(200, 'Máximo 200 caracteres').optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdicionarMembroModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  membro?: MembroEquipe | null;
  onSalvar: (data: Omit<MembroEquipe, 'id' | 'ativo' | 'permissao'>) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdicionarMembroModal({
  open,
  onOpenChange,
  membro,
  onSalvar,
}: AdicionarMembroModalProps) {
  const isEdit = !!membro;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      papel: '',
      tipo: 'engenheiro',
      cor: 'bg-primary',
      telefone: '',
      email: '',
      registro: '',
      membros: '',
    },
  });

  const tipoValue = form.watch('tipo');
  const nomeValue = form.watch('nome');
  const corValue = form.watch('cor');

  useEffect(() => {
    if (open) {
      if (membro) {
        form.reset({
          nome: membro.nome,
          papel: membro.papel,
          tipo: membro.tipo,
          cor: membro.cor,
          telefone: membro.telefone ?? '',
          email: membro.email ?? '',
          registro: membro.registro ?? '',
          membros: membro.membros ?? '',
        });
      } else {
        form.reset({
          nome: '',
          papel: '',
          tipo: 'engenheiro',
          cor: 'bg-primary',
          telefone: '',
          email: '',
          registro: '',
          membros: '',
        });
      }
    }
  }, [open, membro]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = (data: FormData) => {
    onSalvar({
      nome: data.nome.trim(),
      iniciais: gerarIniciais(data.nome),
      papel: data.papel.trim(),
      tipo: data.tipo,
      cor: data.cor,
      telefone: data.telefone?.trim() || undefined,
      email: data.email?.trim() || undefined,
      registro: data.registro?.trim() || undefined,
      membros: data.tipo === 'equipe' ? (data.membros?.trim() || undefined) : undefined,
    });
    handleClose();
  };

  const previewIniciais = gerarIniciais(nomeValue) || '??';
  const previewCor = corValue || 'bg-gray-300';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0', previewCor)}>
              {previewIniciais}
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                {isEdit ? 'Editar membro' : 'Adicionar membro'}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                {isEdit ? 'Altere os dados do colaborador' : 'Adicione um colaborador à equipe'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <Form {...form}>
            <form id="form-membro" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {/* Nome */}
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Carlos A. Silva" {...field} autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Papel + Tipo */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="papel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Função / Papel</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Engenheiro Resp." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIPO_OPTIONS.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Cor do avatar */}
              <FormField
                control={form.control}
                name="cor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor do avatar</FormLabel>
                    <FormControl>
                      <div className="flex gap-2 flex-wrap">
                        {COR_OPTIONS.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            title={c.label}
                            onClick={() => field.onChange(c.value)}
                            className={cn(
                              'w-8 h-8 rounded-full transition-all',
                              c.bg,
                              field.value === c.value
                                ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white scale-110'
                                : 'opacity-70 hover:opacity-100',
                            )}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Telefone + Email */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Telefone{' '}
                        <span className="text-gray-400 font-normal">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        E-mail{' '}
                        <span className="text-gray-400 font-normal">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="nome@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Registro profissional */}
              <FormField
                control={form.control}
                name="registro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Registro profissional{' '}
                      <span className="text-gray-400 font-normal">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: CREA-SP 123456-D" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Membros — apenas para tipo equipe */}
              {tipoValue === 'equipe' && (
                <FormField
                  control={form.control}
                  name="membros"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Membros da equipe{' '}
                        <span className="text-gray-400 font-normal">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Pedro, Marco, Ana" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </form>
          </Form>
        </div>

        {/* Footer */}
        <DialogFooter className="p-6 pt-0 flex flex-row justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-membro">
            {isEdit ? 'Salvar alterações' : 'Adicionar membro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
