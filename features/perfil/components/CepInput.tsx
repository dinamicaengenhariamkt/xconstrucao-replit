'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@shared/components/ui/input';
import type { ChangeEvent } from 'react';
import { formatCep, lookupCep, unformatCep } from '@shared/lib/masks';

interface CepInputProps {
  value: string;
  onChange: (cep: string) => void;
  onAutofill?: (data: { endereco: string; bairro: string; cidade: string; estado: string }) => void;
  placeholder?: string;
  'data-testid'?: string;
  disabled?: boolean;
  className?: string;
}

export function CepInput({
  value,
  onChange,
  onAutofill,
  placeholder = '00000-000',
  disabled,
  className,
  ...rest
}: CepInputProps) {
  const [loading, setLoading] = useState(false);
  const lastLookupRef = useRef<string>('');

  useEffect(() => {
    const digits = unformatCep(value);
    if (digits.length !== 8 || digits === lastLookupRef.current) return;
    lastLookupRef.current = digits;
    const ctrl = new AbortController();
    setLoading(true);
    lookupCep(digits, ctrl.signal)
      .then((res) => {
        if (res && onAutofill) {
          onAutofill({
            endereco: res.endereco,
            bairro: res.bairro,
            cidade: res.cidade,
            estado: res.estado,
          });
        }
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [value, onAutofill]);

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
    </div>
  );
}
