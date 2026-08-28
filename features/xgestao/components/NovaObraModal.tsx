'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { RiAddLine, RiErrorWarningLine } from 'react-icons/ri';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { useToast } from '@shared/hooks/use-toast';
import { PlanoUpsellDialog } from '@features/planos/ui/PlanoUpsellDialog';
import { fetchWithSessionRefresh, SessionExpiredError } from '@features/auth/utils/authenticated-fetch';
import {
  useXGestaoPerfilOperacional,
  XGESTAO_PERFIL_OPERACIONAL_KEY,
} from '@features/xgestao/hooks/use-perfil-operacional';
import type { CampoPendente } from '@shared/lib/perfil-operacional';

type ObraCriada = { id: string };

class CriarObraError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly limite?: number,
    public readonly faltando: CampoPendente[] = [],
    public readonly fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
  }
}

async function criarObra(payload: { nome: string; endereco: string }): Promise<ObraCriada> {
  let response: Response;
  try {
    response = await fetchWithSessionRefresh('/api/xgestao/obras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof SessionExpiredError) {
      throw new CriarObraError(error.message, 401, 'SESSION_EXPIRED');
    }
    throw error;
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new CriarObraError(
      typeof body?.message === 'string' ? body.message : 'Não foi possível criar a obra.',
      response.status,
      typeof body?.code === 'string' ? body.code : undefined,
      typeof body?.limite === 'number' ? body.limite : undefined,
      Array.isArray(body?.faltando) ? body.faltando : [],
      body?.errors?.fieldErrors && typeof body.errors.fieldErrors === 'object'
        ? body.errors.fieldErrors
        : {},
    );
  }
  return body as ObraCriada;
}

export function NovaObraModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [operationalGateOpen, setOperationalGateOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [serverMissing, setServerMissing] = useState<CampoPendente[]>([]);
  const [upsellLimite, setUpsellLimite] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const perfilOperacional = useXGestaoPerfilOperacional();

  function irParaConfiguracoes() {
    setOperationalGateOpen(false);
    router.push('/xgestao/configuracoes?tab=empresa');
  }

  function handleOpen() {
    if (perfilOperacional.data?.ok) {
      setServerMissing([]);
      setOpen(true);
      return;
    }
    setOperationalGateOpen(true);
  }

  function submit() {
    const errors: Record<string, string> = {};
    const nomeTrimmed = nome.trim();
    const enderecoTrimmed = endereco.trim();
    if (nomeTrimmed.length < 3) errors.nome = 'Informe um nome com pelo menos 3 caracteres.';
    if (nomeTrimmed.length > 160) errors.nome = 'O nome deve ter no máximo 160 caracteres.';
    if (enderecoTrimmed.length < 3) errors.endereco = 'Informe o endereço da obra.';
    if (enderecoTrimmed.length > 240) errors.endereco = 'O endereço deve ter no máximo 240 caracteres.';
    setFormErrors(errors);
    if (Object.keys(errors).length === 0 && !mutation.isPending) mutation.mutate();
  }

  const mutation = useMutation({
    mutationFn: () => criarObra({ nome: nome.trim(), endereco: endereco.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empreiteiro', 'minhas-obras'] });
      queryClient.invalidateQueries({ queryKey: XGESTAO_PERFIL_OPERACIONAL_KEY });
      setNome('');
      setEndereco('');
      setFormErrors({});
      setServerMissing([]);
      setOpen(false);
      toast({ title: 'Obra criada', description: 'Sua obra própria já está pronta para ser gerenciada.' });
    },
    onError: (error) => {
      if (error instanceof CriarObraError && error.status === 402 && error.code === 'LIMITE_PLANO') {
        setOpen(false);
        setUpsellLimite(error.limite ?? 1);
        return;
      }
      if (error instanceof CriarObraError && error.code === 'SESSION_EXPIRED') {
        window.location.assign(
          `/login?perfil=xgestao&next=${encodeURIComponent(window.location.pathname)}&reason=session_expired`,
        );
        return;
      }
      if (error instanceof CriarObraError && error.code === 'PERFIL_INCOMPLETO') {
        setServerMissing(error.faltando);
        void queryClient.invalidateQueries({ queryKey: XGESTAO_PERFIL_OPERACIONAL_KEY });
        return;
      }
      if (error instanceof CriarObraError && Object.keys(error.fieldErrors).length > 0) {
        setFormErrors(
          Object.fromEntries(
            Object.entries(error.fieldErrors).map(([field, messages]) => [
              field,
              messages[0] ?? 'Revise este campo.',
            ]),
          ),
        );
        return;
      }
      toast({
        title: 'Não foi possível criar a obra',
        description: error instanceof Error ? error.message : 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    },
  });

  return (
    <>
      <Button
        onClick={handleOpen}
        disabled={perfilOperacional.isLoading}
        data-testid="xgestao-nova-obra"
      >
        <RiAddLine />
        {perfilOperacional.isLoading ? 'Verificando perfil…' : 'Nova obra'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova obra</DialogTitle>
            <DialogDescription>
              Cadastre uma obra própria para acompanhar o dia a dia da sua equipe.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            {serverMissing.length > 0 && (
              <div
                className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
                data-testid="xgestao-obra-perfil-incompleto"
              >
                <div className="flex items-start gap-2">
                  <RiErrorWarningLine className="mt-0.5 size-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Complete os dados da empresa para criar a obra.</p>
                    <ul className="mt-2 list-disc pl-5">
                      {serverMissing.map((item) => <li key={item.campo}>{item.rotulo}</li>)}
                    </ul>
                    <Button type="button" variant="ghost" className="h-auto px-0 pt-3 text-primary" onClick={irParaConfiguracoes}>
                      Completar em Configurações
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="xgestao-obra-nome" className="text-sm font-medium">Nome da obra</label>
              <Input
                id="xgestao-obra-nome"
                data-testid="xgestao-obra-nome"
                value={nome}
                onChange={(event) => {
                  setNome(event.target.value);
                  setFormErrors((current) => ({ ...current, nome: '' }));
                }}
                minLength={3}
                maxLength={160}
                required
                aria-invalid={Boolean(formErrors.nome)}
                placeholder="Ex.: Reforma da sede"
              />
              {formErrors.nome && <p className="text-xs text-destructive">{formErrors.nome}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="xgestao-obra-endereco" className="text-sm font-medium">Endereço</label>
              <Input
                id="xgestao-obra-endereco"
                data-testid="xgestao-obra-endereco"
                value={endereco}
                onChange={(event) => {
                  setEndereco(event.target.value);
                  setFormErrors((current) => ({ ...current, endereco: '' }));
                }}
                minLength={3}
                maxLength={240}
                required
                aria-invalid={Boolean(formErrors.endereco)}
                placeholder="Rua, número e complemento"
              />
              {formErrors.endereco && <p className="text-xs text-destructive">{formErrors.endereco}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Criando...' : 'Criar obra'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={operationalGateOpen} onOpenChange={setOperationalGateOpen}>
        <DialogContent className="sm:max-w-md" data-testid="xgestao-perfil-operacional-dialog">
          <DialogHeader>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <RiErrorWarningLine className="size-5" />
              </div>
              <DialogTitle>Complete seu perfil antes da primeira obra</DialogTitle>
            </div>
            <DialogDescription>
              {perfilOperacional.isError
                ? 'Não foi possível verificar os dados da empresa. Revise-os em Configurações antes de continuar.'
                : 'Estes dados operacionais ainda precisam ser preenchidos:'}
            </DialogDescription>
          </DialogHeader>
          {perfilOperacional.data && !perfilOperacional.data.ok && (
            <ul className="grid gap-2 rounded-xl bg-muted/60 p-4 text-sm">
              {perfilOperacional.data.faltando.map((item) => (
                <li key={item.campo} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  {item.rotulo}
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOperationalGateOpen(false)}>
              Agora não
            </Button>
            <Button type="button" onClick={irParaConfiguracoes}>
              Completar em Configurações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PlanoUpsellDialog
        open={upsellLimite !== null}
        onClose={() => setUpsellLimite(null)}
        descricaoLimite={`${upsellLimite ?? 1} obra(s) ativa(s)`}
        planosHref="/xgestao/planos"
      />
    </>
  );
}