/**
 * Registry de templates (J24) — validadores e descritores server-safe (sem React).
 *
 * Fonte única de verdade para: ids de template, validação de `conteudo` por
 * template (zod) e os descritores de campo que dirigem o formulário do admin.
 * Importado por `anuncios-service.ts` e pelas rotas de API (validação) e também
 * pelo `index.tsx` client (que apenas adiciona os componentes de render).
 *
 * IMPORTANTE: este módulo é server-safe (sem React). Código de servidor
 * (service/rotas) deve importar DAQUI, nunca de `./index` — que arrasta os
 * componentes `.tsx` para o bundle do servidor.
 */
import { z } from "zod";
import type { FieldDescriptor, TemplateId } from "./types";

export const TEMPLATE_IDS = ["imagem-card", "banner-imagem", "conteudo-texto", "destaque-dados"] as const;

export function isTemplateValido(t: string): t is TemplateId {
  return (TEMPLATE_IDS as readonly string[]).includes(t);
}

// ─── Schemas de `conteudo` (JSONB) por template ──────────────────────────────
// imagem-card e banner-imagem não usam conteudo extra (tudo em colunas).
const vazioSchema = z.object({}).strip().nullable();

const conteudoTextoSchema = z.object({
  texto: z.string().trim().min(1, "Texto obrigatório").max(600),
  fonte: z.string().trim().max(80).optional(),
  badge: z.string().trim().max(40).optional(),
});

const blocoSchema = z.object({
  rotulo: z.string().trim().min(1).max(40),
  valor: z.string().trim().min(1).max(40),
  variacao: z.string().trim().max(20).optional(),
  tendencia: z.enum(["up", "down", "flat"]).optional(),
});

const destaqueDadosSchema = z.object({
  fonte: z.string().trim().max(80).optional(),
  atualizadoEm: z.string().trim().max(40).optional(),
  blocos: z.array(blocoSchema).min(1, "Adicione ao menos um bloco").max(8),
});

/** Schema de `conteudo` por template. Usado na API antes de persistir. */
export const CONTEUDO_SCHEMAS: Record<TemplateId, z.ZodType> = {
  "imagem-card": vazioSchema,
  "banner-imagem": vazioSchema,
  "conteudo-texto": conteudoTextoSchema,
  "destaque-dados": destaqueDadosSchema,
};

// ─── Descritores de campo por template (dirigem o form dinâmico do admin) ────
export const TEMPLATE_FIELDS: Record<TemplateId, FieldDescriptor[]> = {
  "imagem-card": [
    { name: "criativoUrl", label: "Imagem do anúncio", kind: "image-upload", required: true, storage: "column", help: "Proporção 4:3 (ex: 800×600 px)" },
    { name: "titulo", label: "Título", kind: "text", required: true, storage: "column", maxLength: 60, placeholder: "Ex: Materiais de Construção — Promoção" },
    { name: "subtitulo", label: "Subtítulo", kind: "text", required: false, storage: "column", maxLength: 80, placeholder: "Opcional" },
    { name: "ctaTexto", label: "Texto do botão (CTA)", kind: "text", required: false, storage: "column", maxLength: 20, placeholder: 'Ex: "Saiba mais" (opcional)' },
    { name: "ctaUrl", label: "URL de destino", kind: "url", required: true, storage: "column", placeholder: "https://parceiro.com.br/campanha" },
  ],
  "banner-imagem": [
    { name: "criativoUrl", label: "Imagem do banner", kind: "image-upload", required: true, storage: "column", help: "Banner horizontal (ex: 728×90 px)" },
    { name: "ctaUrl", label: "URL de destino", kind: "url", required: true, storage: "column", placeholder: "https://parceiro.com.br/campanha" },
  ],
  "conteudo-texto": [
    { name: "badge", label: "Etiqueta", kind: "text", required: false, storage: "conteudo", maxLength: 40, placeholder: "Ex: Conteúdo de Marca" },
    { name: "criativoUrl", label: "Imagem de capa", kind: "image-upload", required: false, storage: "column", help: "Opcional · proporção 16:9" },
    { name: "titulo", label: "Título", kind: "text", required: true, storage: "column", maxLength: 90, placeholder: "Ex: Inovações em construção modular" },
    { name: "texto", label: "Texto", kind: "textarea", required: true, storage: "conteudo", maxLength: 600, placeholder: "Conteúdo editorial do anúncio…" },
    { name: "fonte", label: "Fonte / Autor", kind: "text", required: false, storage: "conteudo", maxLength: 80, placeholder: "Ex: Por Anunciante" },
    { name: "ctaTexto", label: "Texto do botão (CTA)", kind: "text", required: false, storage: "column", maxLength: 20, placeholder: "Opcional" },
    { name: "ctaUrl", label: "URL de destino", kind: "url", required: false, storage: "column", placeholder: "https://… (opcional)" },
  ],
  "destaque-dados": [
    { name: "titulo", label: "Título", kind: "text", required: true, storage: "column", maxLength: 60, placeholder: "Ex: Mercado da Construção" },
    { name: "blocos", label: "Blocos de dados", kind: "data-blocks", required: true, storage: "conteudo", help: "1 a 8 blocos (rótulo + valor + variação)" },
    { name: "fonte", label: "Fonte", kind: "text", required: false, storage: "conteudo", maxLength: 80, placeholder: "Ex: Valor PRO" },
    { name: "atualizadoEm", label: "Atualizado em", kind: "text", required: false, storage: "conteudo", maxLength: 40, placeholder: "Ex: 23/01/2026 18h00" },
    { name: "ctaUrl", label: "URL de destino", kind: "url", required: false, storage: "column", placeholder: "https://… (opcional)" },
  ],
};

export const TEMPLATE_LABELS: Record<TemplateId, string> = {
  "imagem-card": "Card com imagem",
  "banner-imagem": "Banner (só imagem)",
  "conteudo-texto": "Conteúdo editorial",
  "destaque-dados": "Destaque de dados",
};
