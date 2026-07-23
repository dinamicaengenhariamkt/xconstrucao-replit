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
import { LegalDocumentView } from '@features/legal/components/LegalDocumentView';

/**
 * J59 — Modal do Termo do Anunciante. Aberto quando o POST de pedido responde
 * `CONTRATO_ANUNCIANTE_NAO_ACEITO`. Renderiza o termo vigente (Markdown seguro)
 * e, ao "Li e aceito", registra o consentimento e chama `onAceito` (o chamador
 * reenvia o pedido). É bloqueante: sem aceitar não fecha.
 */
export function ContratoAnuncianteModal({
  open,
  onOpenChange,
  onAceito,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAceito: () => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const aceitar = async () => {
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch('/api/anunciante/contrato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Não foi possível registrar o aceite.');
      }
      onOpenChange(false);
      onAceito();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !enviando && onOpenChange(o)}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col" data-testid="modal-contrato-anunciante">
        <DialogHeader>
          <DialogTitle>Termo do Anunciante</DialogTitle>
          <DialogDescription>
            Antes de anunciar, leia e aceite o Termo do Anunciante. O aceite fica registrado.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-1 text-sm">
          <LegalDocumentView tipo="termo_anunciante" />
        </div>

        {erro && <p className="text-sm text-destructive">{erro}</p>}

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={aceitar} disabled={enviando} data-testid="button-aceitar-contrato">
            {enviando ? 'Registrando…' : 'Li e aceito'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
