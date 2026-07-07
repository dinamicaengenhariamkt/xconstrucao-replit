'use client';

import { useMemo, useState } from 'react';
import { RiSearchLine, RiStarLine } from 'react-icons/ri';
import { Input } from '@shared/components/ui/input';
import { Switch } from '@shared/components/ui/switch';
import { Skeleton } from '@shared/components/ui/skeleton';
import { Badge } from '@shared/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import { useToast } from '@shared/hooks/use-toast';
import { useAdminObras } from '@features/admin/obras/hooks/use-obras-list';
import {
  useObrasDestaque,
  useToggleDestaque,
  ToggleDestaqueError,
} from '@features/admin/obras-destaque/hooks/use-obras-destaque';
import { SelecionarCapaModal } from '@features/admin/obras-destaque/components/SelecionarCapaModal';

export default function ObrasDestaquePage() {
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [capaModal, setCapaModal] = useState<{ id: string; nome: string } | null>(null);

  // Só obras publicadas+aprovadas podem ser destaque (aparecem na home pública).
  const { data: obrasData, isLoading: loadingObras } = useAdminObras({
    visibilidade: 'publicada',
    statusModeracao: 'aprovada',
    pageSize: 100,
    q: q.trim() || undefined,
  });
  const { data: destaqueData, isLoading: loadingDestaques } = useObrasDestaque();
  const toggle = useToggleDestaque();

  const destaqueIds = useMemo(
    () => new Set((destaqueData?.rows ?? []).map((o) => o.id)),
    [destaqueData],
  );
  const count = destaqueData?.count ?? 0;
  const limite = destaqueData?.limite ?? 10;
  const atingiuLimite = count >= limite;

  const obras = obrasData?.rows ?? [];

  function handleToggle(obraId: string, nome: string, novoValor: boolean) {
    if (novoValor) {
      // Ativar exige escolher a capa.
      setCapaModal({ id: obraId, nome });
      return;
    }
    toggle.mutate(
      { obraId, destaque: false },
      {
        onSuccess: () => toast({ description: 'Obra removida dos destaques.' }),
        onError: () => toast({ variant: 'destructive', description: 'Falha ao remover destaque.' }),
      },
    );
  }

  function handleConfirmCapa(fileId: string) {
    if (!capaModal) return;
    toggle.mutate(
      { obraId: capaModal.id, destaque: true, fotoCapaFileId: fileId },
      {
        onSuccess: () => {
          toast({ description: 'Obra adicionada aos destaques da home.' });
          setCapaModal(null);
        },
        onError: (err) => {
          const msg =
            err instanceof ToggleDestaqueError
              ? err.message
              : 'Falha ao destacar a obra.';
          toast({ variant: 'destructive', description: msg });
        },
      },
    );
  }

  const isLoading = loadingObras || loadingDestaques;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Obras em Destaque</h1>
          <Badge variant="outline" className={atingiuLimite ? 'border-amber-300 text-amber-700' : ''}>
            {count}/{limite}
          </Badge>
        </div>
        <p className="text-sm text-slate-500">
          Escolha quais obras aparecem no carrossel “Projetos em Destaque” da home. Máximo de {limite}.
          {atingiuLimite && ' Desative uma obra para destacar outra.'}
        </p>
      </div>

      <div className="relative max-w-md">
        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar obra por nome…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : obras.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-slate-500">
          Nenhuma obra publicada e aprovada encontrada.
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obra</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Destaque</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {obras.map((obra) => {
                const isDestaque = destaqueIds.has(obra.id);
                const local = [obra.cidade, obra.uf].filter(Boolean).join(' - ') || '—';
                // Desabilita ativar quando o limite foi atingido (mas permite desativar).
                const disabled =
                  toggle.isPending || (!isDestaque && atingiuLimite);
                return (
                  <TableRow key={obra.id}>
                    <TableCell className="font-medium">{obra.nome}</TableCell>
                    <TableCell className="text-sm text-slate-500">{local}</TableCell>
                    <TableCell className="text-sm text-slate-500">{obra.tipo ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      <Switch
                        checked={isDestaque}
                        disabled={disabled}
                        onCheckedChange={(v) => handleToggle(obra.id, obra.nome, v)}
                        aria-label={`Destacar ${obra.nome}`}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <SelecionarCapaModal
        obraId={capaModal?.id ?? null}
        obraNome={capaModal?.nome ?? ''}
        open={!!capaModal}
        onOpenChange={(o) => !o && setCapaModal(null)}
        onConfirm={handleConfirmCapa}
        confirming={toggle.isPending}
      />
    </div>
  );
}
