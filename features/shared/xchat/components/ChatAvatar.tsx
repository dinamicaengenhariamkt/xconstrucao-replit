'use client';

import { Avatar, AvatarImage, AvatarFallback } from '@shared/components/ui/avatar';
import { cn } from '@shared/lib/utils';

interface ChatAvatarProps {
  /** Foto real; quando ausente (ou falha ao carregar), cai no fallback de iniciais+cor. */
  avatarUrl?: string;
  initials: string;
  /** Classe de cor de fundo do fallback (ex.: `bg-blue-500`). */
  color: string;
  /** Nome para o alt da imagem. */
  name?: string;
  className?: string;
}

/**
 * Avatar do chat com foto real e fallback para iniciais+cor (J41 Item 7).
 * Reusado em ChatHeader, ConversationList e MessageBubble. Usa o `Avatar`
 * do Radix: se `avatarUrl` estiver ausente ou a imagem falhar, o
 * `AvatarFallback` (círculo colorido com iniciais) é exibido automaticamente.
 */
export function ChatAvatar({ avatarUrl, initials, color, name, className }: ChatAvatarProps) {
  return (
    <Avatar className={cn('w-10 h-10', className)}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={name ?? initials} />}
      <AvatarFallback className={cn('text-white text-sm font-bold', color)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
