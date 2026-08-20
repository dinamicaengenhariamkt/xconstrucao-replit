'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RiAddLine } from 'react-icons/ri';
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

type ObraCriada = { id: string };

async function criarObra(payload: { nome: string; endereco: string }): Promise<ObraCriada> {
  const response = await fetch('/api/xgestao/obras', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof body?.message === 'string' ? body.message : 'Não foi possível criar a obra.',
    );
  }
  return body as ObraCriada;
}

export function NovaObraModal() {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: () => criarObra({ nome: nome.trim(), endereco: endereco.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empreiteiro', 'minhas-obras'] });
      setNome('');
      setEndereco('');
      setOpen(false);
      toast({ title: 'Obra criada', description: 'Sua obra própria já está pronta para ser gerenciada.' });
    },
    onError: (error) => {
      toast({
        title: 'Não foi possível criar a obra',
        description: error instanceof Error ? error.message : 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    },
  });

  return (
    <>
      <Button onClick={() => setOpen(true)} data-testid="xgestao-nova-obra">
        <RiAddLine />
        Nova obra
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
              if (!mutation.isPending) mutation.mutate();
            }}
          >
            <div className="space-y-2">
              <label htmlFor="xgestao-obra-nome" className="text-sm font-medium">Nome da obra</label>
              <Input
                id="xgestao-obra-nome"
                data-testid="xgestao-obra-nome"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                minLength={2}
                maxLength={160}
                required
                placeholder="Ex.: Reforma da sede"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="xgestao-obra-endereco" className="text-sm font-medium">Endereço</label>
              <Input
                id="xgestao-obra-endereco"
                data-testid="xgestao-obra-endereco"
                value={endereco}
                onChange={(event) => setEndereco(event.target.value)}
                minLength={3}
                maxLength={255}
                required
                placeholder="Rua, número e complemento"
              />
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
    </>
  );
}