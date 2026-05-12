'use client';

import { useEffect, useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { RiEyeLine, RiCloseLine } from 'react-icons/ri';
import { useToast } from '@shared/hooks/use-toast';

interface MeResponse {
  impersonation?: {
    actorName: string;
    actorEmail: string;
    targetName: string;
    targetEmail: string;
    targetRole: string;
  } | null;
}

export function ImpersonationBanner() {
  const [imp, setImp] = useState<MeResponse['impersonation']>(null);
  const [exiting, setExiting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((data: MeResponse | null) => setImp(data?.impersonation ?? null))
      .catch(() => {});
  }, []);

  if (!imp) return null;

  const exit = async () => {
    setExiting(true);
    try {
      await fetch('/api/admin/impersonate/exit', { method: 'POST', credentials: 'include' });
      toast({ title: 'Modo "Ver como" encerrado' });
      window.location.href = '/admin/configuracoes?section=usuarios';
    } catch {
      toast({ title: 'Erro ao sair do modo', variant: 'destructive' });
      setExiting(false);
    }
  };

  return (
    <div
      className="sticky top-0 z-50 w-full bg-amber-500 text-amber-950 border-b-2 border-amber-700 shadow-md"
      data-testid="impersonation-banner"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <RiEyeLine className="shrink-0" />
          <span className="truncate">
            <strong>Modo somente leitura:</strong> {imp.actorName} visualizando como{' '}
            <strong>{imp.targetName}</strong> ({imp.targetEmail}) · {imp.targetRole}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="bg-white hover:bg-amber-50 border-amber-700 text-amber-900"
          onClick={exit}
          disabled={exiting}
          data-testid="button-exit-impersonation"
        >
          <RiCloseLine className="mr-1" /> {exiting ? 'Saindo…' : 'Sair'}
        </Button>
      </div>
    </div>
  );
}
