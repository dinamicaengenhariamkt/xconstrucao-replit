import { z } from 'zod';

export const novaObraSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  tipo: z.string().min(1, 'Selecione o tipo de obra'),
  complexidade: z.enum(['baixa', 'media', 'alta'], { required_error: 'Selecione a complexidade' }),
  descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  cep: z.string().min(8, 'CEP inválido'),
  endereco: z.string().min(5, 'Endereço obrigatório'),
  cidade: z.string().min(2, 'Cidade obrigatória'),
  estado: z.string().min(2, 'Selecione o estado'),
  dataInicio: z.string().min(1, 'Data de início obrigatória'),
  dataPrevisaoFim: z.string().min(1, 'Data de previsão obrigatória'),
  orcamento: z.string().min(1, 'Orçamento obrigatório'),
  observacoes: z.string().optional(),
});

export type NovaObraFormData = z.infer<typeof novaObraSchema>;

export type TipoObra = 'residencial' | 'comercial' | 'industrial' | 'reforma' | 'infraestrutura';

export const TIPOS_OBRA: { value: TipoObra; label: string }[] = [
  { value: 'residencial', label: 'Residencial' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'reforma', label: 'Reforma' },
  { value: 'infraestrutura', label: 'Infraestrutura' },
];

export const COMPLEXIDADES: { value: 'baixa' | 'media' | 'alta'; label: string; descricao: string; selectedClass: string }[] = [
  { value: 'baixa', label: 'Baixa', descricao: 'Obras simples, pouca especialização', selectedClass: 'text-green-600 border-green-400 bg-green-50 dark:bg-green-900/20' },
  { value: 'media', label: 'Média', descricao: 'Técnica moderada, múltiplas especialidades', selectedClass: 'text-amber-600 border-amber-400 bg-amber-50 dark:bg-amber-900/20' },
  { value: 'alta', label: 'Alta', descricao: 'Alta especialização, projetos complexos', selectedClass: 'text-red-600 border-red-400 bg-red-50 dark:bg-red-900/20' },
];
