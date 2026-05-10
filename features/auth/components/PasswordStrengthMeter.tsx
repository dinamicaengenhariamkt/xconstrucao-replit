'use client';

import { passwordStrength, evaluatePasswordPolicy } from '../schemas/password';

interface Props {
  password: string;
  context?: { email?: string; name?: string; username?: string };
}

const LABELS = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Muito boa', 'Forte'];
// 0 cinza, 1-2 vermelho, 3 amarelo, 4 verde claro, 5 verde escuro
const SEGMENT_COLORS = [
  'bg-slate-200 dark:bg-slate-700',
  'bg-red-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-emerald-400',
  'bg-emerald-700',
];

interface Criterion {
  key: string;
  label: string;
  ok: boolean;
}

function buildCriteria(password: string, ctx: Props['context']): Criterion[] {
  const lower = password.toLowerCase();
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const categoriesOk = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length >= 3;
  const policy = evaluatePasswordPolicy(password, ctx ?? {});
  const noPersonal =
    !!password &&
    (policy.valid ||
      ![
        'A senha não pode conter partes do seu email.',
        'A senha não pode conter seu nome ou usuário.',
        'Esta senha é muito comum. Escolha outra mais difícil.',
      ].includes(policy.message ?? ''));
  return [
    { key: 'len', label: 'Pelo menos 8 caracteres', ok: password.length >= 8 },
    { key: 'cat', label: '3 entre: maiúscula, minúscula, número e símbolo', ok: categoriesOk },
    { key: 'personal', label: 'Não usa seu nome, usuário ou email', ok: noPersonal },
  ];
}

export function PasswordStrengthMeter({ password, context }: Props) {
  if (!password) return null;
  // Mapeia score 0..4 em 0..5 segmentos preenchidos.
  const score = passwordStrength(password);
  const filled = password.length === 0 ? 0 : score === 0 ? 1 : score + 1;
  const criteria = buildCriteria(password, context);

  return (
    <div className="mt-2 space-y-2" data-testid="password-strength-meter">
      <div className="flex gap-1 h-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-colors ${
              i < filled ? SEGMENT_COLORS[filled] : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>
      <p
        className="text-xs text-slate-500 dark:text-slate-400"
        data-testid="text-password-strength"
      >
        Força: <span className="font-semibold">{LABELS[filled]}</span>
      </p>
      <ul className="space-y-1">
        {criteria.map((c) => (
          <li
            key={c.key}
            className={`flex items-center gap-2 text-[11px] leading-snug ${
              c.ok
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-400 dark:text-slate-500'
            }`}
            data-testid={`criterion-${c.key}`}
          >
            <span aria-hidden className="inline-block w-3 text-center">
              {c.ok ? '✓' : '○'}
            </span>
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
