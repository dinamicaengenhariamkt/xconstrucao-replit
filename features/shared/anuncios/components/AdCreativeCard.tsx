'use client';

import type { AdCreativeProps, TemplateId } from '../templates/types';
import { TEMPLATES } from '../templates';

/**
 * Dispatcher apresentacional (J24) — recebe `{ template, ...conteudo }` e delega
 * ao componente do template correspondente. Sem I/O e sem tracking (o host
 * injeta `onClick`). Fonte única do render: o mesmo componente é usado no slot,
 * no preview do admin e na vitrine da home — sem markup paralelo.
 */
export function AdCreativeCard(props: AdCreativeProps) {
  const entry = TEMPLATES[props.template as TemplateId] ?? TEMPLATES['imagem-card'];
  const Component = entry.Component;
  return <Component {...props} />;
}
