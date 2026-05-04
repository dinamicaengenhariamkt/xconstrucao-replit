'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  RiLayoutLine,
  RiDashboardLine,
  RiQuestionLine,
  RiSave3Line,
  RiInformationLine,
  RiImageLine,
} from 'react-icons/ri';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { Textarea } from '@shared/components/ui/textarea';
import { Button } from '@shared/components/ui/button';
import { ScrollArea } from '@shared/components/ui/scroll-area';
import { cn } from '@shared/lib/utils';
import {
  zonaWebSchema,
  zonaBannerSchema,
  zonaHelpSchema,
} from '../schemas';
import type {
  ZonaWebFormData,
  ZonaBannerFormData,
  ZonaHelpFormData,
} from '../schemas';
import type { ZonaAnuncio, Anunciante } from '../types';

const zonaIcone = {
  web: RiLayoutLine,
  dashboard: RiDashboardLine,
  help: RiQuestionLine,
};

const zonaContexto: Record<ZonaAnuncio['icone'], string> = {
  web: 'Sidebar card · Imagem proporção 4:3 (ex: 800×600 px) · Título até 60 chars · CTA opcional',
  dashboard: 'Banner horizontal · Dimensões: 728×90 px · Sem título',
  help: 'Card horizontal · Imagem landscape · Título até 60 chars · Descrição opcional (max 120)',
};

function getSchema(icone: ZonaAnuncio['icone']) {
  if (icone === 'web') return zonaWebSchema;
  if (icone === 'help') return zonaHelpSchema;
  return zonaBannerSchema;
}

type AnyFormData = ZonaWebFormData | ZonaBannerFormData | ZonaHelpFormData;

interface VincularZonaModalProps {
  zona: ZonaAnuncio | null;
  anunciantes: Anunciante[];
  onOpenChange: (open: boolean) => void;
}

export function VincularZonaModal({ zona, anunciantes, onOpenChange }: VincularZonaModalProps) {
  const isOpen = zona !== null;
  const isEditing = zona?.status === 'ativo';

  const form = useForm<AnyFormData>({
    resolver: zodResolver(zona ? getSchema(zona.icone) : zonaBannerSchema),
    defaultValues: {
      anuncianteId: '',
      imagemUrl: '',
      urlDestino: '',
      dataInicio: '',
      dataFim: '',
    },
  });

  // reset form whenever zone changes
  useEffect(() => {
    if (zona) {
      form.reset({
        anuncianteId: '',
        imagemUrl: '',
        urlDestino: '',
        dataInicio: '',
        dataFim: '',
        ...((zona.icone === 'web' || zona.icone === 'help') ? { titulo: '' } : {}),
        ...(zona.icone === 'web' ? { textoCta: '' } : {}),
        ...(zona.icone === 'help' ? { descricao: '' } : {}),
      });
    }
  }, [zona, form]);

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = (_data: AnyFormData) => {
    // No real mutation yet — API not implemented. Just close.
    handleClose();
  };

  if (!zona) return null;

  const Icone = zonaIcone[zona.icone];
  const isWeb = zona.icone === 'web';
  const isHelp = zona.icone === 'help';
  const showTitulo = isWeb || isHelp;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="w-full max-w-2xl max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden"
        data-testid="modal-vincular-zona"
      >
        {/* Header */}
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/5 rounded-lg">
              <Icone className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Editar anúncio' : 'Vincular anúncio'}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5">
                {zona.nome}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col gap-6">

            {/* Contexto da zona */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
              <RiInformationLine className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {zonaContexto[zona.icone]}
              </p>
            </div>

            <Form {...form}>
              <form
                id="form-vincular-zona"
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-5"
              >
                {/* Anunciante */}
                <FormField
                  control={form.control}
                  name="anuncianteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Anunciante <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-anunciante">
                            <SelectValue placeholder="Selecione um anunciante..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {anunciantes.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* URL da imagem */}
                <FormField
                  control={form.control}
                  name="imagemUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        URL da imagem <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <RiImageLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            placeholder="https://..."
                            className="pl-9"
                            {...field}
                            data-testid="input-imagem-url"
                          />
                        </div>
                      </FormControl>
                      <p className="text-xs text-gray-400 mt-1">
                        {zona.icone === 'web' && 'Proporção recomendada: 4:3 (ex: 800×600 px)'}
                        {zona.icone === 'dashboard' && 'Dimensões exatas: 728×90 px'}
                        {zona.icone === 'help' && 'Formato horizontal (landscape)'}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Título (web e help) */}
                {showTitulo && (
                  <FormField
                    control={form.control}
                    name={'titulo' as keyof AnyFormData}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Título <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Materiais de Construção - Promoção Verão"
                            maxLength={60}
                            {...field}
                            value={field.value as string ?? ''}
                            data-testid="input-titulo"
                          />
                        </FormControl>
                        <p className="text-xs text-gray-400 mt-1">Máximo 60 caracteres</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Texto do CTA (apenas web) */}
                {isWeb && (
                  <FormField
                    control={form.control}
                    name={'textoCta' as keyof AnyFormData}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Texto do botão CTA</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Ex: "Saiba mais" (opcional)'
                            maxLength={20}
                            {...field}
                            value={field.value as string ?? ''}
                            data-testid="input-texto-cta"
                          />
                        </FormControl>
                        <p className="text-xs text-gray-400 mt-1">Máximo 20 caracteres · Deixe vazio para não exibir botão</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Descrição (apenas help) */}
                {isHelp && (
                  <FormField
                    control={form.control}
                    name={'descricao' as keyof AnyFormData}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descrição breve do anúncio (opcional)..."
                            rows={3}
                            maxLength={120}
                            {...field}
                            value={field.value as string ?? ''}
                            data-testid="input-descricao"
                          />
                        </FormControl>
                        <p className="text-xs text-gray-400 mt-1">Máximo 120 caracteres</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* URL de destino */}
                <FormField
                  control={form.control}
                  name="urlDestino"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        URL de destino <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://parceiro.com.br/campanha"
                          {...field}
                          data-testid="input-url-destino"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-400 mt-1">Para onde o usuário será redirecionado ao clicar</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Período (data início + data fim) */}
                <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4')}>
                  <FormField
                    control={form.control}
                    name="dataInicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Data de início <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-data-inicio" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dataFim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Data de fim <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-data-fim" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-6 border-t border-gray-100 dark:border-gray-800 shrink-0 flex flex-row justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            data-testid="button-cancelar-zona"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-vincular-zona"
            data-testid="button-salvar-zona"
          >
            <RiSave3Line className="w-4 h-4 mr-2" />
            {isEditing ? 'Salvar alterações' : 'Salvar vínculo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
