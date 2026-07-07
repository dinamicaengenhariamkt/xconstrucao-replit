/**
 * Registry de templates de anúncio (J24) — tipos puros, sem React.
 *
 * Importável tanto pelo servidor (validação em service/API) quanto pelo cliente
 * (seletor admin, preview, render público). Os componentes de render e o
 * binding completo do registry ficam em `index.tsx` (client); os validadores
 * server-safe em `schemas.ts`.
 */
import type { ComponentType } from "react";
import type { ZodType } from "zod";

export type TemplateId = "imagem-card" | "banner-imagem" | "conteudo-texto" | "destaque-dados";

/**
 * Onde o campo do formulário persiste:
 * - `column`  → coluna dedicada da tabela `anuncios` (retrocompat).
 * - `conteudo`→ chave dentro do JSONB `anuncios.conteudo`.
 */
export type FieldStorage = "column" | "conteudo";

export type FieldKind = "text" | "textarea" | "url" | "image-upload" | "data-blocks";

export interface FieldDescriptor {
  /** Nome do campo no formulário (= coluna ou chave de conteudo). */
  name: string;
  label: string;
  kind: FieldKind;
  required: boolean;
  storage: FieldStorage;
  maxLength?: number;
  placeholder?: string;
  help?: string;
}

/** Um bloco de dados do template `destaque-dados` (ex.: Ibovespa 179.847 ▲ 2,43%). */
export interface BlocoDado {
  rotulo: string;
  valor: string;
  variacao?: string;
  tendencia?: "up" | "down" | "flat";
}

/**
 * Props do dispatcher `AdCreativeCard` e de cada componente de template.
 * Apresentacional puro — sem I/O. O `onClick` (tracking) é injetado pelo slot
 * ou pela seção da home. `ctaUrl` chega já sanitizado (http(s) ou null).
 */
export interface AdCreativeProps {
  template: TemplateId;
  titulo: string;
  subtitulo: string | null;
  criativoUrl: string | null;
  ctaUrl: string | null;
  ctaTexto: string | null;
  conteudo: unknown | null;
  onClick?: () => void;
  /** "preview" mostra fallback explícito quando a imagem não carrega. */
  variant?: "preview" | "live";
}

export interface TemplateEntry {
  id: TemplateId;
  label: string;
  descricao: string;
  /** Campos exigidos/aceitos — dirige o formulário dinâmico do admin. */
  fields: FieldDescriptor[];
  /** Valida o subtree `conteudo` (JSONB) deste template. */
  conteudoSchema: ZodType;
  Component: ComponentType<AdCreativeProps>;
}
