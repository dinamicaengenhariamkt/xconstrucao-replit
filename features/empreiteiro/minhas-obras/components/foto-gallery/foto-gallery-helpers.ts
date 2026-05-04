import {
  IconHistory,
  IconPending,
  IconCheckCircle,
  IconBlock,
} from '@shared/components/icons';
import type { ObraFoto } from '../../types';

export type FaseOption = ObraFoto['fase'];

/** Mapeamento de chave → ícone usado no menu de definir fase. */
export const FASE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  history: IconHistory,
  pending: IconPending,
  check_circle: IconCheckCircle,
  block: IconBlock,
};

/** Visual config por fase (badge, cores). */
export const FASE_CONFIG: Record<
  NonNullable<FaseOption>,
  { label: string; badgeBg: string; badgeText: string }
> = {
  antes: {
    label: 'Antes',
    badgeBg: 'bg-gray-200/90 dark:bg-gray-700/90',
    badgeText: 'text-gray-700 dark:text-gray-200',
  },
  durante: {
    label: 'Durante',
    badgeBg: 'bg-amber-100/90 dark:bg-amber-900/70',
    badgeText: 'text-amber-700 dark:text-amber-300',
  },
  agora: {
    label: 'Agora',
    badgeBg: 'bg-success/10 dark:bg-success/20',
    badgeText: 'text-success',
  },
};

export type FotoModalType = 'upload' | 'etiqueta' | 'excluir' | 'enviar_confirm' | null;

export interface FotoModalState {
  type: FotoModalType;
  foto: ObraFoto | null;
}

/** Gera id único para fotos novas. */
export function gerarFotoId(): string {
  return `f${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Encontra a melhor foto para representar uma fase: a mais recente da fase,
 * ou um fallback caso não haja nenhuma.
 */
export function melhorFoto(
  fotos: ObraFoto[],
  fase: FaseOption,
  fallback: ObraFoto,
): ObraFoto {
  const comFase = fotos.filter((f) => f.fase === fase);
  if (comFase.length > 0) return comFase[comFase.length - 1];
  return fallback;
}
