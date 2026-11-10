/**
 * Formato do token do link público (32 bytes em base64url). Puro, sem banco:
 * a página valida o formato ANTES de tocar no rate limit (PUB-03), para que
 * lixo na URL não crie entradas no Map nem consulte o banco.
 */
export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function tokenComFormatoValido(token: unknown): token is string {
  return typeof token === 'string' && TOKEN_PATTERN.test(token);
}
