'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
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
import { XGestaoPlanosSection } from './XGestaoPlanosSection';
import { ContaSection } from '@features/perfil/components/ContaSection';
import { TwoFactorSection } from '@features/auth/components/TwoFactorSection';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Skeleton } from '@shared/components/ui/skeleton';
import { Switch } from '@shared/components/ui/switch';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Textarea } from '@shared/components/ui/textarea';
import { cn } from '@shared/lib/utils';
import { useToast } from '@shared/hooks/use-toast';
import { CepInput } from '@features/perfil/components/CepInput';
import { formatCnpj, isCepValid, isCnpjValid, unformatCnpj } from '@shared/lib/masks';
import { XGESTAO_PERFIL_OPERACIONAL_KEY } from '@features/xgestao/hooks/use-perfil-operacional';
import { ESPECIALIDADES_PERMITIDAS } from '@shared/lib/especialidades';

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
  const queryClient = useQueryClient();
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
    raioKm: '',
    especialidades: [] as string[],
  });
  const [notifications, setNotifications] = useState<Record<string, boolean>>(NOTIFICATION_DEFAULTS);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
      raioKm: perfil.raioKm == null ? '' : String(perfil.raioKm),
      especialidades: perfil.especialidades ?? [],
    });
  }, [perfil]);

  useEffect(() => {
    if (preferencias?.notificacoes) {
      setNotifications({ ...NOTIFICATION_DEFAULTS, ...preferencias.notificacoes });
    }
  }, [preferencias]);

  const setField = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [key]: '' }));
  };

  const saveProfile = async () => {
    const errors: Record<string, string> = {};
    if (form.cnpj && !isCnpjValid(form.cnpj)) errors.cnpj = 'Informe um CNPJ válido.';
    if (form.cep && !isCepValid(form.cep)) errors.cep = 'Informe um CEP com 8 dígitos.';
    if (form.endereco.trim() && form.endereco.trim().length < 3) {
      errors.endereco = 'Informe um endereço válido.';
    }
    if (form.raioKm && (!Number.isFinite(Number(form.raioKm)) || Number(form.raioKm) <= 0)) {
      errors.raioKm = 'Informe um raio de atuação maior que zero.';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await updatePerfil.mutateAsync({
        ...form,
        cnpj: form.cnpj ? unformatCnpj(form.cnpj) : null,
        cep: form.cep || null,
        endereco: form.endereco.trim() || null,
        raioKm: form.raioKm ? Number(form.raioKm) : null,
        especialidades: form.especialidades,
      });
      await queryClient.invalidateQueries({ queryKey: XGESTAO_PERFIL_OPERACIONAL_KEY });
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
                    <Field label="CNPJ">
                      <Input
                        value={formatCnpj(form.cnpj)}
                        onChange={(event) => {
                          setForm((current) => ({ ...current, cnpj: unformatCnpj(event.target.value) }));
                          setFieldErrors((current) => ({ ...current, cnpj: '' }));
                        }}
                        inputMode="numeric"
                        maxLength={18}
                        aria-invalid={Boolean(fieldErrors.cnpj)}
                        data-testid="xgestao-empresa-cnpj"
                      />
                      {fieldErrors.cnpj && <p className="text-xs text-destructive">{fieldErrors.cnpj}</p>}
                    </Field>
                    <Field label="CEP">
                      <CepInput
                        value={form.cep}
                        onChange={(cep) => {
                          setForm((current) => ({ ...current, cep }));
                          setFieldErrors((current) => ({ ...current, cep: '' }));
                        }}
                        onClear={() => setForm((current) => ({ ...current, endereco: '', cidade: '', estado: '' }))}
                        onAutofill={(address) => setForm((current) => ({
                          ...current,
                          endereco: current.endereco || address.endereco,
                          cidade: address.cidade,
                          estado: address.estado,
                        }))}
                        onLookupFailed={() => setFieldErrors((current) => ({
                          ...current,
                          cep: 'CEP não encontrado. Confira os dígitos ou preencha o endereço manualmente.',
                        }))}
                        data-testid="xgestao-empresa-cep"
                      />
                      {fieldErrors.cep && <p className="text-xs text-destructive">{fieldErrors.cep}</p>}
                    </Field>
                    <Field label="Endereço">
                      <Input
                        value={form.endereco}
                        onChange={setField('endereco')}
                        aria-invalid={Boolean(fieldErrors.endereco)}
                        data-testid="xgestao-empresa-endereco"
                      />
                      {fieldErrors.endereco && <p className="text-xs text-destructive">{fieldErrors.endereco}</p>}
                    </Field>
                    <Field label="Cidade"><Input value={form.cidade} onChange={setField('cidade')} data-testid="xgestao-empresa-cidade" /></Field>
                    <Field label="Estado"><Input value={form.estado} onChange={setField('estado')} maxLength={2} data-testid="xgestao-empresa-estado" /></Field>
                    <Field label="Raio de atuação (km)">
                      <Input
                        type="number"
                        min={1}
                        max={1000}
                        value={form.raioKm}
                        onChange={setField('raioKm')}
                        aria-invalid={Boolean(fieldErrors.raioKm)}
                        data-testid="xgestao-empresa-raio-km"
                      />
                      {fieldErrors.raioKm && <p className="text-xs text-destructive">{fieldErrors.raioKm}</p>}
                    </Field>
                    <div className="sm:col-span-2 space-y-2">
                      <Label>Especialidades</Label>
                      <p className="text-xs text-muted-foreground">Selecione ao menos uma área em que sua equipe atua.</p>
                      <div className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2" data-testid="xgestao-empresa-especialidades">
                        {ESPECIALIDADES_PERMITIDAS.map((especialidade) => {
                          const checked = form.especialidades.includes(especialidade);
                          return (
                            <label key={especialidade} className="flex cursor-pointer items-center gap-2 text-sm">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(next) => setForm((current) => ({
                                  ...current,
                                  especialidades: next
                                    ? [...current.especialidades, especialidade]
                                    : current.especialidades.filter((item) => item !== especialidade),
                                }))}
                                data-testid={`xgestao-especialidade-${especialidade}`}
                              />
                              {especialidade}
                            </label>
                          );
                        })}
                      </div>
                    </div>
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
                <XGestaoPlanosSection />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}