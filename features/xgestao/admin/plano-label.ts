/** Nome de cada tier do xgestão nas telas e exportações do admin. */
const TIER_LABEL: Record<string, string> = {
  free: 'Somente leitura',
  pro: 'Basic anterior',
  enterprise: 'Pro anterior',
  basic: 'Basic',
  basic_plus: 'Basic Plus',
  premium: 'Premium',
};

export function tierLabel(tier: string): string {
  return TIER_LABEL[tier] ?? tier;
}
