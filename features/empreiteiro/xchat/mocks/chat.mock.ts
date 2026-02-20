import type { Conversation, Message } from '../types';

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    participantName: 'Carlos Mendes',
    participantInitials: 'CM',
    participantColor: 'bg-blue-500',
    obraNome: 'Residência Parque das Flores',
    lastMessage: 'Bom dia! Podemos agendar uma visita para amanhã?',
    lastMessageTime: '10:30',
    unreadCount: 2,
    isActive: true,
  },
  {
    id: 'conv-2',
    participantName: 'Ana Ferreira',
    participantInitials: 'AF',
    participantColor: 'bg-amber-500',
    obraNome: 'Edifício Comercial Horizonte',
    lastMessage: 'A documentação foi aprovada pela prefeitura.',
    lastMessageTime: 'Ontem',
    unreadCount: 0,
    isActive: false,
  },
  {
    id: 'conv-3',
    participantName: 'Roberto Lima',
    participantInitials: 'RL',
    participantColor: 'bg-green-600',
    obraNome: 'Reforma Loja Center Norte',
    lastMessage: 'Preciso do orçamento atualizado até sexta.',
    lastMessageTime: 'Seg',
    unreadCount: 1,
    isActive: false,
  },
  {
    id: 'conv-4',
    participantName: 'Maria Clara Santos',
    participantInitials: 'MC',
    participantColor: 'bg-purple-500',
    obraNome: 'Casa de Praia Ubatuba',
    lastMessage: 'Obra finalizada! Obrigada pelo excelente trabalho.',
    lastMessageTime: '15/02',
    unreadCount: 0,
    isActive: false,
  },
];

export const mockMessages: Record<string, Message[]> = {
  'conv-1': [
    { id: 'm1', senderId: 'other', senderName: 'Carlos Mendes', content: 'Olá! Tudo bem?', timestamp: '09:00', isOwn: false, type: 'text' },
    { id: 'm2', senderId: 'me', senderName: 'Você', content: 'Tudo ótimo, Carlos! Como posso ajudar?', timestamp: '09:05', isOwn: true, type: 'text' },
    { id: 'm3', senderId: 'other', senderName: 'Carlos Mendes', content: 'Gostaria de discutir o andamento da obra. A fundação está dentro do prazo?', timestamp: '09:10', isOwn: false, type: 'text' },
    { id: 'm4', senderId: 'me', senderName: 'Você', content: 'Sim, estamos dentro do cronograma. A concretagem da laje será na próxima semana.', timestamp: '09:15', isOwn: true, type: 'text' },
    { id: 'm5', senderId: 'other', senderName: 'Carlos Mendes', content: 'Excelente! E quanto ao material que solicitei?', timestamp: '10:20', isOwn: false, type: 'text' },
    { id: 'm6', senderId: 'other', senderName: 'Carlos Mendes', content: 'Bom dia! Podemos agendar uma visita para amanhã?', timestamp: '10:30', isOwn: false, type: 'text' },
  ],
  'conv-2': [
    { id: 'm7', senderId: 'other', senderName: 'Ana Ferreira', content: 'Oi, tudo bem? Temos novidades sobre a documentação.', timestamp: 'Ontem 14:00', isOwn: false, type: 'text' },
    { id: 'm8', senderId: 'me', senderName: 'Você', content: 'Oi Ana! Pode falar.', timestamp: 'Ontem 14:05', isOwn: true, type: 'text' },
    { id: 'm9', senderId: 'other', senderName: 'Ana Ferreira', content: 'A documentação foi aprovada pela prefeitura.', timestamp: 'Ontem 14:10', isOwn: false, type: 'text' },
  ],
  'conv-3': [
    { id: 'm10', senderId: 'other', senderName: 'Roberto Lima', content: 'Preciso do orçamento atualizado até sexta.', timestamp: 'Seg 16:00', isOwn: false, type: 'text' },
  ],
  'conv-4': [
    { id: 'm11', senderId: 'other', senderName: 'Maria Clara Santos', content: 'Obra finalizada! Obrigada pelo excelente trabalho.', timestamp: '15/02 09:00', isOwn: false, type: 'text' },
    { id: 'm12', senderId: 'me', senderName: 'Você', content: 'Obrigado, Maria! Foi um prazer trabalhar neste projeto.', timestamp: '15/02 09:30', isOwn: true, type: 'text' },
  ],
};
