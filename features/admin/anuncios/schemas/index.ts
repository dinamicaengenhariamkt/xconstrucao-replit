import { z } from 'zod';

const zonaBaseSchema = z.object({
  anuncianteId: z.string().min(1, 'Selecione um anunciante'),
  imagemUrl: z.string().url('URL inválida').min(1, 'URL da imagem é obrigatória'),
  urlDestino: z.string().url('URL inválida').min(1, 'URL de destino é obrigatória'),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().min(1, 'Data de fim é obrigatória'),
});

// sidebar card 4:3
export const zonaWebSchema = zonaBaseSchema.extend({
  titulo: z.string().min(1, 'Título é obrigatório').max(60, 'Máximo 60 caracteres'),
  textoCta: z.string().max(20, 'Máximo 20 caracteres').optional(),
});

// banner horizontal 728x90
export const zonaBannerSchema = zonaBaseSchema;

// Q&A card horizontal
export const zonaHelpSchema = zonaBaseSchema.extend({
  titulo: z.string().min(1, 'Título é obrigatório').max(60, 'Máximo 60 caracteres'),
  descricao: z.string().max(120, 'Máximo 120 caracteres').optional(),
});

export type ZonaWebFormData = z.infer<typeof zonaWebSchema>;
export type ZonaBannerFormData = z.infer<typeof zonaBannerSchema>;
export type ZonaHelpFormData = z.infer<typeof zonaHelpSchema>;

// ── Campanha edit ──────────────────────────────────────────────────────────
export const editarCampanhaSchema = z.object({
  titulo:       z.string().min(1, 'Título é obrigatório'),
  subtitulo:    z.string().optional(),
  anuncianteId: z.string().min(1, 'Selecione um anunciante'),
  zonaId:       z.string().min(1, 'Selecione a zona'),
  dataInicio:   z.string().min(1, 'Data de início é obrigatória'),
  dataFim:      z.string().min(1, 'Data de fim é obrigatória'),
  status:       z.enum(['ativa', 'pausada', 'agendada']),
});
export type EditarCampanhaFormData = z.infer<typeof editarCampanhaSchema>;

// ── Anunciante edit ────────────────────────────────────────────────────────
export const editarAnuncianteSchema = z.object({
  nome:     z.string().min(1, 'Nome é obrigatório'),
  sigla:    z.string().min(1, 'Sigla é obrigatória').max(4, 'Máximo 4 caracteres'),
  contato:  z.string().min(1, 'Nome do contato é obrigatório'),
  email:    z.string().email('E-mail inválido'),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
  status:   z.enum(['ativo', 'inativo']),
});
export type EditarAnuncianteFormData = z.infer<typeof editarAnuncianteSchema>;
