import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';

/**
 * XG52 — token do link de descadastro dos e-mails de marketing.
 *
 * O link funciona sem login e não pode expor o id da conta. O token é o id
 * cifrado com AES-256-GCM (autenticado: qualquer alteração invalida), com a
 * chave derivada por HMAC-SHA256 do segredo de sessão já existente
 * (`SESSION_SECRET`, senão `NEXTAUTH_SECRET`/`AUTH_SECRET`). Não expira: um
 * e-mail antigo continua servindo para sair. Sem segredo configurado, não há
 * token, e a rotina não manda e-mail de marketing.
 */
const VERSAO = 'v1';
const CONTEXTO = 'xgestao-descadastro-marketing-v1';

export function segredoDescadastro(env: Record<string, string | undefined> = process.env): string | null {
  return env.SESSION_SECRET || env.NEXTAUTH_SECRET || env.AUTH_SECRET || null;
}

function chave(segredo: string): Buffer {
  return createHmac('sha256', segredo).update(CONTEXTO).digest();
}

export function criarTokenDescadastro(userId: string, segredo = segredoDescadastro()): string | null {
  if (!segredo || !userId) return null;
  const iv = randomBytes(12);
  const cifra = createCipheriv('aes-256-gcm', chave(segredo), iv);
  const corpo = Buffer.concat([cifra.update(userId, 'utf8'), cifra.final()]);
  const tag = cifra.getAuthTag();
  return `${VERSAO}.${Buffer.concat([iv, tag, corpo]).toString('base64url')}`;
}

/** Id da conta, ou `null` se o token for inválido, alterado ou de outro segredo. */
export function lerTokenDescadastro(token: string | null | undefined, segredo = segredoDescadastro()): string | null {
  if (!segredo || typeof token !== 'string' || token.length > 400) return null;
  const [versao, dados, ...resto] = token.split('.');
  if (versao !== VERSAO || !dados || resto.length > 0) return null;
  try {
    const bruto = Buffer.from(dados, 'base64url');
    if (bruto.length < 12 + 16 + 1) return null;
    const decifra = createDecipheriv('aes-256-gcm', chave(segredo), bruto.subarray(0, 12));
    decifra.setAuthTag(bruto.subarray(12, 28));
    const id = Buffer.concat([decifra.update(bruto.subarray(28)), decifra.final()]).toString('utf8');
    return id || null;
  } catch {
    return null;
  }
}

/** Página pública de descadastro (link no rodapé do e-mail). */
export function urlDescadastro(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/$/, '')}/descadastro?t=${encodeURIComponent(token)}`;
}

/** Endpoint do `List-Unsubscribe-Post: List-Unsubscribe=One-Click` (RFC 8058). */
export function urlDescadastroUmClique(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/$/, '')}/api/xgestao/descadastro?t=${encodeURIComponent(token)}`;
}
