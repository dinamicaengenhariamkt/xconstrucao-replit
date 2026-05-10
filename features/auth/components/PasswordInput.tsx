'use client';

import { forwardRef, useState } from 'react';
import {
  IconLock,
  IconVisibility,
  IconVisibilityOff,
} from '@shared/components/icons';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /**
   * Test id da raiz aplicado ao <input>. Botão de mostrar/ocultar usa
   * `${testId}-toggle` automaticamente.
   */
  testId?: string;
};

/**
 * Input de senha reutilizável: ícone de cadeado à esquerda, toggle
 * mostrar/ocultar à direita. Funciona com refs do react-hook-form
 * (use `{...register('password')}`).
 */
export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(
  { testId = 'input-password', className = '', ...props },
  ref
) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
      <input
        ref={ref}
        type={show ? 'text' : 'password'}
        data-testid={testId}
        className={
          'w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#333333]/20 dark:focus:ring-white/20 ' +
          className
        }
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
        data-testid={`${testId}-toggle`}
        tabIndex={-1}
      >
        {show ? (
          <IconVisibilityOff className="text-lg" />
        ) : (
          <IconVisibility className="text-lg" />
        )}
      </button>
    </div>
  );
});
