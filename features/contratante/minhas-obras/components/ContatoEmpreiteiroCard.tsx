'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@shared/lib/utils';
import { useChatStore } from '@features/empreiteiro/xchat/store/chat-store';

interface ContatoEmpreiteiroCardProps {
  empreiteiro: {
    nome: string;
    iniciais: string;
    cor: string;
    email?: string;
    telefone?: string;
  };
  obraId: string;
  obraTitulo: string;
}

export function ContatoEmpreiteiroCard({ empreiteiro, obraId, obraTitulo }: ContatoEmpreiteiroCardProps) {
  const router = useRouter();
  const { addEphemeralConversation, sendMessage } = useChatStore();

  const handleEnviarMensagem = useCallback(() => {
    const newConv = {
      id: `conv-obra-${obraId}-${Date.now()}`,
      participantName: empreiteiro.nome,
      participantInitials: empreiteiro.iniciais,
      participantColor: empreiteiro.cor,
      obraNome: obraTitulo,
      obraId,
      lastMessage: `Olá! Tenho uma dúvida sobre a obra "${obraTitulo}".`,
      lastMessageTime: 'agora',
      unreadCount: 0,
      isActive: true,
    };
    addEphemeralConversation(newConv);
    sendMessage(newConv.id, `Olá! Tenho uma dúvida sobre a obra "${obraTitulo}".`);
    router.push('/contratante/chat');
  }, [empreiteiro, obraId, obraTitulo, addEphemeralConversation, sendMessage, router]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <span className="material-symbols-outlined text-primary">engineering</span>
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Contato do Empreiteiro</h2>
          <p className="text-xs text-gray-500">Para dúvidas ou atualizações sobre a obra</p>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className={cn('w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold', empreiteiro.cor)}>
              {empreiteiro.iniciais}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{empreiteiro.nome}</p>
              <p className="text-sm text-gray-500">Empreiteiro</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-2">
            {empreiteiro.email && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                <span className="material-symbols-outlined text-gray-400">mail</span>
                <div>
                  <p className="text-xs text-gray-500">E-mail</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{empreiteiro.email}</p>
                </div>
              </div>
            )}
            {empreiteiro.telefone && (
              <a
                href={`tel:${empreiteiro.telefone}`}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-primary/30 transition-colors"
              >
                <span className="material-symbols-outlined text-gray-400">phone</span>
                <div>
                  <p className="text-xs text-gray-500">Telefone</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{empreiteiro.telefone}</p>
                </div>
              </a>
            )}
          </div>

          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <button
              onClick={handleEnviarMensagem}
              className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">chat</span>
              Enviar Mensagem
            </button>
            <span className="text-[10px] text-gray-400 font-medium">via xchat</span>
          </div>
        </div>
      </div>
    </div>
  );
}
