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
  payloadInformacoes,
  useInvalidarObra,
  validarInformacoes,
  type CamposInformacoes,
  type ObraEditavel,
  type ObraStatus,
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

const VAZIO: CamposInformacoes = {
  nome: '',
  tipo: '',
  descricao: '',
  areaM2: '',
  valorTotal: '',
  dataInicio: '',
  dataPrevisao: '',
  status: 'planejamento',
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
 * XG12 — editar os dados da obra sem trocar de tela.
 *
 * O progresso não está aqui, de propósito: ele vem das atualizações, com data,
 * autor e fotos (XG09 D6). Um campo editável sobrescreveria o acumulado, e o
 * `PATCH` recusa `progresso` em obra própria com 409.
 */
export function EditarInformacoesModal({
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
  const [form, setForm] = useState<CamposInformacoes>(VAZIO);

  const obraQuery = useQuery({
    queryKey: ['xgestao', 'obra-editavel', obraId],
    queryFn: () => getJson<ObraEditavel>(`/api/obras/${obraId}`),
    enabled: open,
  });

  // Recarrega ao abrir: o valor em tela tem que ser o que está no banco, não o
  // rascunho de uma abertura anterior que o usuário cancelou.
  useEffect(() => {
    if (!open || !obraQuery.data) return;
    const obra = obraQuery.data;
    setForm({
      nome: obra.nome ?? '',
      tipo: obra.tipo ?? '',
      descricao: obra.descricao ?? '',
      areaM2: obra.areaM2 ?? '',
      valorTotal: obra.valorTotal ?? '',
      dataInicio: obra.dataInicio ?? '',
      dataPrevisao: obra.dataPrevisao ?? '',
      status: obra.status ?? 'planejamento',
    });
  }, [open, obraQuery.data]);

  const update = (key: keyof CamposInformacoes, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const salvar = useMutation({
    mutationFn: () => {
      validarInformacoes(form);
      return patchObra(obraId, payloadInformacoes(form));
    },
    onSuccess: async () => {
      await invalidarObra();
      toast({ title: 'Obra atualizada', description: 'As informações foram salvas.' });
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
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle>Informações da obra</DialogTitle>
          <DialogDescription>
            Descrição, tipo e área aparecem no link público. O orçamento nunca é compartilhado.
          </DialogDescription>
        </DialogHeader>

        {obraQuery.isLoading ? (
          <div className="h-72 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : (
          <form
            id="form-editar-informacoes"
            className="grid gap-5 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!salvar.isPending) salvar.mutate();
            }}
          >
            <Campo label="Nome da obra" htmlFor="modal-obra-nome">
              <Input
                id="modal-obra-nome"
                value={form.nome}
                onChange={(e) => update('nome', e.target.value)}
                minLength={3}
                maxLength={160}
                required
                data-testid="modal-edit-nome"
              />
            </Campo>
            <Campo label="Tipo de obra" htmlFor="modal-obra-tipo" optional>
              <Input
                id="modal-obra-tipo"
                value={form.tipo}
                onChange={(e) => update('tipo', e.target.value)}
                maxLength={80}
                placeholder="Ex.: Reforma comercial"
              />
            </Campo>
            <div className="sm:col-span-2">
              <Campo label="Descrição" htmlFor="modal-obra-descricao" optional>
                <textarea
                  id="modal-obra-descricao"
                  value={form.descricao}
                  onChange={(e) => update('descricao', e.target.value)}
                  maxLength={4000}
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Escopo, objetivos e observações importantes."
                />
              </Campo>
            </div>
            <Campo label="Área (m²)" htmlFor="modal-obra-area" optional>
              <Input
                id="modal-obra-area"
                type="number"
                min="0"
                step="0.01"
                value={form.areaM2}
                onChange={(e) => update('areaM2', e.target.value)}
              />
            </Campo>
            <Campo label="Orçamento previsto (R$)" htmlFor="modal-obra-valor" optional>
              <Input
                id="modal-obra-valor"
                type="number"
                min="0"
                step="0.01"
                value={form.valorTotal}
                onChange={(e) => update('valorTotal', e.target.value)}
              />
            </Campo>
            <Campo label="Data de início" htmlFor="modal-obra-inicio" optional>
              <Input
                id="modal-obra-inicio"
                type="date"
                value={form.dataInicio}
                onChange={(e) => update('dataInicio', e.target.value)}
              />
            </Campo>
            <Campo label="Previsão de término" htmlFor="modal-obra-previsao" optional>
              <Input
                id="modal-obra-previsao"
                type="date"
                value={form.dataPrevisao}
                onChange={(e) => update('dataPrevisao', e.target.value)}
              />
            </Campo>
            <Campo label="Status" htmlFor="modal-obra-status">
              <select
                id="modal-obra-status"
                value={form.status}
                onChange={(e) => update('status', e.target.value as ObraStatus)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="planejamento">Planejamento</option>
                <option value="em_andamento">Em andamento</option>
                <option value="pausada">Pausada</option>
                <option value="concluida">Concluída</option>
              </select>
            </Campo>
          </form>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-editar-informacoes"
            disabled={salvar.isPending || obraQuery.isLoading}
            data-testid="modal-salvar-informacoes"
          >
            {salvar.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
