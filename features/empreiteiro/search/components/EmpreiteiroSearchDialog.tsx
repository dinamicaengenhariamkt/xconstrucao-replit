'use client';

import { GlobalSearchDialog } from '@features/shared/search/components/GlobalSearchDialog';
import { useEmpreiteiroGlobalSearch } from '../hooks/use-global-search';
import { EMPREITEIRO_SEARCH_CONFIG } from '../config';

interface EmpreiteiroSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmpreiteiroSearchDialog({ open, onOpenChange }: EmpreiteiroSearchDialogProps) {
  return (
    <GlobalSearchDialog
      open={open}
      onOpenChange={onOpenChange}
      config={EMPREITEIRO_SEARCH_CONFIG}
      useSearch={useEmpreiteiroGlobalSearch}
    />
  );
}
