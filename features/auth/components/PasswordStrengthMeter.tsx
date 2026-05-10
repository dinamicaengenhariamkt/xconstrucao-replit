'use client';

import { passwordStrength } from '../schemas/password';

interface Props {
  password: string;
}

const LABELS = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte'];
const COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-emerald-500',
];

export function PasswordStrengthMeter({ password }: Props) {
  const score = passwordStrength(password);
  if (!password) return null;

  return (
    <div className="mt-2" data-testid="password-strength-meter">
      <div className="flex gap-1 h-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-colors ${
              i < score ? COLORS[score] : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>
      <p
        className="text-xs text-slate-500 dark:text-slate-400 mt-1"
        data-testid="text-password-strength"
      >
        Força: <span className="font-semibold">{LABELS[score]}</span>
      </p>
      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
        Mínimo 8 caracteres com pelo menos 3 entre: maiúscula, minúscula, número e símbolo.
      </p>
    </div>
  );
}
