'use client';

import { MessageArea as SharedMessageArea } from '@features/shared/xchat/components/MessageArea';
import type { Message } from '../types';

interface Props {
  messages: Message[];
  isLoading: boolean;
}

export function MessageArea({ messages, isLoading }: Props) {
  return <SharedMessageArea messages={messages} isLoading={isLoading} basePath="/empreiteiro" />;
}
