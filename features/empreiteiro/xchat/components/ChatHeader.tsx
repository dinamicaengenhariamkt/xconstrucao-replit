'use client';

import { ChatHeader as SharedChatHeader } from '@features/shared/xchat/components/ChatHeader';
import type { Conversation } from '../types';

interface Props {
  conversation: Conversation | null;
}

export function ChatHeader({ conversation }: Props) {
  return <SharedChatHeader conversation={conversation} basePath="/empreiteiro" />;
}
