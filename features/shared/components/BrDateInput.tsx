'use client';

import * as React from 'react';
import { Input } from '@shared/components/ui/input';
import { formatDateBr } from '@shared/lib/masks';

export interface BrDateInputProps
  extends Omit<
    React.ComponentPropsWithoutRef<'input'>,
    'type' | 'value' | 'defaultValue' | 'onChange'
  > {
  value?: string;
  onChange?: (value: string) => void;
}

export const BrDateInput = React.forwardRef<HTMLInputElement, BrDateInputProps>(
  (
    {
      value = '',
      onChange,
      placeholder = 'DD/MM/AAAA',
      maxLength = 10,
      inputMode = 'numeric',
      ...props
    },
    ref,
  ) => (
    <Input
      {...props}
      ref={ref}
      type="text"
      value={formatDateBr(value)}
      onChange={(event) => onChange?.(formatDateBr(event.target.value))}
      placeholder={placeholder}
      maxLength={maxLength}
      inputMode={inputMode}
    />
  ),
);

BrDateInput.displayName = 'BrDateInput';