'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@features/shared/components/PageHeader';
import { Button } from '@shared/components/ui/button';
import { useAuth } from '@features/auth/hooks/use-auth';
import { useToast } from '@shared/hooks/use-toast';
import { RiBuildingLine, RiToolsLine } from 'react-icons/ri';

export default function AnuncianteConfiguracoesPage() {
  const { user, refreshToken } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [enviando, setEnviando] = useState<string | null>(null);

  const tornarSe = async (role: 'contratante' | 'empreiteiro') => {
    setEnviando(role);
    try {
      const res = await fetch('/api/anunciante/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao adicionar o papel');
      }
      // Recarrega papéis no client (refresh re-emite o token e os roles).
      await refreshToken();
      toast({
        title: 'Pronto!',
        description: `Você agora também é ${role}. Estamos te levando para a nova área.`,
      });
      router.push(role === 'contratante' ? '/contratante/dashboard' : '/empreiteiro/dashboard');
    } catch (e) {
      toast({ title: 'Erro', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setEnviando(null);
    }
  };

  return (
    <div className="p-6 md:p-12 space-y-8 max-w-3xl">
      <PageHeader title="Configurações" subtitle="Sua conta de anunciante" />

      <section className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-2">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Dados da conta</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">{user?.name}</p>
        <p className="text-sm text-gray-500">{user?.email}</p>
      </section>

      {/* D2 — upgrade de papel reaproveitando o cadastro (mesma conta/login). */}
      <section className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Quer mais do que anunciar?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Você pode se tornar contratante (publicar obras) ou empreiteiro (buscar obras)
            sem criar outra conta — seus dados são reaproveitados.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => tornarSe('contratante')} disabled={enviando !== null}>
            <RiBuildingLine className="w-4 h-4 mr-2" />
            {enviando === 'contratante' ? 'Ativando…' : 'Tornar-me contratante'}
          </Button>
          <Button variant="outline" onClick={() => tornarSe('empreiteiro')} disabled={enviando !== null}>
            <RiToolsLine className="w-4 h-4 mr-2" />
            {enviando === 'empreiteiro' ? 'Ativando…' : 'Tornar-me empreiteiro'}
          </Button>
        </div>
      </section>
    </div>
  );
}
