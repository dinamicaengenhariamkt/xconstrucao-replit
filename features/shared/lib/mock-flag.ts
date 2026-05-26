/**
 * Mock data flag — fonte única de verdade.
 *
 * Default: **OFF** (a verdade vem do banco em todas as personas/módulos).
 * Para rodar offline com dados mockados durante o desenvolvimento, defina
 * `NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK=true` em `.env.local`. NUNCA ligar
 * em produção — usuários veriam dados falsos.
 *
 * O nome da env é histórico (começou no módulo empreiteiro) mas hoje
 * controla os mocks de todos os módulos que ainda têm fallback.
 */
export function isMockEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK === 'true';
}
