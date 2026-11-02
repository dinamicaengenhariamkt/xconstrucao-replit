'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { useToast } from '@shared/hooks/use-toast';
import { patchObra, useInvalidarObra, type ObraEditavel } from '../hooks/use-editar-obra';
import { dinheiroDecimal } from '../lib/dinheiro';

export function EditarValorContratoModal({ obraId, open, onOpenChange }: {
  obraId: string; open: boolean; onOpenChange: (open: boolean) => void;
}) {
  const [valor, setValor] = useState('');
  const { toast } = useToast();
  const invalidar = useInvalidarObra(obraId);
  const consulta = useQuery({
    queryKey: ['xgestao', 'obra-editavel', obraId],
    queryFn: async (): Promise<ObraEditavel> => {
      const response = await fetch(`/api/obras/${obraId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Não foi possível carregar o contrato.');
      return response.json();
    },
    enabled: open,
  });
  useEffect(() => {
    if (open && consulta.data) setValor(consulta.data.valorTotal ?? '0');
  }, [open, consulta.data]);
  const salvar = useMutation({
    mutationFn: () => patchObra(obraId, { valorTotal: dinheiroDecimal(valor) }),
    onSuccess: async () => {
      await invalidar();
      toast({ title: 'Valor do contrato atualizado' });
      onOpenChange(false);
    },
    onError: (error: Error) => toast({
      title: 'Não foi possível salvar', description: error.message, variant: 'destructive',
    }),
  });
  return (
    <Dialog open={open} onOpenChange={(next) => !salvar.isPending && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar valores do contrato</DialogTitle>
          <DialogDescription>
            Atualize o valor contratado. Aditivos são registrados separadamente; total e saldo são calculados.
          </DialogDescription>
        </DialogHeader>
        {consulta.isError ? <p role="alert">Não foi possível carregar o contrato. Feche e tente novamente.</p> : (
          <form id="editar-valor-contrato" onSubmit={(event) => {
            event.preventDefault();
            if (!salvar.isPending && consulta.isSuccess) salvar.mutate();
          }}>
            <label htmlFor="contrato-valor" className="text-sm font-semibold">Valor contratado (R$)</label>
            <Input id="contrato-valor" inputMode="decimal" value={valor} required
              placeholder="Ex.: 500.000,50" disabled={consulta.isFetching || salvar.isPending}
              onChange={(event) => setValor(event.target.value)} />
          </form>
        )}
        <DialogFooter>
          <Button variant="outline" disabled={salvar.isPending} onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" form="editar-valor-contrato" disabled={!consulta.isSuccess || consulta.isFetching || salvar.isPending}>
            {salvar.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
