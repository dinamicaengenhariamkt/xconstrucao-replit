'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { useToast } from '@shared/hooks/use-toast';
import { passwordStrength } from '@features/auth/schemas/password';
import { RiLockPasswordLine, RiAlertLine } from 'react-icons/ri';

export default function TrocarSenhaObrigatoriaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<{ id: string; name: string; role: string; mustChangePassword?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) { router.replace('/login'); return; }
        setUser(data);
        if (!data.mustChangePassword) {
          router.replace(redirectByRole(data.role));
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const strength = newPwd ? passwordStrength(newPwd) : null;
  const mismatch = newPwd && confirmPwd && newPwd !== confirmPwd;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mismatch) {
      toast({ title: 'Senhas diferentes', description: 'Confirme a mesma senha.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/change-password-forced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newPassword: newPwd, confirmPassword: confirmPwd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Falha ao trocar senha');
      toast({ title: 'Senha atualizada', description: 'Você já está logado com a nova senha.' });
      router.replace(redirectByRole(user?.role ?? 'contratante'));
    } catch (err) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Falha ao trocar senha',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Carregando…</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#1C1F22] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm font-medium mb-2">
            <RiAlertLine /> Troca de senha obrigatória
          </div>
          <h1 className="text-xl font-semibold">Olá, {user.name}</h1>
          <p className="text-sm text-muted-foreground">
            Sua conta foi criada por um administrador. Defina uma nova senha pessoal para continuar.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="new-pwd">Nova senha</Label>
              <div className="relative">
                <RiLockPasswordLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  id="new-pwd"
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="pl-10"
                  autoComplete="new-password"
                  required
                  data-testid="input-new-password"
                />
              </div>
              {strength && (
                <p className={`text-xs ${strength.score >= 3 ? 'text-green-600' : 'text-amber-600'}`}>
                  Força: {strength.label}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-pwd">Confirmar nova senha</Label>
              <Input
                id="confirm-pwd"
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="Repita a nova senha"
                autoComplete="new-password"
                required
                data-testid="input-confirm-password"
              />
              {mismatch && <p className="text-xs text-red-500">As senhas não conferem.</p>}
            </div>
            <Button type="submit" disabled={submitting} className="w-full" data-testid="button-submit">
              {submitting ? 'Salvando…' : 'Definir nova senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function redirectByRole(role: string): string {
  switch (role) {
    case 'superadmin':
    case 'admin':
      return '/admin/financeiro';
    case 'empreiteiro':
      return '/empreiteiro/dashboard';
    default:
      return '/contratante/dashboard';
  }
}
