'use client';

import { ChatHeader as SharedChatHeader } from '@features/shared/xchat/components/ChatHeader';
import type { Conversation } from '../types';

interface Props {
  conversation: Conversation | null;
  onBack?: () => void;
  isTyping?: boolean;
}

export function ChatHeader({ conversation, onBack, isTyping }: Props) {
  return (
    <SharedChatHeader
      conversation={conversation}
      basePath="/contratante"
      onBack={onBack}
      isTyping={isTyping}
    />
  );
}
