'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@features/auth/store/auth-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import Link from 'next/link';

interface Pendencia {
  tipo: 'termos' | 'privacidade';
  versaoVigente: number;
  versaoAceita: number | null;
}

const TIPO_LABEL = { termos: 'Termos de Uso', privacidade: 'Política de Privacidade' } as const;
const TIPO_HREF = { termos: '/termos', privacidade: '/politica-privacidade' } as const;

/**
 * J28 — Portão global de re-consentimento. Quando o usuário logado tem documentos
 * com versão vigente > aceita, mostra um modal. Modo `avisar` (default) é
 * dispensável; modo `bloquear` exige aceite. Roda só com usuário autenticado.
 */
export function ReconsentGate() {
  const user = useAuthStore((s) => s.user);
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [modo, setModo] = useState<'avisar' | 'bloquear'>('avisar');
  const [open, setOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [dispensado, setDispensado] = useState(false);

  const checar = useCallback(async () => {
    if (!user) {
      setPendencias([]);
      setOpen(false);
      return;
    }
    try {
      const res = await fetch('/api/legal/pendencias', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      const pend: Pendencia[] = data.pendencias ?? [];
      setModo(data.modo === 'bloquear' ? 'bloquear' : 'avisar');
      setPendencias(pend);
      if (pend.length > 0 && !dispensado) setOpen(true);
    } catch {
      /* silencioso — não bloqueia a app por falha de rede */
    }
  }, [user, dispensado]);

  useEffect(() => {
    checar();
  }, [checar]);

  const aceitar = async () => {
    setEnviando(true);
    try {
      const res = await fetch('/api/legal/consentir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tipos: pendencias.map((p) => p.tipo) }),
      });
      if (res.ok) {
        setPendencias([]);
        setOpen(false);
      }
    } finally {
      setEnviando(false);
    }
  };

  if (!user || pendencias.length === 0) return null;

  const bloqueante = modo === 'bloquear';

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        // Modo avisar: pode fechar (dispensa nesta sessão). Bloquear: não fecha sem aceitar.
        if (!o && !bloqueante) {
          setDispensado(true);
          setOpen(false);
        } else {
          setOpen(o);
        }
      }}
    >
      <DialogContent
        className="max-w-md"
        onPointerDownOutside={(e) => bloqueante && e.preventDefault()}
        onEscapeKeyDown={(e) => bloqueante && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Atualizamos nossos documentos</DialogTitle>
          <DialogDescription>
            {bloqueante
              ? 'Para continuar usando a plataforma, você precisa aceitar a nova versão dos documentos abaixo.'
              : 'Revisamos os documentos abaixo. Recomendamos que você leia e aceite a nova versão.'}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 text-sm">
          {pendencias.map((p) => (
            <li key={p.tipo} className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-200">{TIPO_LABEL[p.tipo]} (v{p.versaoVigente})</span>
              <Link href={TIPO_HREF[p.tipo]} target="_blank" className="text-primary underline text-xs">
                Ler
              </Link>
            </li>
          ))}
        </ul>

        <DialogFooter className="gap-2">
          {!bloqueante && (
            <Button
              variant="ghost"
              onClick={() => {
                setDispensado(true);
                setOpen(false);
              }}
              disabled={enviando}
            >
              Agora não
            </Button>
          )}
          <Button onClick={aceitar} disabled={enviando}>
            {enviando ? 'Registrando…' : 'Li e aceito'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
