'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  RiShieldKeyholeLine,
  RiCheckboxCircleLine,
  RiFileCopyLine,
  RiAlertLine,
} from 'react-icons/ri';
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

interface StatusResp {
  enabled: boolean;
  disponivel: boolean;
  obrigatorio: boolean;
}

type Fase = 'idle' | 'setup' | 'recovery';

/**
 * Seção "Verificação em duas etapas" (J22) — reutilizável nas 3 personas.
 * Ciclo: status → setup (QR + secret) → confirmar código → recovery codes (uma vez) → ativo.
 * Desativar exige senha + código atual (TOTP ou recovery).
 */
export function TwoFactorSection() {
  const { toast } = useToast();

  const [status, setStatus] = useState<StatusResp | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [fase, setFase] = useState<Fase>('idle');

  // setup
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [codigo, setCodigo] = useState('');
  const [processando, setProcessando] = useState(false);

  // recovery codes (exibidos uma única vez)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  // desativar
  const [senhaOff, setSenhaOff] = useState('');
  const [codigoOff, setCodigoOff] = useState('');
  const [desativando, setDesativando] = useState(false);

  const carregarStatus = async () => {
    try {
      const res = await fetch('/api/auth/2fa/status');
      if (res.ok) setStatus(await res.json());
    } catch {
      /* silencioso: o card simplesmente não aparece sem status */
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    void carregarStatus();
  }, []);

  const handleIniciarSetup = async () => {
    setProcessando(true);
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: 'Erro', description: data.message ?? 'Não foi possível iniciar.', variant: 'destructive' });
        return;
      }
      setQrDataUrl(data.qrDataUrl);
      setSecret(data.secret);
      setCodigo('');
      setFase('setup');
    } catch {
      toast({ title: 'Erro', description: 'Falha de conexão.', variant: 'destructive' });
    } finally {
      setProcessando(false);
    }
  };

  const handleConfirmar = async () => {
    setProcessando(true);
    try {
      const res = await fetch('/api/auth/2fa/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigo.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: 'Código inválido', description: data.message ?? 'Verifique o app autenticador.', variant: 'destructive' });
        return;
      }
      setRecoveryCodes(data.recoveryCodes ?? []);
      setFase('recovery');
      setSecret('');
      setQrDataUrl('');
      toast({ title: 'Verificação ativada', description: 'Guarde seus códigos de recuperação.' });
      void carregarStatus();
    } catch {
      toast({ title: 'Erro', description: 'Falha de conexão.', variant: 'destructive' });
    } finally {
      setProcessando(false);
    }
  };

  const handleDesativar = async () => {
    setDesativando(true);
    try {
      const res = await fetch('/api/auth/2fa/desativar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: senhaOff, codigo: codigoOff.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: 'Erro', description: data.message ?? 'Não foi possível desativar.', variant: 'destructive' });
        setDesativando(false);
        return;
      }
      toast({ title: '2FA desativado', description: 'Sua conta voltou ao login de um passo.' });
      setSenhaOff('');
      setCodigoOff('');
      setFase('idle');
      void carregarStatus();
    } catch {
      toast({ title: 'Erro', description: 'Falha de conexão.', variant: 'destructive' });
    } finally {
      setDesativando(false);
    }
  };

  const copiarRecovery = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
      toast({ title: 'Copiado', description: 'Códigos de recuperação na área de transferência.' });
    } catch {
      toast({ title: 'Não foi possível copiar', description: 'Copie manualmente os códigos.', variant: 'destructive' });
    }
  };

  if (carregando || !status) return null;

  // Contas OAuth-only não fazem 2FA local — o provedor já cobre.
  if (!status.disponivel) {
    return (
      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <SectionTitle>Verificação em duas etapas</SectionTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          <p className="text-sm text-muted-foreground">
            Sua conta usa login externo (Google/OAuth). A verificação em duas etapas é gerenciada pelo seu provedor.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
      <CardHeader className="p-6 pb-2">
        <SectionTitle>Verificação em duas etapas</SectionTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0 flex flex-col gap-4">
        {/* Estado ATIVO */}
        {status.enabled && fase !== 'recovery' && (
          <>
            <div className="flex items-start gap-2">
              <RiCheckboxCircleLine className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                A verificação em duas etapas está <span className="font-medium text-foreground">ativa</span>.
                A cada login pediremos um código do seu app autenticador.
              </p>
            </div>

            {status.obrigatorio ? (
              <p className="text-xs text-muted-foreground">
                Contas administrativas exigem 2FA — não é possível desativar.
              </p>
            ) : (
              <div className="flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" data-testid="button-abrir-desativar-2fa">
                      Desativar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Desativar verificação em duas etapas?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Confirme com sua senha e um código atual (do app ou de recuperação).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex flex-col gap-3 py-2">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-sm font-medium">Sua senha</Label>
                        <Input
                          type="password"
                          value={senhaOff}
                          onChange={(e) => setSenhaOff(e.target.value)}
                          placeholder="Digite sua senha"
                          data-testid="input-senha-desativar-2fa"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-sm font-medium">Código atual</Label>
                        <Input
                          inputMode="numeric"
                          value={codigoOff}
                          onChange={(e) => setCodigoOff(e.target.value)}
                          placeholder="000000 ou código de recuperação"
                          data-testid="input-codigo-desativar-2fa"
                        />
                      </div>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => { setSenhaOff(''); setCodigoOff(''); }}>
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => { e.preventDefault(); void handleDesativar(); }}
                        disabled={desativando || !senhaOff || !codigoOff}
                        data-testid="button-confirmar-desativar-2fa"
                      >
                        {desativando ? 'Desativando...' : 'Desativar'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </>
        )}

        {/* Estado INATIVO — CTA pra iniciar */}
        {!status.enabled && fase === 'idle' && (
          <>
            <div className="flex items-start gap-2">
              <RiShieldKeyholeLine className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Proteja sua conta com um segundo fator. Você precisará de um app autenticador
                (Google Authenticator, Authy, etc.).
              </p>
            </div>
            {status.obrigatorio && (
              <div className="flex items-start gap-2">
                <RiAlertLine className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Sua conta é administrativa: a verificação em duas etapas é obrigatória.
                </p>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={handleIniciarSetup} disabled={processando} data-testid="button-iniciar-2fa">
                <RiShieldKeyholeLine className="w-4 h-4 mr-2" />
                {processando ? 'Gerando...' : 'Ativar verificação em duas etapas'}
              </Button>
            </div>
          </>
        )}

        {/* Estado SETUP — QR + secret + confirmação */}
        {fase === 'setup' && (
          <>
            <p className="text-sm text-muted-foreground">
              1. Escaneie o QR code no seu app autenticador (ou digite o código manual). 2. Informe o código de 6 dígitos gerado.
            </p>
            <div className="flex flex-col items-center gap-3">
              {qrDataUrl && (
                <Image src={qrDataUrl} alt="QR code 2FA" width={180} height={180} className="rounded-lg border border-gray-100 dark:border-gray-800" unoptimized />
              )}
              <code className="text-xs bg-muted px-2 py-1 rounded tracking-widest break-all" data-testid="text-secret-2fa">
                {secret}
              </code>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium">Código do app</Label>
              <Input
                inputMode="numeric"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="000000"
                maxLength={6}
                data-testid="input-codigo-confirmar-2fa"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setFase('idle')} disabled={processando}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmar} disabled={processando || codigo.trim().length !== 6} data-testid="button-confirmar-2fa">
                {processando ? 'Confirmando...' : 'Confirmar e ativar'}
              </Button>
            </div>
          </>
        )}

        {/* Estado RECOVERY — códigos exibidos UMA vez */}
        {fase === 'recovery' && (
          <>
            <div className="flex items-start gap-2">
              <RiAlertLine className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Guarde estes <span className="font-medium text-foreground">códigos de recuperação</span> em local seguro.
                Cada um funciona uma única vez e eles não serão exibidos novamente.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-muted rounded-lg p-4" data-testid="grid-recovery-codes">
              {recoveryCodes.map((c) => (
                <code key={c} className="text-sm tracking-widest text-center">{c}</code>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={copiarRecovery} data-testid="button-copiar-recovery">
                <RiFileCopyLine className="w-4 h-4 mr-2" />
                Copiar códigos
              </Button>
              <Button onClick={() => { setRecoveryCodes([]); setFase('idle'); }} data-testid="button-concluir-2fa">
                Já guardei
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
