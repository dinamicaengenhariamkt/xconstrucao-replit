'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/components/ui/alert-dialog';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { useToast } from '@shared/hooks/use-toast';
import { apiRequest } from '@shared/lib/queryClient';

/**
 * XG10 — exclusão da obra.
 *
 * A exclusão é definitiva e cascateia: tarefas, etapas, fotos, diário,
 * documentos e lançamentos vão junto. Por isso exige digitar o nome da obra —
 * um clique acidental em "confirmar" não pode apagar meses de registro.
 */
interface ExcluirObraDialogProps {
  obraId: string;
  obraNome: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Para onde voltar depois de excluir (a obra deixa de existir). */
  redirectTo: string;
}

export function ExcluirObraDialog({
  obraId,
  obraNome,
  open,
  onOpenChange,
  redirectTo,
}: ExcluirObraDialogProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [confirmacao, setConfirmacao] = useState('');
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    if (open) setConfirmacao('');
  }, [open]);

  // Comparação tolerante a espaços e caixa: o objetivo é provar intenção,
  // não testar a digitação do usuário.
  const confere = confirmacao.trim().toLowerCase() === obraNome.trim().toLowerCase();

  const excluir = async () => {
    if (!confere || excluindo) return;
    setExcluindo(true);
    try {
      await apiRequest('DELETE', `/api/obras/${obraId}`);
      qc.invalidateQueries({ queryKey: ['empreiteiro', 'minhas-obras'] });
      toast({ title: 'Obra excluída', description: obraNome });
      onOpenChange(false);
      router.push(redirectTo);
    } catch (error) {
      toast({
        title: 'Não foi possível excluir',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
      setExcluindo(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir obra</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Isto apaga <strong>{obraNome}</strong> e tudo que está dentro dela: tarefas,
                etapas, fotos, diário, documentos e lançamentos financeiros.{' '}
                <strong>Não há como desfazer.</strong>
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="confirmar-nome-obra" className="text-foreground">
                  Digite o nome da obra para confirmar
                </Label>
                <Input
                  id="confirmar-nome-obra"
                  value={confirmacao}
                  onChange={(e) => setConfirmacao(e.target.value)}
                  placeholder={obraNome}
                  autoComplete="off"
                  data-testid="input-confirmar-exclusao"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              // O AlertDialog fecha no clique por padrão; aqui o fechamento
              // acontece só quando a exclusão dá certo.
              e.preventDefault();
              void excluir();
            }}
            disabled={!confere || excluindo}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
            data-testid="button-confirmar-exclusao"
          >
            {excluindo ? 'Excluindo…' : 'Excluir obra'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
