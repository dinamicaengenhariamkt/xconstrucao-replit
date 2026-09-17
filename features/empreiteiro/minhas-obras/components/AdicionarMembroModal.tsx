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
import { IconAttachFile, IconPerson, IconPersonAdd } from '@shared/components/icons';
import { FileUploader } from '@features/shared/components/FileUploader';
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
  // XG22 — chave PIX sem máscara nem regex: pode ser CPF, CNPJ, e-mail,
  // telefone ou aleatória, e recusar formato aqui trava cadastro legítimo.
  pixChave: z.string().max(140, 'Máximo 140 caracteres').optional(),
  // Texto no formulário (aceita vírgula decimal); vira número no submit.
  valorContrato: z.string().optional(),
  // Alternativa ao upload: o contrato que mora no Drive.
  contratoLinkUrl: z
    .string()
    .trim()
    .max(2000, 'Link muito longo')
    .refine((v) => !v || /^https?:\/\//i.test(v), 'O link precisa começar com http:// ou https://')
    .optional()
    .or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

/** Aceita "1.234,56" e "1234.56"; devolve `undefined` quando não há número. */
function parseValor(bruto: string | undefined): number | undefined {
  const limpo = (bruto ?? '').trim();
  if (!limpo) return undefined;
  const normalizado = limpo.replace(/\./g, '').replace(',', '.');
  const n = Number(normalizado);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdicionarMembroModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  membro?: MembroEquipe | null;
  /** XG22 — o upload do contrato conta contra a quota da obra. */
  obraId: string;
  onSalvar: (data: Omit<MembroEquipe, 'id' | 'ativo' | 'permissao'>) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdicionarMembroModal({
  open,
  onOpenChange,
  membro,
  obraId,
  onSalvar,
}: AdicionarMembroModalProps) {
  const isEdit = !!membro;

  // XG22 — o anexo vive fora do react-hook-form: o upload já aconteceu quando o
  // usuário escolheu o arquivo, e o que guardamos é só a referência. Mesmo
  // arranjo do comprovante em `LancamentoFinanceiroModal`.
  const [contrato, setContrato] = useState<{ fileId: string; nome: string } | null>(null);

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
      pixChave: '',
      valorContrato: '',
      contratoLinkUrl: '',
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
          pixChave: membro.pixChave ?? '',
          // Vírgula decimal: é como o valor aparece para quem digita em pt-BR.
          valorContrato:
            membro.valorContrato == null
              ? ''
              : membro.valorContrato.toFixed(2).replace('.', ','),
          contratoLinkUrl: membro.contratoLinkUrl ?? '',
        });
        setContrato(
          membro.contratoFileId
            ? { fileId: membro.contratoFileId, nome: membro.contratoNome ?? 'Contrato anexado' }
            : null,
        );
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
          pixChave: '',
          valorContrato: '',
          contratoLinkUrl: '',
        });
        setContrato(null);
      }
    }
  }, [open, membro]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    form.reset();
    setContrato(null);
    onOpenChange(false);
  };

  const onSubmit = (data: FormData) => {
    const link = data.contratoLinkUrl?.trim() || undefined;
    // O servidor recusa os dois juntos; avisar aqui evita a ida e volta.
    if (contrato && link) {
      form.setError('contratoLinkUrl', {
        message: 'Você já anexou um arquivo. Remova-o para informar um link.',
      });
      return;
    }
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
      // XG22 — `null`, e não `undefined`, quando o campo foi esvaziado: no PATCH
      // `undefined` significa "não mexer", então limpar o PIX ou remover o
      // contrato não teria efeito nenhum.
      pixChave: data.pixChave?.trim() || null,
      valorContrato: parseValor(data.valorContrato) ?? null,
      contratoFileId: contrato?.fileId ?? null,
      contratoLinkUrl: link ?? null,
    });
    handleClose();
  };

  // XG19 — sem nome digitado, o fallback era o texto literal "??", que parecia
  // um dado quebrado. O círculo continua: ele é o preview ao vivo do avatar do
  // membro (segue a cor escolhida abaixo e espelha a lista de equipe); só o
  // conteúdo vira um ícone enquanto não há o que abreviar.
  const previewIniciais = gerarIniciais(nomeValue);
  const previewCor = corValue || 'bg-gray-300';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0', previewCor)}
              data-testid="membro-avatar-preview"
            >
              {previewIniciais ||
                (isEdit ? (
                  <IconPerson className="text-lg" aria-hidden />
                ) : (
                  <IconPersonAdd className="text-lg" aria-hidden />
                ))}
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

              {/*
                XG22 — pagamento e contrato. Separado por um divisor porque é
                outro assunto: os campos acima descrevem quem é a pessoa, estes
                descrevem o acordo com ela.
              */}
              <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Pagamento e contrato
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pixChave"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Chave PIX <span className="text-gray-400 font-normal">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="CPF, e-mail, telefone ou aleatória"
                          data-testid="input-pix-membro"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valorContrato"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Valor do contrato{' '}
                        <span className="text-gray-400 font-normal">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          inputMode="decimal"
                          placeholder="Ex: 12.000,00"
                          data-testid="input-valor-contrato-membro"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contrato assinado: arquivo OU link, nunca os dois. */}
              <div className="space-y-2">
                <FormLabel>
                  Contrato assinado <span className="text-gray-400 font-normal">(opcional)</span>
                </FormLabel>
                {contrato ? (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <span className="flex min-w-0 items-center gap-2 text-sm">
                      <IconAttachFile className="shrink-0 text-gray-500" aria-hidden />
                      <span className="truncate">{contrato.nome}</span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setContrato(null)}
                      data-testid="remover-contrato-membro"
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <>
                    <FileUploader
                      kind="obra_anexo"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      label="Anexar contrato"
                      helper="PDF ou imagem, até 50 MB."
                      buttonVariant="outline"
                      testId="upload-contrato-membro"
                      obraId={obraId}
                      onUploaded={(file) =>
                        setContrato({ fileId: file.id, nome: file.originalName })
                      }
                    />
                    <FormField
                      control={form.control}
                      name="contratoLinkUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="…ou cole um link (Drive, Dropbox)"
                              data-testid="input-contrato-link-membro"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
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
