'use client';

import { Badge } from '@shared/components/ui/badge';

interface PedidoCard {
  id: string;
  status: string;
  motivoRecusa: string | null;
  valorTotal: string;
  cobrancaStatus: string;
  criadoEm: string;
  slots: { id: string; zona: string; titulo: string; template: string }[];
}

const PEDIDO_STATUS: Record<string, { label: string; cls: string }> = {
  em_analise: { label: 'Em análise', cls: 'bg-blue-100 text-blue-700' },
  aprovado: { label: 'Aprovado', cls: 'bg-green-100 text-green-700' },
  publicado: { label: 'Publicado', cls: 'bg-green-100 text-green-700' },
  recusado: { label: 'Recusado', cls: 'bg-red-100 text-red-700' },
  encerrado: { label: 'Encerrado', cls: 'bg-gray-100 text-gray-600' },
};

export function PedidoStatusCard({ pedido }: { pedido: PedidoCard }) {
  const st = PEDIDO_STATUS[pedido.status] ?? { label: pedido.status, cls: 'bg-gray-100 text-gray-600' };
  const valor = Number(pedido.valorTotal || 0);
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Pedido · {pedido.slots.length} local{pedido.slots.length !== 1 ? 'is' : ''}
          </p>
          <p className="text-xs text-gray-500">
            R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            {pedido.cobrancaStatus === 'prototipo' || pedido.cobrancaStatus === 'isenta' ? (
              <span className="text-amber-600 ml-1">(simulação)</span>
            ) : null}
          </p>
        </div>
        <Badge className={st.cls}>{st.label}</Badge>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {pedido.slots.map((s) => (
          <span key={s.id} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
            {s.zona}
          </span>
        ))}
      </div>
      {pedido.status === 'recusado' && pedido.motivoRecusa && (
        <p className="mt-2 text-xs text-red-600">Motivo: {pedido.motivoRecusa}</p>
      )}
    </div>
  );
}
