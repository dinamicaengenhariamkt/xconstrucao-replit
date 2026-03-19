export type {
  ObraRefAttachment,
  MessageAttachment,
  Conversation,
  Message,
  ObraPickerItem,
  ChatInputProps,
  ChatHeaderProps,
  MessageBubbleProps,
  ConversationListProps,
} from '@features/shared/xchat/types';

// Aliases — backward compat para código que importa com prefixo "Contratante"
export type { ObraRefAttachment as ContratanteObraRefAttachment } from '@features/shared/xchat/types';
export type { MessageAttachment as ContratanteMessageAttachment } from '@features/shared/xchat/types';
export type { Conversation as ContratanteConversation } from '@features/shared/xchat/types';
export type { Message as ContratanteMessage } from '@features/shared/xchat/types';
export type { ObraPickerItem as ContratanteObraPickerItem } from '@features/shared/xchat/types';
export type { ChatInputProps as ContratanteChatInputProps } from '@features/shared/xchat/types';
