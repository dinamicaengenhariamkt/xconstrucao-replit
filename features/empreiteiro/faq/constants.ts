import type { IconType } from 'react-icons';
import { isMockEnabled } from '@/features/shared/lib/mock-flag';
import {
  RiUserAddLine,
  RiBuildingLine,
  RiWalletLine,
  RiCustomerService2Line,
} from 'react-icons/ri';

export const ENABLE_MOCK = isMockEnabled();

export const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export const FAQ_CATEGORIES: Record<string, string> = {
  cadastro: 'Cadastro e Conta',
  obras: 'Obras',
  pagamentos: 'Pagamentos',
  suporte: 'Suporte Técnico',
};

export const FAQ_CATEGORY_META: Record<string, {
  description: string;
  iconBg: string;
  iconColor: string;
}> = {
  cadastro: {
    description: 'Registro, alteração de dados e recuperação de senha.',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600',
  },
  obras: {
    description: 'Candidatura, prazos e cancelamento em obras disponíveis.',
    iconBg: 'bg-red-50 dark:bg-red-900/20',
    iconColor: 'text-red-500',
  },
  pagamentos: {
    description: 'Recebimento por etapa, taxas da plataforma e nota fiscal.',
    iconBg: 'bg-purple-50 dark:bg-purple-900/20',
    iconColor: 'text-purple-600',
  },
  suporte: {
    description: 'Canais de atendimento e como reportar problemas técnicos.',
    iconBg: 'bg-green-50 dark:bg-green-900/20',
    iconColor: 'text-green-600',
  },
};

export const FAQ_CATEGORY_ICONS: Record<string, IconType> = {
  cadastro: RiUserAddLine,
  obras: RiBuildingLine,
  pagamentos: RiWalletLine,
  suporte: RiCustomerService2Line,
};

export const FAQ_SUBTITLE =
  'Encontre respostas sobre cadastro, candidaturas, obras e pagamentos.';
