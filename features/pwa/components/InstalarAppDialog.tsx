'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { InstalarAppPassos } from './InstalarAppPassos';

export function InstalarAppDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (aberto: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" data-testid="dialog-instalar-app">
        <DialogHeader>
          <DialogTitle>Instalar o app no celular</DialogTitle>
          <DialogDescription>
            O xgestão fica na tela inicial, como um aplicativo, e abre direto nas suas obras.
          </DialogDescription>
        </DialogHeader>
        <InstalarAppPassos />
      </DialogContent>
    </Dialog>
  );
}
