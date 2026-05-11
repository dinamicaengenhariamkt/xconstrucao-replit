'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@shared/components/ui/input';
import type { ChangeEvent } from 'react';
import { formatCep, lookupCep, unformatCep } from '@shared/lib/masks';

interface CepInputProps {
  value: string;
  onChange: (cep: string) => void;
  onAutofill?: (data: { endereco: string; bairro: string; cidade: string; estado: string }) => void;
  /** Chamado quando o CEP é alterado e perde validade (limpa campos derivados antes da nova busca). */
  onClear?: () => void;
  /** Chamado quando o ViaCEP retorna 404/erro para o CEP digitado. */
  onLookupFailed?: () => void;
  placeholder?: string;
  'data-testid'?: string;
  disabled?: boolean;
  className?: string;
}

export function CepInput({
  value,
  onChange,
  onAutofill,
  onClear,
  onLookupFailed,
  placeholder = '00000-000',
  disabled,
  className,
  ...rest
}: CepInputProps) {
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const lastLookupRef = useRef<string>('');

  useEffect(() => {
    const digits = unformatCep(value);
    if (digits.length !== 8) {
      // CEP incompleto/alterado: descarta cache de lookup e silencia aviso.
      lastLookupRef.current = '';
      if (notFound) setNotFound(false);
      return;
    }
    if (digits === lastLookupRef.current) return;
    lastLookupRef.current = digits;
    const ctrl = new AbortController();
    setLoading(true);
    setNotFound(false);
    // Limpa endereço/cidade/UF antes da nova busca, evitando misturar
    // dados de um CEP antigo com a nova consulta.
    if (onClear) onClear();
    lookupCep(digits, ctrl.signal)
      .then((res) => {
        if (res && onAutofill) {
          onAutofill({
            endereco: res.endereco,
            bairro: res.bairro,
            cidade: res.cidade,
            estado: res.estado,
          });
        } else if (!res) {
          setNotFound(true);
          if (onLookupFailed) onLookupFailed();
        }
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <Input
        value={formatCep(value)}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(unformatCep(e.target.value))}
        placeholder={placeholder}
        inputMode="numeric"
        maxLength={9}
        disabled={disabled}
        className={className}
        data-testid={rest['data-testid']}
      />
      {loading ? (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
          buscando…
        </span>
      ) : null}
      {!loading && notFound ? (
        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400" data-testid="cep-nao-encontrado">
          CEP não encontrado. Preencha o endereço manualmente.
        </p>
      ) : null}
    </div>
  );
}
