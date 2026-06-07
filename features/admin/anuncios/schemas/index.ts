import { z } from 'zod';

// Nota (J24): os antigos schemas de vínculo por zona (zonaWeb/Banner/Help) foram
// substituídos pelo formulário dirigido por template (AnuncioForm + registry de
// templates). A validação de `conteudo` por template vive em
// features/shared/anuncios/templates/schemas.ts.

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
