'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { useToast } from '@shared/hooks/use-toast';
import {
  patchObra,
  payloadLocalizacao,
  useInvalidarObra,
  validarLocalizacao,
  type CamposLocalizacao,
  type ObraEditavel,
} from '../hooks/use-editar-obra';

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof body?.message === 'string' ? body.message : 'Não foi possível carregar a obra.',
    );
  }
  return body as T;
}

const VAZIO: CamposLocalizacao = {
  endereco: '',
  numero: '',
  complemento: '',
  cep: '',
  cidade: '',
  uf: '',
};

function Campo({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-gray-700 dark:text-gray-200">
        {label}
        {optional && <span className="ml-1 font-normal text-gray-400">(opcional)</span>}
      </label>
      {children}
    </div>
  );
}

/**
 * XG12 — o endereço, editável a partir do próprio card de localização.
 *
 * No link público o cliente vê cidade e UF; a rua só aparece se o dono liberar
 * a seção, e número e CEP nunca são compartilhados (XG04 §8).
 */
export function EditarLocalizacaoModal({
  obraId,
  open,
  onOpenChange,
}: {
  obraId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const invalidarObra = useInvalidarObra(obraId);
  const [form, setForm] = useState<CamposLocalizacao>(VAZIO);

  const obraQuery = useQuery({
    queryKey: ['xgestao', 'obra-editavel', obraId],
    queryFn: () => getJson<ObraEditavel>(`/api/obras/${obraId}`),
    enabled: open,
  });

  useEffect(() => {
    if (!open || !obraQuery.data) return;
    const obra = obraQuery.data;
    setForm({
      endereco: obra.endereco ?? '',
      numero: obra.numero ?? '',
      complemento: obra.complemento ?? '',
      cep: obra.cep ?? '',
      cidade: obra.cidade ?? '',
      uf: obra.uf ?? '',
    });
  }, [open, obraQuery.data]);

  const update = (key: keyof CamposLocalizacao, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const salvar = useMutation({
    mutationFn: () => {
      validarLocalizacao(form);
      return patchObra(obraId, payloadLocalizacao(form));
    },
    onSuccess: async () => {
      await invalidarObra();
      toast({ title: 'Endereço atualizado' });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: 'Não foi possível salvar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle>Localização da obra</DialogTitle>
          <DialogDescription>
            Endereço completo, para uso interno. O cliente vê apenas cidade e UF — número e CEP
            nunca são compartilhados.
          </DialogDescription>
        </DialogHeader>

        {obraQuery.isLoading ? (
          <div className="h-56 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : (
          <form
            id="form-editar-localizacao"
            className="grid gap-5 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!salvar.isPending) salvar.mutate();
            }}
          >
            <div className="sm:col-span-2">
              <Campo label="Logradouro" htmlFor="modal-obra-endereco">
                <Input
                  id="modal-obra-endereco"
                  value={form.endereco}
                  onChange={(e) => update('endereco', e.target.value)}
                  minLength={3}
                  maxLength={240}
                  required
                  data-testid="modal-edit-endereco"
                />
              </Campo>
            </div>
            <Campo label="Número" htmlFor="modal-obra-numero" optional>
              <Input
                id="modal-obra-numero"
                value={form.numero}
                onChange={(e) => update('numero', e.target.value)}
                maxLength={20}
              />
            </Campo>
            <Campo label="Complemento" htmlFor="modal-obra-complemento" optional>
              <Input
                id="modal-obra-complemento"
                value={form.complemento}
                onChange={(e) => update('complemento', e.target.value)}
                maxLength={120}
              />
            </Campo>
            <Campo label="CEP" htmlFor="modal-obra-cep" optional>
              <Input
                id="modal-obra-cep"
                value={form.cep}
                onChange={(e) => update('cep', e.target.value)}
                maxLength={9}
                placeholder="00000-000"
              />
            </Campo>
            <Campo label="Cidade" htmlFor="modal-obra-cidade" optional>
              <Input
                id="modal-obra-cidade"
                value={form.cidade}
                onChange={(e) => update('cidade', e.target.value)}
                maxLength={120}
              />
            </Campo>
            <Campo label="UF" htmlFor="modal-obra-uf" optional>
              <Input
                id="modal-obra-uf"
                value={form.uf}
                onChange={(e) => update('uf', e.target.value.toUpperCase().slice(0, 2))}
                maxLength={2}
                placeholder="SP"
              />
            </Campo>
          </form>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-editar-localizacao"
            disabled={salvar.isPending || obraQuery.isLoading}
            data-testid="modal-salvar-localizacao"
          >
            {salvar.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
