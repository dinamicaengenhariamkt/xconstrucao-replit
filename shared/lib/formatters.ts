export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatCurrencyRounded(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

export function formatCurrencyCompact(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}K`;
  return `R$ ${value}`;
}

/**
 * Formata uma string ISO (YYYY-MM-DD ou ISO completo) como DD/MM/YYYY (pt-BR).
 * Use `style: 'short'` para DD/MM (sem ano).
 */
export function formatDate(
  iso: string,
  options?: { style?: 'long' | 'short' },
): string {
  if (!iso) return '';
  const d = iso.length === 10 ? new Date(iso + 'T00:00:00') : new Date(iso);
  if (options?.style === 'short') {
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Formata uma string ISO completa como `DD/MM/YYYY · HH:mm` (pt-BR).
 */
export function formatDateTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

/**
 * Formata um par mínimo–máximo como `"min – max"`. Se algum lado estiver vazio,
 * usa `0` à esquerda e `∞` à direita. Aceita prefixo (ex: `"R$ "`) e sufixo (ex: `" obras"`).
 */
export function formatRange(
  min: string | number | null | undefined,
  max: string | number | null | undefined,
  options?: { prefix?: string; suffix?: string },
): string {
  const prefix = options?.prefix ?? '';
  const suffix = options?.suffix ?? '';
  const has = (v: string | number | null | undefined) => v !== null && v !== undefined && v !== '';
  const minPart = has(min) ? `${prefix}${min}${suffix}` : `${prefix}0${suffix}`;
  const maxPart = has(max) ? `${prefix}${max}${suffix}` : '∞';
  return `${minPart} – ${maxPart}`;
}

/**
 * Retorna até 2 iniciais maiúsculas das primeiras palavras do nome.
 * Útil para `<AvatarFallback>`.
 */
export function getInitials(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}
