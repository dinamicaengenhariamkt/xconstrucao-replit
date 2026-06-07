/**
 * Registry de templates (J24) — binding completo (client): liga cada template ao
 * seu componente de render, label, descritores de campo e schema de conteudo.
 *
 * Fonte única consumida pelo seletor admin, pelo preview e pelo render público.
 * Os validadores/descritores server-safe vêm de `schemas.ts`.
 */
import type { TemplateEntry, TemplateId } from './types';
import { CONTEUDO_SCHEMAS, TEMPLATE_FIELDS, TEMPLATE_IDS, TEMPLATE_LABELS } from './schemas';
import { ImagemCardTemplate } from './components/ImagemCardTemplate';
import { BannerImagemTemplate } from './components/BannerImagemTemplate';
import { ConteudoTextoTemplate } from './components/ConteudoTextoTemplate';
import { DestaqueDadosTemplate } from './components/DestaqueDadosTemplate';

const COMPONENTS: Record<TemplateId, TemplateEntry['Component']> = {
  'imagem-card': ImagemCardTemplate,
  'banner-imagem': BannerImagemTemplate,
  'conteudo-texto': ConteudoTextoTemplate,
  'destaque-dados': DestaqueDadosTemplate,
};

const DESCRICOES: Record<TemplateId, string> = {
  'imagem-card': 'Imagem 4:3 + título + CTA. Ideal para sidebar.',
  'banner-imagem': 'Apenas a imagem, clicável. Ideal para banners.',
  'conteudo-texto': 'Card editorial com título, texto e fonte (advertorial).',
  'destaque-dados': 'Card com blocos de dados (cotações, índices, métricas).',
};

export const TEMPLATES: Record<TemplateId, TemplateEntry> = Object.fromEntries(
  TEMPLATE_IDS.map((id) => [
    id,
    {
      id,
      label: TEMPLATE_LABELS[id],
      descricao: DESCRICOES[id],
      fields: TEMPLATE_FIELDS[id],
      conteudoSchema: CONTEUDO_SCHEMAS[id],
      Component: COMPONENTS[id],
    } satisfies TemplateEntry,
  ]),
) as Record<TemplateId, TemplateEntry>;

export { TEMPLATE_IDS, isTemplateValido } from './schemas';
export type { TemplateId, TemplateEntry, FieldDescriptor, AdCreativeProps, BlocoDado } from './types';
