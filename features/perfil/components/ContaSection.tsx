'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RiMailLine,
  RiDownloadLine,
  RiAlertLine,
} from 'react-icons/ri';
import { useAuth } from '@features/auth/hooks/use-auth';
import { useToast } from '@shared/hooks/use-toast';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@shared/components/ui/alert-dialog';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
      {children}
    </p>
  );
}

/**
 * Seção "Conta" reutilizável (J02) — trocar email, exportar dados (LGPD) e
 * desativar conta. Compartilhada entre contratante e empreiteiro: a lógica de
 * fetch + diálogos de confirmação fica num só lugar. `emailAtual` é exibido
 * como referência; as ações batem nos endpoints `/api/auth/*`.
 */
export function ContaSection({ emailAtual }: { emailAtual: string | null | undefined }) {
  const { toast } = useToast();
  const { logout } = useAuth();
  const router = useRouter();

  // ── Trocar email ──
  const [novoEmail, setNovoEmail] = useState('');
  const [senhaEmail, setSenhaEmail] = useState('');
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  const handleTrocarEmail = async () => {
    setEnviandoEmail(true);
    try {
      const res = await fetch('/api/auth/trocar-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novoEmail: novoEmail.trim(), currentPassword: senhaEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: 'Erro', description: data.message ?? 'Não foi possível solicitar a troca.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Confirme no seu novo email', description: data.message });
      setNovoEmail('');
      setSenhaEmail('');
    } catch {
      toast({ title: 'Erro', description: 'Falha de conexão.', variant: 'destructive' });
    } finally {
      setEnviandoEmail(false);
    }
  };

  // ── Exportar dados (LGPD) ──
  const [exportando, setExportando] = useState(false);

  const handleExportar = async () => {
    setExportando(true);
    try {
      const res = await fetch('/api/auth/exportar-dados');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({ title: 'Erro', description: data.message ?? 'Não foi possível exportar.', variant: 'destructive' });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'meus-dados.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Download iniciado', description: 'Seus dados foram exportados em JSON.' });
    } catch {
      toast({ title: 'Erro', description: 'Falha de conexão.', variant: 'destructive' });
    } finally {
      setExportando(false);
    }
  };

  // ── Desativar conta ──
  const [senhaDesativar, setSenhaDesativar] = useState('');
  const [desativando, setDesativando] = useState(false);

  const handleDesativar = async () => {
    setDesativando(true);
    try {
      const res = await fetch('/api/auth/desativar-conta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: senhaDesativar }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: 'Erro', description: data.message ?? 'Não foi possível desativar.', variant: 'destructive' });
        setDesativando(false);
        return;
      }
      toast({ title: 'Conta desativada', description: 'Você será desconectado.' });
      const { redirect } = await logout();
      router.push(redirect);
    } catch {
      toast({ title: 'Erro', description: 'Falha de conexão.', variant: 'destructive' });
      setDesativando(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Trocar email */}
      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <SectionTitle>Email de acesso</SectionTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Email atual: <span className="font-medium text-foreground">{emailAtual ?? '—'}</span>.
            Ao trocar, enviaremos um link de confirmação para o novo endereço — a mudança só vale após você clicar nele.
          </p>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">Novo email</Label>
            <Input
              type="email"
              value={novoEmail}
              onChange={(e) => setNovoEmail(e.target.value)}
              placeholder="novo@email.com"
              data-testid="input-novo-email"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">Sua senha</Label>
            <Input
              type="password"
              value={senhaEmail}
              onChange={(e) => setSenhaEmail(e.target.value)}
              placeholder="Confirme com sua senha"
              data-testid="input-senha-trocar-email"
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleTrocarEmail}
              disabled={enviandoEmail || !novoEmail.trim() || !senhaEmail}
              data-testid="button-trocar-email"
            >
              <RiMailLine className="w-4 h-4 mr-2" />
              {enviandoEmail ? 'Enviando...' : 'Enviar confirmação'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exportar dados (LGPD) */}
      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <SectionTitle>Meus dados (LGPD)</SectionTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Baixe uma cópia dos dados pessoais que a plataforma guarda sobre você, em formato JSON.
          </p>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleExportar}
              disabled={exportando}
              data-testid="button-exportar-dados"
            >
              <RiDownloadLine className="w-4 h-4 mr-2" />
              {exportando ? 'Gerando...' : 'Exportar meus dados'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Desativar conta */}
      <Card className="rounded-xl border border-red-200 dark:border-red-900/40">
        <CardHeader className="p-6 pb-2">
          <SectionTitle>Zona de risco</SectionTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0 flex flex-col gap-4">
          <div className="flex items-start gap-2">
            <RiAlertLine className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Desativar sua conta encerra seu acesso imediatamente. A reativação só pode ser feita pela administração.
            </p>
          </div>
          <div className="flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" data-testid="button-abrir-desativar-conta">
                  Desativar conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Desativar sua conta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Você perderá o acesso imediatamente e será desconectado. Confirme com sua senha para continuar.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex flex-col gap-1.5 py-2">
                  <Label className="text-sm font-medium">Sua senha</Label>
                  <Input
                    type="password"
                    value={senhaDesativar}
                    onChange={(e) => setSenhaDesativar(e.target.value)}
                    placeholder="Digite sua senha"
                    data-testid="input-senha-desativar"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setSenhaDesativar('')}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      void handleDesativar();
                    }}
                    disabled={desativando || !senhaDesativar}
                    className="bg-red-600 hover:bg-red-700"
                    data-testid="button-confirmar-desativar"
                  >
                    {desativando ? 'Desativando...' : 'Desativar conta'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
