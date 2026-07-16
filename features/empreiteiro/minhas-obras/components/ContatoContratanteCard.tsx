'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { IconPerson, IconMail, IconChat } from '@shared/components/icons';
import { ChatAvatar } from '@features/shared/xchat/components/ChatAvatar';

interface ContatoContratanteCardProps {
  contratante: {
    nome: string;
    iniciais: string;
    cor: string;
    email?: string;
    avatarUrl?: string;
  };
  obraId: string;
  obraTitulo: string;
}

export function ContatoContratanteCard({ contratante, obraId, obraTitulo }: ContatoContratanteCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleEnviarMensagem = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch('/api/empreiteiro/chat/garantir-thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ obraId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any)?.message ?? 'Erro ao abrir conversa.');
      }
      const { threadId } = (await res.json()) as { threadId: string };
      router.push(`/empreiteiro/chat?thread=${threadId}`);
    } catch (err: any) {
      setErro(err?.message ?? 'Não foi possível abrir o chat. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [obraId, router]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <IconPerson className="text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Contato do Contratante</h2>
          <p className="text-xs text-gray-500">Para dúvidas ou agendamento de visita técnica</p>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-4 flex-shrink-0">
            <ChatAvatar
              avatarUrl={contratante.avatarUrl}
              initials={contratante.iniciais}
              color={contratante.cor}
              name={contratante.nome}
              className="w-16 h-16 text-2xl"
            />
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{contratante.nome}</p>
              <p className="text-sm text-gray-500">Contratante</p>
            </div>
          </div>

          {contratante.email && (
            <div className="flex-1">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                <IconMail className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">E-mail</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{contratante.email}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <button
              data-testid="btn-enviar-mensagem"
              onClick={handleEnviarMensagem}
              disabled={loading}
              className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <IconChat />
              {loading ? 'Abrindo…' : 'Enviar Mensagem'}
            </button>
            <span className="text-[10px] text-gray-400 font-medium">via xchat</span>
            {erro && (
              <p className="text-[11px] text-red-500 mt-1 text-center max-w-[160px]">{erro}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
