import type { TemplateId } from '@features/shared/anuncios/templates/types';

/** Slot em edição no montador de pedido (client-side). */
export interface SlotDraft {
  zona: string;
  template: TemplateId;
  titulo: string;
  subtitulo: string | null;
  criativoUrl: string | null;
  ctaUrl: string | null;
  ctaTexto: string | null;
  conteudo: Record<string, unknown> | null;
  periodoInicio: string | null;
  periodoFim: string | null;
}

/** Zona disponível para o anunciante escolher (vem de GET /api/anuncios/precos + catálogo). */
export interface ZonaOption {
  zona: string;
  nome: string;
  precoDia: number;
  multiplo: boolean;
  templates: string[];
}
