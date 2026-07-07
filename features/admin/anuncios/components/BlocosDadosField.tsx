'use client';

import { RiAddLine, RiDeleteBinLine } from 'react-icons/ri';
import { Input } from '@shared/components/ui/input';
import { Button } from '@shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import type { BlocoDado } from '@features/shared/anuncios/templates/types';

interface Props {
  value: BlocoDado[];
  onChange: (blocos: BlocoDado[]) => void;
}

const MAX = 8;

const tendenciaOptions: { value: NonNullable<BlocoDado['tendencia']>; label: string }[] = [
  { value: 'up', label: '▲ Alta' },
  { value: 'down', label: '▼ Baixa' },
  { value: 'flat', label: '— Estável' },
];

/**
 * Editor de blocos de dados (J24) do template `destaque-dados`. Cada bloco:
 * rótulo + valor + variação opcional + tendência (cor da seta). 1 a 8 blocos.
 */
export function BlocosDadosField({ value, onChange }: Props) {
  const blocos = value.length > 0 ? value : [{ rotulo: '', valor: '' }];

  function update(i: number, patch: Partial<BlocoDado>) {
    onChange(blocos.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }
  function remove(i: number) {
    const next = blocos.filter((_, idx) => idx !== i);
    onChange(next.length > 0 ? next : [{ rotulo: '', valor: '' }]);
  }
  function add() {
    if (blocos.length >= MAX) return;
    onChange([...blocos, { rotulo: '', valor: '' }]);
  }

  return (
    <div className="flex flex-col gap-3">
      {blocos.map((b, i) => (
        <div key={i} className="flex flex-col gap-2 p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Rótulo (ex: Dólar)"
              maxLength={40}
              value={b.rotulo}
              onChange={(e) => update(i, { rotulo: e.target.value })}
              data-testid={`bloco-rotulo-${i}`}
            />
            <Input
              placeholder="Valor (ex: R$ 5,28)"
              maxLength={40}
              value={b.valor}
              onChange={(e) => update(i, { valor: e.target.value })}
              data-testid={`bloco-valor-${i}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-gray-400 hover:text-red-500"
              onClick={() => remove(i)}
              aria-label="Remover bloco"
            >
              <RiDeleteBinLine className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Variação (ex: +2,43%) — opcional"
              maxLength={20}
              value={b.variacao ?? ''}
              onChange={(e) => update(i, { variacao: e.target.value || undefined })}
              data-testid={`bloco-variacao-${i}`}
            />
            <Select
              value={b.tendencia ?? 'flat'}
              onValueChange={(v) => update(i, { tendencia: v as BlocoDado['tendencia'] })}
            >
              <SelectTrigger className="w-36 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tendenciaOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}

      {blocos.length < MAX && (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={add} data-testid="button-add-bloco">
          <RiAddLine className="w-4 h-4 mr-1" /> Adicionar bloco
        </Button>
      )}
    </div>
  );
}
