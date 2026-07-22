'use client';

import { useState } from 'react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { useToast } from '@shared/hooks/use-toast';
import { formatCpfCnpj, isCpfCnpjValid } from '@shared/lib/masks';

interface PedidoCard {
  id: string;
  status: string;
  motivoRecusa: string | null;
  valorTotal: string;
  cobrancaStatus: string;
  invoiceUrl?: string | null;
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

/**
 * J53 — Um pedido aprovado e ainda pendente de pagamento (cobrança real ligada)
 * pode ser pago: se já há `invoiceUrl` (link idempotente), redireciona direto;
 * senão coleta CPF/CNPJ, chama `POST /pagar` e redireciona ao checkout Asaas.
 */
function podePagar(pedido: PedidoCard, adPaymentEnabled: boolean): boolean {
  return adPaymentEnabled && pedido.status === 'aprovado' && pedido.cobrancaStatus === 'pendente';
}

export function PedidoStatusCard({
  pedido,
  adPaymentEnabled = false,
  onPago,
}: {
  pedido: PedidoCard;
  adPaymentEnabled?: boolean;
  onPago?: () => void;
}) {
  const { toast } = useToast();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [enviando, setEnviando] = useState(false);

  const st = PEDIDO_STATUS[pedido.status] ?? { label: pedido.status, cls: 'bg-gray-100 text-gray-600' };
  const valor = Number(pedido.valorTotal || 0);
  const mostrarPagar = podePagar(pedido, adPaymentEnabled);

  const iniciarPagamento = () => {
    // Link já emitido antes → não repete CPF/CNPJ, vai direto ao checkout.
    if (pedido.invoiceUrl) {
      window.location.href = pedido.invoiceUrl;
      return;
    }
    setDialogAberto(true);
  };

  const confirmarPagamento = async () => {
    if (!isCpfCnpjValid(cpfCnpj)) {
      toast({ title: 'Informe um CPF ou CNPJ válido.', variant: 'destructive' });
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch(`/api/anuncios/pedidos/${pedido.id}/pagar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cpfCnpj }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; invoiceUrl?: string; message?: string };
      if (res.ok && data.invoiceUrl) {
        setDialogAberto(false);
        onPago?.();
        window.location.href = data.invoiceUrl;
        return;
      }
      toast({ title: data.message ?? 'Não foi possível gerar o pagamento.', variant: 'destructive' });
    } catch {
      toast({ title: 'Falha de conexão. Tente novamente.', variant: 'destructive' });
    } finally {
      setEnviando(false);
    }
  };

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
        <div className="flex items-center gap-2 shrink-0">
          {mostrarPagar && (
            <Button size="sm" onClick={iniciarPagamento} data-testid="button-pagar-pedido">
              Pagar
            </Button>
          )}
          <Badge className={st.cls}>{st.label}</Badge>
        </div>
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

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagamento do anúncio</DialogTitle>
            <DialogDescription>
              Informe o CPF ou CNPJ do responsável pelo pagamento. Você será levado ao checkout seguro.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={cpfCnpj}
            onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
            placeholder="CPF ou CNPJ"
            inputMode="numeric"
            data-testid="input-pagar-cpfcnpj"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAberto(false)} disabled={enviando}>
              Cancelar
            </Button>
            <Button onClick={confirmarPagamento} disabled={enviando} data-testid="button-pagar-confirmar">
              {enviando ? 'Gerando…' : 'Ir para o pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
