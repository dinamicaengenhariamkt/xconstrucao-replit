'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { Badge } from '@shared/components/ui/badge';
import { useToast } from '@shared/hooks/use-toast';
import { RiPauseLine, RiPlayLine, RiMegaphoneLine } from 'react-icons/ri';
import { PedidoStatusCard } from './PedidoStatusCard';

interface MeuAnuncio {
  id: string;
  titulo: string;
  zona: string;
  template: string;
  status: string;
  criativoUrl: string | null;
  inicio: string | null;
  fim: string | null;
}

interface Pedido {
  id: string;
  status: string;
  motivoRecusa: string | null;
  valorTotal: string;
  cobrancaStatus: string;
  criadoEm: string;
  slots: { id: string; zona: string; titulo: string; template: string }[];
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  ativa: { label: 'No ar', cls: 'bg-green-100 text-green-700' },
  pausada: { label: 'Pausado', cls: 'bg-amber-100 text-amber-700' },
  expirada: { label: 'Expirado', cls: 'bg-gray-100 text-gray-600' },
  rascunho: { label: 'Rascunho', cls: 'bg-gray-100 text-gray-600' },
  agendada: { label: 'Agendado', cls: 'bg-blue-100 text-blue-700' },
};

/**
 * J23 — listagem unificada de "Meus Anúncios" (compartilhada entre as visões de
 * anunciante, contratante e empreiteiro). Mostra os pedidos (com status de
 * moderação) e os anúncios materializados, com gestão (pausar/reativar).
 */
export function MeusAnunciosLista() {
  const { toast } = useToast();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [anuncios, setAnuncios] = useState<MeuAnuncio[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [rp, ra] = await Promise.all([
        fetch('/api/anuncios/pedidos', { credentials: 'include' }),
        fetch('/api/anuncios/meus', { credentials: 'include' }),
      ]);
      if (rp.ok) setPedidos((await rp.json()).pedidos ?? []);
      if (ra.ok) setAnuncios((await ra.json()).anuncios ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const gerir = async (id: string, acao: 'pausar' | 'reativar') => {
    const res = await fetch(`/api/anuncios/meus/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ acao }),
    });
    if (res.ok) {
      toast({ title: acao === 'pausar' ? 'Anúncio pausado' : 'Anúncio reativado' });
      carregar();
    } else {
      toast({ title: 'Erro ao atualizar anúncio', variant: 'destructive' });
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Carregando seus anúncios…</p>;

  return (
    <div className="space-y-8">
      {/* Anúncios no ar / gestão */}
      <section>
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">Anúncios publicados</h3>
        {anuncios.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-8 text-center text-sm text-gray-500">
            <RiMegaphoneLine className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            Você ainda não tem anúncios publicados.
          </div>
        ) : (
          <div className="grid gap-3">
            {anuncios.map((a) => {
              const st = STATUS_LABEL[a.status] ?? { label: a.status, cls: 'bg-gray-100 text-gray-600' };
              return (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{a.titulo}</p>
                    <p className="text-xs text-gray-500">{a.zona} · {a.template}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge className={st.cls}>{st.label}</Badge>
                    {a.status === 'ativa' && (
                      <Button size="sm" variant="outline" onClick={() => gerir(a.id, 'pausar')}>
                        <RiPauseLine className="w-4 h-4 mr-1" /> Pausar
                      </Button>
                    )}
                    {a.status === 'pausada' && (
                      <Button size="sm" variant="outline" onClick={() => gerir(a.id, 'reativar')}>
                        <RiPlayLine className="w-4 h-4 mr-1" /> Reativar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Pedidos (moderação) */}
      <section>
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">Pedidos</h3>
        {pedidos.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum pedido enviado ainda.</p>
        ) : (
          <div className="grid gap-3">
            {pedidos.map((p) => (
              <PedidoStatusCard key={p.id} pedido={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
