'use client';

import { GlobalSearchDialog } from '@features/shared/search/components/GlobalSearchDialog';
import { useContratanteGlobalSearch } from '../hooks/use-global-search';
import { CONTRATANTE_SEARCH_CONFIG } from '../config';

interface ContratanteSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContratanteSearchDialog({ open, onOpenChange }: ContratanteSearchDialogProps) {
  return (
    <GlobalSearchDialog
      open={open}
      onOpenChange={onOpenChange}
      config={CONTRATANTE_SEARCH_CONFIG}
      useSearch={useContratanteGlobalSearch}
    />
  );
}
