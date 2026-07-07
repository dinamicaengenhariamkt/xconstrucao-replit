'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { Badge } from '@shared/components/ui/badge';
import { useToast } from '@shared/hooks/use-toast';
import { RiInboxLine } from 'react-icons/ri';
import { ModeracaoPedidoModal, type PedidoModeracao } from './ModeracaoPedidoModal';

/**
 * J23 — Seção "Solicitações" do painel de anúncios (admin). Fila de moderação dos
 * pedidos self-service. Self-contained: busca a própria fila e abre o modal de
 * moderação. Injetada no fim de app/admin/anuncios/page.tsx sem tocar no resto.
 */
export function SolicitacoesAnunciosSection() {
  const { toast } = useToast();
  const [pedidos, setPedidos] = useState<PedidoModeracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecionado, setSelecionado] = useState<PedidoModeracao | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/anuncios/pedidos?status=em_analise', { credentials: 'include' });
      if (res.ok) setPedidos((await res.json()).pedidos ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const onModerado = (msg: string) => {
    toast({ title: msg });
    setSelecionado(null);
    carregar();
  };

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <RiInboxLine className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Solicitações de anúncio</h2>
        {pedidos.length > 0 && (
          <Badge className="bg-blue-100 text-blue-700">{pedidos.length} na fila</Badge>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Carregando fila…</p>
      ) : pedidos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-8 text-center text-sm text-gray-500">
          Nenhuma solicitação aguardando moderação.
        </div>
      ) : (
        <div className="grid gap-3">
          {pedidos.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {p.slots.length} local{p.slots.length !== 1 ? 'is' : ''} · R${' '}
                  {Number(p.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  <span className="text-[10px] font-normal text-amber-600 ml-1">(simulação)</span>
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {p.slots.map((s) => s.zona).join(', ')}
                </p>
              </div>
              <Button size="sm" onClick={() => setSelecionado(p)}>Moderar</Button>
            </div>
          ))}
        </div>
      )}

      {selecionado && (
        <ModeracaoPedidoModal
          pedido={selecionado}
          onClose={() => setSelecionado(null)}
          onModerado={onModerado}
        />
      )}
    </section>
  );
}
