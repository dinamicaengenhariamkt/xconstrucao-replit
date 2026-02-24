'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  RiMegaphoneLine,
  RiEditLine,
  RiSave3Line,
  RiArrowLeftLine,
  RiBarChartLine,
  RiUserLine,
  RiCalendarLine,
  RiLayoutLine,
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
import { Button } from '@shared/components/ui/button';
import { ScrollArea } from '@shared/components/ui/scroll-area';
import { cn } from '@shared/lib/utils';
import { editarCampanhaSchema } from '../schemas';
import type { EditarCampanhaFormData } from '../schemas';
import type { Campanha, Anunciante, AnuncioZonaId } from '../types';

const zonaOptions: { value: AnuncioZonaId; label: string }[] = [
  { value: 'sidebar-sup-contratante',      label: 'Sidebar Superior - Contratante' },
  { value: 'sidebar-inf-contratante',      label: 'Sidebar Inferior - Contratante' },
  { value: 'sidebar-sup-empreiteiro',      label: 'Sidebar Superior - Empreiteiro' },
  { value: 'sidebar-inf-empreiteiro',      label: 'Sidebar Inferior - Empreiteiro' },
  { value: 'banner-dashboard-contratante', label: 'Banner Dashboard - Contratante' },
  { value: 'banner-dashboard-empreiteiro', label: 'Banner Dashboard - Empreiteiro' },
  { value: 'banner-qa',                    label: 'Banner Q&A - Todas as personas' },
];

const statusOptions: { value: 'ativa' | 'pausada' | 'agendada'; label: string }[] = [
  { value: 'ativa',    label: 'Ativa' },
  { value: 'pausada',  label: 'Pausada' },
  { value: 'agendada', label: 'Agendada' },
];

const statusClasses: Record<string, string> = {
  ativa:    'bg-[#22846D]/10 text-[#22846D]',
  pausada:  'bg-amber-50 text-amber-600 dark:bg-amber-900/10 dark:text-amber-400',
  expirada: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  agendada: 'bg-blue-50 text-blue-600 dark:bg-blue-900/10 dark:text-blue-400',
};

const statusLabels: Record<string, string> = {
  ativa: 'Ativa', pausada: 'Pausada', expirada: 'Expirada', agendada: 'Agendada',
};

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtNumber(v: number) {
  return v.toLocaleString('pt-BR');
}
function fmtDate(s: string) {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

interface CampanhaModalProps {
  campanha: Campanha | null;
  initialMode?: 'view' | 'edit';
  anunciantes: Anunciante[];
  onOpenChange: (open: boolean) => void;
}

export function CampanhaModal({
  campanha,
  initialMode = 'view',
  anunciantes,
  onOpenChange,
}: CampanhaModalProps) {
  const isOpen = campanha !== null;
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);

  const form = useForm<EditarCampanhaFormData>({
    resolver: zodResolver(editarCampanhaSchema),
    defaultValues: {
      titulo: '',
      subtitulo: '',
      anuncianteId: '',
      zonaId: '',
      dataInicio: '',
      dataFim: '',
      status: 'ativa',
    },
  });

  useEffect(() => {
    setMode(initialMode);
    if (campanha) {
      const matched = anunciantes.find((a) => a.nome === campanha.anunciante);
      form.reset({
        titulo:       campanha.titulo,
        subtitulo:    campanha.subtitulo ?? '',
        anuncianteId: matched?.id ?? '',
        zonaId:       campanha.zonaId,
        dataInicio:   campanha.dataInicio,
        dataFim:      campanha.dataFim,
        status:       campanha.status === 'expirada' ? 'ativa' : campanha.status,
      });
    }
  }, [campanha, initialMode, anunciantes, form]);

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = (_data: EditarCampanhaFormData) => {
    handleClose();
  };

  if (!campanha) return null;

  const avatarInitials = campanha.anunciante
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="w-full max-w-2xl max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden"
        data-testid="modal-campanha"
      >
        {/* Header */}
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-primary/5 rounded-lg shrink-0">
                {mode === 'edit'
                  ? <RiEditLine className="w-6 h-6 text-primary" />
                  : <RiMegaphoneLine className="w-6 h-6 text-primary" />
                }
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white truncate">
                  {mode === 'edit' ? 'Editar campanha' : campanha.titulo}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500 mt-0.5 truncate">
                  {mode === 'edit' ? campanha.titulo : campanha.subtitulo}
                </DialogDescription>
              </div>
            </div>
            {mode === 'view' && (
              <span className={cn(
                'inline-flex shrink-0 px-3 py-1 rounded-full text-xs font-bold',
                statusClasses[campanha.status]
              )}>
                {statusLabels[campanha.status]}
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Body */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col gap-6">
            {mode === 'view' ? (
              <>
                {/* Anunciante */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <RiUserLine className="w-3.5 h-3.5" />
                    Anunciante
                  </p>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{avatarInitials}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{campanha.anunciante}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{campanha.anuncianteEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Zona + Período */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <RiLayoutLine className="w-3.5 h-3.5" />
                      Zona de exibição
                    </p>
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/10 dark:text-blue-400">
                        {campanha.zona}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <RiCalendarLine className="w-3.5 h-3.5" />
                      Período
                    </p>
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {fmtDate(campanha.dataInicio)} → {fmtDate(campanha.dataFim)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Métricas */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <RiBarChartLine className="w-3.5 h-3.5" />
                    Métricas
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Impressões', value: fmtNumber(campanha.impressoes) },
                      { label: 'Cliques',    value: fmtNumber(campanha.cliques) },
                      { label: 'CTR',        value: `${campanha.ctr.toFixed(2).replace('.', ',')}%` },
                      { label: 'Receita',    value: fmtCurrency(campanha.receita) },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 text-center"
                      >
                        <p className="text-xs text-gray-400 mb-1">{label}</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Edit form */
              <Form {...form}>
                <form
                  id="form-editar-campanha"
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="flex flex-col gap-5"
                >
                  {/* Título */}
                  <FormField
                    control={form.control}
                    name="titulo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Título <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Materiais de Construção"
                            {...field}
                            data-testid="input-campanha-titulo"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Subtítulo */}
                  <FormField
                    control={form.control}
                    name="subtitulo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtítulo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Campanha Verão 2024"
                            {...field}
                            data-testid="input-campanha-subtitulo"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Anunciante */}
                  <FormField
                    control={form.control}
                    name="anuncianteId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Anunciante <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            data-testid="select-campanha-anunciante"
                            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Selecione um anunciante...</option>
                            {anunciantes.map((a) => (
                              <option key={a.id} value={a.id}>{a.nome}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Zona */}
                  <FormField
                    control={form.control}
                    name="zonaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Zona de exibição <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            data-testid="select-campanha-zona"
                            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Selecione a zona...</option>
                            {zonaOptions.map((z) => (
                              <option key={z.value} value={z.value}>{z.label}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Status */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            data-testid="select-campanha-status"
                            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {statusOptions.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Período */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dataInicio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Data de início <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-campanha-data-inicio" />
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
                            <Input type="date" {...field} data-testid="input-campanha-data-fim" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-6 border-t border-gray-100 dark:border-gray-800 shrink-0 flex flex-row justify-end gap-3">
          {mode === 'view' ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                data-testid="button-fechar-campanha"
              >
                Fechar
              </Button>
              <Button
                type="button"
                onClick={() => setMode('edit')}
                data-testid="button-editar-campanha"
              >
                <RiEditLine className="w-4 h-4 mr-2" />
                Editar campanha
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setMode('view')}
                data-testid="button-voltar-campanha"
              >
                <RiArrowLeftLine className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                type="submit"
                form="form-editar-campanha"
                data-testid="button-salvar-campanha"
              >
                <RiSave3Line className="w-4 h-4 mr-2" />
                Salvar alterações
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
