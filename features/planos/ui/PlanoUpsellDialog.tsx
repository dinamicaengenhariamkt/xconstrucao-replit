'use client';

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { RiVipCrownLine } from 'react-icons/ri';

export interface PlanoUpsellDialogProps {
  open: boolean;
  onClose: () => void;
  /** Descrição do recurso atingido, ex: "5 propostas/mês", "1 obra aberta" */
  descricaoLimite: string;
  /** URL para a página de planos da persona */
  planosHref: '/empreiteiro/planos' | '/contratante/planos' | '/xgestao/planos';
}

/**
 * Dialog de upsell contextual — aparece quando o backend retorna 402 LIMITE_PLANO.
 * Mostra o limite exato que foi atingido e oferece CTA direto para upgrade.
 */
export function PlanoUpsellDialog({ open, onClose, descricaoLimite, planosHref }: PlanoUpsellDialogProps) {
  const router = useRouter();

  function irParaPlanos() {
    router.push(planosHref);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-upsell-plano">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <RiVipCrownLine className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle>Limite do plano atingido</DialogTitle>
          </div>
          <DialogDescription>
            Você atingiu o limite de <strong>{descricaoLimite}</strong> do seu plano atual.
            Faça upgrade para continuar usando sem interrupções.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} data-testid="button-upsell-agora-nao">
            Agora não
          </Button>
          <Button onClick={irParaPlanos} data-testid="button-upsell-ver-planos">
            <RiVipCrownLine className="w-4 h-4 mr-1.5" />
            Ver planos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
