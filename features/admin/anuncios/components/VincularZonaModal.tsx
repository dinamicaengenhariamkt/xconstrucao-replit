'use client';

import { useEffect, useState } from 'react';
import { RiLayoutLine, RiDashboardLine, RiQuestionLine, RiSave3Line, RiInformationLine } from 'react-icons/ri';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { ScrollArea } from '@shared/components/ui/scroll-area';
import { useToast } from '@shared/hooks/use-toast';
import { TEMPLATES } from '@features/shared/anuncios/templates';
import type { TemplateId } from '@features/shared/anuncios/templates/types';
import { AnuncioForm, buildConteudo, emptyFormState, type AnuncioFormState } from './AnuncioForm';
import { useCriarCampanha } from '../hooks/use-anuncios';
import type { ZonaAnuncio, Anunciante } from '../types';

const zonaIcone = {
  web: RiLayoutLine,
  dashboard: RiDashboardLine,
  help: RiQuestionLine,
};

const FALLBACK_TEMPLATES: Record<ZonaAnuncio['icone'], TemplateId[]> = {
  web: ['imagem-card'],
  dashboard: ['banner-imagem'],
  help: ['imagem-card', 'conteudo-texto'],
};

interface VincularZonaModalProps {
  zona: ZonaAnuncio | null;
  anunciantes: Anunciante[];
  onOpenChange: (open: boolean) => void;
}

/** Valida os campos exigidos do template antes de enviar. */
function validar(state: AnuncioFormState): string | null {
  if (!state.anuncianteId) return 'Selecione um anunciante.';
  const fields = TEMPLATES[state.template]?.fields ?? [];
  for (const f of fields) {
    if (!f.required) continue;
    if (f.kind === 'image-upload') {
      if (!state.criativoUrl) return `Envie a imagem (${f.label}).`;
    } else if (f.kind === 'data-blocks') {
      const ok = state.blocos.some((b) => b.rotulo.trim() && b.valor.trim());
      if (!ok) return 'Adicione ao menos um bloco de dados completo.';
    } else {
      const v = (state[f.name as keyof AnuncioFormState] as string) ?? '';
      if (!v.trim()) return `Preencha "${f.label}".`;
    }
  }
  return null;
}

export function VincularZonaModal({ zona, anunciantes, onOpenChange }: VincularZonaModalProps) {
  const isOpen = zona !== null;
  const { toast } = useToast();
  const criar = useCriarCampanha();

  const templatesDisponiveis = (zona?.templates?.length
    ? (zona.templates as TemplateId[])
    : zona
      ? FALLBACK_TEMPLATES[zona.icone]
      : ['imagem-card']) as TemplateId[];

  const [state, setState] = useState<AnuncioFormState>(() => emptyFormState(templatesDisponiveis[0]));

  // Reseta ao trocar de zona, ancorando no primeiro template compatível.
  useEffect(() => {
    if (zona) setState(emptyFormState(templatesDisponiveis[0]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zona?.id]);

  const handleClose = () => {
    onOpenChange(false);
  };

  async function handleSubmit() {
    const erro = validar(state);
    if (erro) {
      toast({ title: 'Verifique os campos', description: erro, variant: 'destructive' });
      return;
    }
    try {
      await criar.mutateAsync({
        anuncianteId: state.anuncianteId,
        zona: zona!.id,
        template: state.template,
        conteudo: buildConteudo(state) ?? undefined,
        titulo: state.titulo || '—',
        subtitulo: state.subtitulo || undefined,
        criativoUrl: state.criativoUrl || undefined,
        ctaTexto: state.ctaTexto || undefined,
        ctaUrl: state.ctaUrl || undefined,
        inicio: state.inicio || undefined,
        fim: state.fim || undefined,
        status: 'ativa',
      });
      toast({ title: 'Anúncio publicado', description: `Vinculado à zona ${zona!.nome}.` });
      handleClose();
    } catch (e) {
      toast({ title: 'Erro ao salvar', description: e instanceof Error ? e.message : 'Tente novamente.', variant: 'destructive' });
    }
  }

  if (!zona) return null;

  const Icone = zonaIcone[zona.icone];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="w-full max-w-4xl max-h-[92vh] p-0 flex flex-col gap-0 overflow-hidden"
        data-testid="modal-vincular-zona"
      >
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/5 rounded-lg">
              <Icone className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Vincular anúncio
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5">
                {zona.nome}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col gap-6">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
              <RiInformationLine className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {zona.descricao}
                {zona.multiplo && ' · Esta zona aceita múltiplos anúncios lado a lado.'}
              </p>
            </div>

            <AnuncioForm
              state={state}
              onChange={setState}
              templatesDisponiveis={templatesDisponiveis}
              anunciantes={anunciantes}
            />
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t border-gray-100 dark:border-gray-800 shrink-0 flex flex-row justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleClose} data-testid="button-cancelar-zona">
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={criar.isPending} data-testid="button-salvar-zona">
            <RiSave3Line className="w-4 h-4 mr-2" />
            {criar.isPending ? 'Salvando…' : 'Publicar anúncio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
