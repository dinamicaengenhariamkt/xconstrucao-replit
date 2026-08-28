'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  RiBellLine,
  RiBuilding2Line,
  RiPriceTag3Line,
  RiSave3Line,
  RiShieldLine,
  RiUser3Line,
} from 'react-icons/ri';
import { usePerfilEmpreiteiro, useUpdatePerfilEmpreiteiro } from '@features/perfil/hooks/use-perfil';
import { usePreferencias, useUpdatePreferencias } from '@features/perfil/hooks/use-preferencias';
import { usePerfilPlano } from '@features/planos/ui/use-planos';
import { ContaSection } from '@features/perfil/components/ContaSection';
import { TwoFactorSection } from '@features/auth/components/TwoFactorSection';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Skeleton } from '@shared/components/ui/skeleton';
import { Switch } from '@shared/components/ui/switch';
import { Textarea } from '@shared/components/ui/textarea';
import { cn } from '@shared/lib/utils';
import { useToast } from '@shared/hooks/use-toast';

type Section = 'perfil' | 'empresa' | 'notificacoes' | 'seguranca' | 'plano';

const NAV_ITEMS = [
  { id: 'perfil' as const, label: 'Perfil', icon: RiUser3Line },
  { id: 'empresa' as const, label: 'Minha Empresa', icon: RiBuilding2Line },
  { id: 'notificacoes' as const, label: 'Notificações', icon: RiBellLine },
  { id: 'seguranca' as const, label: 'Segurança', icon: RiShieldLine },
  { id: 'plano' as const, label: 'Plano & Uso', icon: RiPriceTag3Line },
];

const NOTIFICATION_DEFAULTS = {
  email_prazo: true,
  sis_documentos: true,
  sis_ocorrencias: true,
  sis_diario: true,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

export function XGestaoConfiguracoesView() {
  const searchParams = useSearchParams();
  const requested = searchParams.get('tab') as Section | null;
  const [section, setSection] = useState<Section>(
    requested && NAV_ITEMS.some((item) => item.id === requested) ? requested : 'perfil',
  );
  const { toast } = useToast();
  const { data: perfil, isLoading } = usePerfilEmpreiteiro();
  const updatePerfil = useUpdatePerfilEmpreiteiro();
  const { data: preferencias } = usePreferencias();
  const updatePreferencias = useUpdatePreferencias();
  const { data: plano, isLoading: planoLoading } = usePerfilPlano('xgestao');
  const [form, setForm] = useState({
    nome: '',
    responsavel: '',
    telefone: '',
    cnpj: '',
    cep: '',
    endereco: '',
    cidade: '',
    estado: '',
    descricao: '',
  });
  const [notifications, setNotifications] = useState<Record<string, boolean>>(NOTIFICATION_DEFAULTS);

  useEffect(() => {
    if (requested && NAV_ITEMS.some((item) => item.id === requested)) setSection(requested);
  }, [requested]);

  useEffect(() => {
    if (!perfil) return;
    setForm({
      nome: perfil.nome ?? '',
      responsavel: perfil.responsavel ?? '',
      telefone: perfil.telefone ?? '',
      cnpj: perfil.cnpj ?? '',
      cep: perfil.cep ?? '',
      endereco: perfil.endereco ?? '',
      cidade: perfil.cidade ?? '',
      estado: perfil.estado ?? '',
      descricao: perfil.descricao ?? '',
    });
  }, [perfil]);

  useEffect(() => {
    if (preferencias?.notificacoes) {
      setNotifications({ ...NOTIFICATION_DEFAULTS, ...preferencias.notificacoes });
    }
  }, [preferencias]);

  const setField = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const saveProfile = async () => {
    try {
      await updatePerfil.mutateAsync(form);
      toast({ title: 'Dados salvos', description: 'As informações da sua conta xgestão foram atualizadas.' });
    } catch {
      toast({ title: 'Não foi possível salvar', description: 'Revise os dados e tente novamente.', variant: 'destructive' });
    }
  };

  const saveNotifications = async () => {
    try {
      await updatePreferencias.mutateAsync({ notificacoes: notifications });
      toast({ title: 'Preferências salvas' });
    } catch {
      toast({ title: 'Não foi possível salvar', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-full p-6 md:p-10" data-testid="xgestao-configuracoes-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie sua conta, empresa e preferências do xgestão.
        </p>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden">
        {NAV_ITEMS.map((item) => (
          <Button key={item.id} variant={section === item.id ? 'default' : 'outline'} size="sm" onClick={() => setSection(item.id)} className="shrink-0">
            <item.icon className="mr-2 size-4" />{item.label}
          </Button>
        ))}
      </div>

      <div className="flex items-start gap-8">
        <nav className="sticky top-6 hidden w-56 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 lg:block">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={cn(
                'flex w-full items-center gap-3 border-r-3 px-4 py-3 text-left text-sm transition-colors',
                section === item.id
                  ? 'border-primary bg-primary/5 font-semibold text-primary'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800',
              )}
            >
              <item.icon className="size-4" />{item.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {isLoading ? <Skeleton className="h-96 rounded-xl" /> : (
            <>
              {section === 'perfil' && (
                <Card>
                  <CardHeader><CardTitle>Perfil do responsável</CardTitle></CardHeader>
                  <CardContent className="grid gap-5 sm:grid-cols-2">
                    <Field label="Nome do responsável"><Input value={form.responsavel} onChange={setField('responsavel')} /></Field>
                    <Field label="E-mail"><Input value={perfil?.email ?? ''} disabled /></Field>
                    <Field label="Telefone"><Input value={form.telefone} onChange={setField('telefone')} /></Field>
                    <div className="sm:col-span-2 flex justify-end"><Button onClick={saveProfile} disabled={updatePerfil.isPending}><RiSave3Line className="mr-2 size-4" />Salvar perfil</Button></div>
                  </CardContent>
                </Card>
              )}

              {section === 'empresa' && (
                <Card>
                  <CardHeader><CardTitle>Dados da empresa</CardTitle></CardHeader>
                  <CardContent className="grid gap-5 sm:grid-cols-2">
                    <Field label="Nome da empresa"><Input value={form.nome} onChange={setField('nome')} /></Field>
                    <Field label="CNPJ"><Input value={form.cnpj} onChange={setField('cnpj')} /></Field>
                    <Field label="CEP"><Input value={form.cep} onChange={setField('cep')} /></Field>
                    <Field label="Endereço"><Input value={form.endereco} onChange={setField('endereco')} /></Field>
                    <Field label="Cidade"><Input value={form.cidade} onChange={setField('cidade')} /></Field>
                    <Field label="Estado"><Input value={form.estado} onChange={setField('estado')} maxLength={2} /></Field>
                    <div className="sm:col-span-2"><Field label="Descrição"><Textarea value={form.descricao} onChange={setField('descricao')} rows={4} /></Field></div>
                    <div className="sm:col-span-2 flex justify-end"><Button onClick={saveProfile} disabled={updatePerfil.isPending}><RiSave3Line className="mr-2 size-4" />Salvar empresa</Button></div>
                  </CardContent>
                </Card>
              )}

              {section === 'notificacoes' && (
                <Card>
                  <CardHeader><CardTitle>Notificações operacionais</CardTitle></CardHeader>
                  <CardContent className="space-y-1">
                    {[
                      ['email_prazo', 'Atualizações de prazo', 'Receba avisos sobre prazos próximos ou alterados.'],
                      ['sis_documentos', 'Documentos', 'Alertas sobre documentos das suas obras.'],
                      ['sis_ocorrencias', 'Ocorrências', 'Avisos quando uma ocorrência for registrada ou atualizada.'],
                      ['sis_diario', 'Diário de obra', 'Lembretes para manter o diário atualizado.'],
                    ].map(([key, label, description]) => (
                      <div key={key} className="flex items-center justify-between gap-4 border-b border-gray-100 py-4 last:border-0 dark:border-gray-800">
                        <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{description}</p></div>
                        <Switch checked={notifications[key] ?? true} onCheckedChange={(checked) => setNotifications((current) => ({ ...current, [key]: checked }))} />
                      </div>
                    ))}
                    <div className="flex justify-end pt-5"><Button onClick={saveNotifications} disabled={updatePreferencias.isPending}><RiSave3Line className="mr-2 size-4" />Salvar preferências</Button></div>
                  </CardContent>
                </Card>
              )}

              {section === 'seguranca' && (
                <div className="flex flex-col gap-6">
                  <TwoFactorSection />
                  <ContaSection emailAtual={perfil?.email} />
                </div>
              )}

              {section === 'plano' && (
                <Card>
                  <CardHeader><CardTitle>Plano e uso</CardTitle></CardHeader>
                  <CardContent>
                    {planoLoading ? <Skeleton className="h-40" /> : plano ? (
                      <div className="space-y-5">
                        <div><p className="text-sm text-muted-foreground">Plano atual</p><p className="text-2xl font-bold">{plano.catalogo.nome}</p></div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {plano.uso.map((item) => (
                            <div key={item.key} className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                              <p className="text-xs text-muted-foreground">{item.label}</p>
                              <p className="mt-1 text-xl font-bold">{item.current} <span className="text-sm font-normal text-muted-foreground">de {item.max >= 9999 ? 'ilimitado' : item.max}</span></p>
                            </div>
                          ))}
                        </div>
                        <Button asChild><a href="/xgestao/planos">Ver planos xgestão</a></Button>
                      </div>
                    ) : <p className="text-sm text-muted-foreground">Não foi possível carregar seu plano.</p>}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}