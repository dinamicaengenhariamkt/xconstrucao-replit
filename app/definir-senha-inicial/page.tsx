'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { useToast } from '@shared/hooks/use-toast';
import { passwordStrength } from '@features/auth/schemas/password';

function Inner() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get('token') ?? '';
  const { toast } = useToast();
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const strength = pwd ? passwordStrength(pwd) : null;
  const mismatch = pwd && confirm && pwd !== confirm;
  const tokenOk = token.length > 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenOk) return;
    if (mismatch) { toast({ title: 'Senhas diferentes', variant: 'destructive' }); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/definir-senha-inicial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: pwd, confirmPassword: confirm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Falha ao definir senha');
      toast({ title: 'Senha definida!', description: 'Faça login com sua nova senha.' });
      router.replace('/login');
    } catch (err) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Falha ao definir senha',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#1C1F22] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-xl font-semibold">Defina sua senha</h1>
          <p className="text-sm text-muted-foreground">
            Crie a senha que você usará para acessar a XConstrução.
          </p>
        </CardHeader>
        <CardContent>
          {!tokenOk ? (
            <div className="text-sm text-red-600">Link inválido. Solicite um novo link.</div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="pwd">Nova senha</Label>
                <Input id="pwd" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} required minLength={8} autoComplete="new-password" data-testid="input-password" />
                {strength && (
                  <p className={`text-xs ${strength.score >= 3 ? 'text-green-600' : 'text-amber-600'}`}>Força: {strength.label}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirmar senha</Label>
                <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" data-testid="input-confirm" />
                {mismatch && <p className="text-xs text-red-500">As senhas não conferem.</p>}
              </div>
              <Button type="submit" disabled={submitting} className="w-full" data-testid="button-submit">
                {submitting ? 'Salvando…' : 'Salvar senha'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando…</div>}>
      <Inner />
    </Suspense>
  );
}
