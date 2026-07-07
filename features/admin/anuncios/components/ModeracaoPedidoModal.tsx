'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Textarea } from '@shared/components/ui/textarea';
import { Label } from '@shared/components/ui/label';
import { Input } from '@shared/components/ui/input';
import { AdCreativeCard } from '@features/shared/anuncios/components/AdCreativeCard';
import type { TemplateId } from '@features/shared/anuncios/templates/types';

export interface PedidoModeracaoSlot {
  id: string;
  zona: string;
  template: string;
  titulo: string;
  subtitulo: string | null;
  criativoUrl: string | null;
  ctaUrl: string | null;
  ctaTexto: string | null;
  conteudo: unknown | null;
  valorSlot: string;
  periodoInicio: string | null;
  periodoFim: string | null;
}

export interface PedidoModeracao {
  id: string;
  valorTotal: string;
  slots: PedidoModeracaoSlot[];
}

/** J23 — modal de moderação de um pedido: revisar slots, ajustar preço, aprovar/recusar. */
export function ModeracaoPedidoModal({
  pedido,
  onClose,
  onModerado,
}: {
  pedido: PedidoModeracao;
  onClose: () => void;
  onModerado: (msg: string) => void;
}) {
  const [motivo, setMotivo] = useState('');
  const [valorTotal, setValorTotal] = useState<string>(pedido.valorTotal);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const moderar = async (acao: 'aprovar' | 'recusar') => {
    setErro(null);
    if (acao === 'recusar' && motivo.trim().length === 0) {
      setErro('Informe o motivo da recusa.');
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch(`/api/admin/anuncios/pedidos/${pedido.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          acao,
          motivoRecusa: acao === 'recusar' ? motivo : undefined,
          valorTotal: acao === 'aprovar' ? Number(valorTotal) : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao moderar o pedido');
      }
      const data = await res.json();
      onModerado(
        acao === 'aprovar'
          ? `Pedido aprovado — ${data.slotsPublicados} anúncio(s) no ar${data.slotsPulados ? `, ${data.slotsPulados} pulado(s) por conflito de zona` : ''}.`
          : 'Pedido recusado e anunciante notificado.',
      );
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Moderar pedido de anúncio</DialogTitle>
          <DialogDescription>
            Revise cada criativo antes de aprovar. Aprovar publica os anúncios nas zonas escolhidas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {pedido.slots.map((s) => (
            <div key={s.id} className="grid md:grid-cols-2 gap-4 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="text-sm space-y-1">
                <p className="font-semibold text-gray-800 dark:text-gray-100">{s.titulo}</p>
                <p className="text-xs text-gray-500">Zona: {s.zona} · {s.template}</p>
                {s.ctaUrl && <p className="text-xs text-gray-500 break-all">Destino: {s.ctaUrl}</p>}
                {(s.periodoInicio || s.periodoFim) && (
                  <p className="text-xs text-gray-500">Período: {s.periodoInicio ?? '—'} → {s.periodoFim ?? '—'}</p>
                )}
                <p className="text-xs text-gray-500">
                  Valor: R$ {Number(s.valorSlot || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-950 p-3 flex items-center justify-center min-h-[150px]">
                <AdCreativeCard
                  template={s.template as TemplateId}
                  titulo={s.titulo}
                  subtitulo={s.subtitulo}
                  criativoUrl={s.criativoUrl}
                  ctaUrl={s.ctaUrl}
                  ctaTexto={s.ctaTexto}
                  conteudo={s.conteudo}
                  variant="preview"
                />
              </div>
            </div>
          ))}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Valor total cobrado (ajustável)</Label>
              <Input type="number" min="0" step="0.01" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} />
              <p className="text-[11px] text-amber-600 mt-1">Cobrança real entra na J31 (gateway).</p>
            </div>
            <div>
              <Label className="text-xs">Motivo (obrigatório p/ recusar)</Label>
              <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} placeholder="Ex.: criativo fora das diretrizes" />
            </div>
          </div>

          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={enviando}>Cancelar</Button>
          <Button variant="destructive" onClick={() => moderar('recusar')} disabled={enviando}>Recusar</Button>
          <Button onClick={() => moderar('aprovar')} disabled={enviando}>
            {enviando ? 'Processando…' : 'Aprovar e publicar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
