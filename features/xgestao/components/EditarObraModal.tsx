'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RiEditLine } from 'react-icons/ri';
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

type EditarObraModalProps = {
  obra: { id: string; titulo: string; endereco: string };
};

async function editarObra(id: string, payload: { nome: string; endereco: string }) {
  const response = await fetch(`/api/obras/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof body?.message === 'string' ? body.message : 'Não foi possível atualizar a obra.',
    );
  }
}

export function EditarObraModal({ obra }: EditarObraModalProps) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState(obra.titulo);
  const [endereco, setEndereco] = useState(obra.endereco);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: () => editarObra(obra.id, { nome: nome.trim(), endereco: endereco.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empreiteiro', 'minhas-obras'] });
      queryClient.invalidateQueries({ queryKey: ['empreiteiro', 'minhas-obras', obra.id] });
      setOpen(false);
      toast({ title: 'Obra atualizada' });
    },
    onError: (error) => {
      toast({
        title: 'Não foi possível atualizar a obra',
        description: error instanceof Error ? error.message : 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    },
  });

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} data-testid="xgestao-editar-obra">
        <RiEditLine />
        Editar obra
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar obra</DialogTitle>
            <DialogDescription>Atualize as informações básicas da sua obra própria.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!mutation.isPending) mutation.mutate();
            }}
          >
            <div className="space-y-2">
              <label htmlFor="xgestao-editar-obra-nome" className="text-sm font-medium">Nome da obra</label>
              <Input
                id="xgestao-editar-obra-nome"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                minLength={2}
                maxLength={160}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="xgestao-editar-obra-endereco" className="text-sm font-medium">Endereço</label>
              <Input
                id="xgestao-editar-obra-endereco"
                value={endereco}
                onChange={(event) => setEndereco(event.target.value)}
                minLength={3}
                maxLength={255}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}