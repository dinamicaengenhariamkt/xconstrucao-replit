'use client';

import { GlobalSearchDialog } from '@features/shared/search/components/GlobalSearchDialog';
import { useAdminGlobalSearch } from '../hooks/use-global-search';
import { ADMIN_SEARCH_CONFIG } from '../config';

interface AdminSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminSearchDialog({ open, onOpenChange }: AdminSearchDialogProps) {
  return (
    <GlobalSearchDialog
      open={open}
      onOpenChange={onOpenChange}
      config={ADMIN_SEARCH_CONFIG}
      useSearch={useAdminGlobalSearch}
    />
  );
}
