import { createHmac, randomBytes } from "crypto";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.SESSION_SECRET || randomBytes(32).toString("hex");

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, stored: string): Promise<boolean> {
  return bcrypt.compare(password, stored);
}

export function createPasswordResetToken(userId: string, email: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    type: "password-reset",
    sub: userId,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutos
  })).toString("base64url");
  const signature = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

// Verifica assinatura HMAC, tipo e expiração. Retorna payload bruto ou null.
function verifyJwtPayload(token: string, expectedType: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSig = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
    if (signature !== expectedSig) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as Record<string, unknown>;
    if (data.type !== expectedType) return null;
    if ((data.exp as number) < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export function verifyPasswordResetToken(token: string): { userId: string; email: string } | null {
  const data = verifyJwtPayload(token, "password-reset");
  if (!data) return null;
  return { userId: data.sub as string, email: data.email as string };
}

export function createEmailVerificationToken(userId: string, email: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    type: "email-verification",
    sub: userId,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 horas
  })).toString("base64url");
  const signature = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

export function verifyEmailVerificationToken(token: string): { userId: string; email: string } | null {
  const data = verifyJwtPayload(token, "email-verification");
  if (!data) return null;
  return { userId: data.sub as string, email: data.email as string };
}

// ── Challenge token do 2FA (J22) ─────────────────────────────────────────────
// Emitido quando a senha está correta MAS a conta tem 2FA ativo. Curtíssima vida
// (5 min). Carrega `rememberMe` pra preservar a escolha do usuário no 2º passo.
// NÃO é credencial de sessão — só prova "passei pela senha desta conta".
export function createTwoFactorChallengeToken(userId: string, rememberMe: boolean): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    type: "2fa-challenge",
    sub: userId,
    rememberMe: rememberMe === true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 5 * 60, // 5 minutos
  })).toString("base64url");
  const signature = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

export function verifyTwoFactorChallengeToken(token: string): { userId: string; rememberMe: boolean } | null {
  const data = verifyJwtPayload(token, "2fa-challenge");
  if (!data) return null;
  return { userId: data.sub as string, rememberMe: data.rememberMe === true };
}

// ==================== SISTEMA JWT CUSTOM (ACCESS + REFRESH TOKENS) ====================

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  name: string;
  type: "access";
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sub: string;
  type: "refresh";
  rememberMe: boolean;
  iat: number;
  exp: number;
}

export interface UserData {
  id: string;
  email: string;
  role: string;
  name: string;
  image?: string | null;
  avatarUrl?: string | null;
  canManageUsers?: boolean;
  mustChangePassword?: boolean;
}

export function getAccessTokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...rest] = c.trim().split("=");
      return [key, rest.join("=")];
    })
  );

  return cookies.access_token || null;
}

/**
 * Cria um Access Token JWT com duração de 15 minutos
 * Usado para autenticação em requisições da API
 */
export function createAccessToken(user: UserData): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    image: user.image,
    avatarUrl: user.avatarUrl,
    canManageUsers: user.canManageUsers === true,
    mustChangePassword: user.mustChangePassword === true,
    type: "access",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutos
  })).toString("base64url");
  const signature = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

/**
 * Cria um Refresh Token JWT com duração variável (7 ou 30 dias)
 * Usado para renovar access tokens expirados
 */
export function createRefreshToken(userId: string, rememberMe: boolean = false): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const expirationDays = rememberMe ? 30 : 7; // 30 dias se "Remember Me", senão 7 dias
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    type: "refresh",
    rememberMe,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expirationDays * 24 * 60 * 60,
  })).toString("base64url");
  const signature = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

/**
 * Verifica e valida um Access Token
 * Retorna o payload se válido, null caso contrário
 */
export function verifyAccessToken(token: string): AccessTokenPayload | null {
  const data = verifyJwtPayload(token, "access");
  return data ? (data as unknown as AccessTokenPayload) : null;
}

/**
 * Valida a ASSINATURA + tipo de um access token, mas TOLERA expiração.
 * Uso: barreira de páginas (proxy) onde um access token expirado (mas com
 * assinatura íntegra) deve passar para o client fazer refresh — sem render de
 * área de outra persona, pois a role decodificada ainda é checada pelo caller.
 * NÃO usar para autorizar mutações: para isso, `verifyAccessToken` (rejeita exp).
 */
export function verifyAccessTokenAllowExpired(token: string): AccessTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSig = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
    if (signature !== expectedSig) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as Record<string, unknown>;
    if (data.type !== "access") return null;
    return data as unknown as AccessTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Verifica e valida um Refresh Token
 * Retorna o payload se válido, null caso contrário
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  const data = verifyJwtPayload(token, "refresh");
  return data ? (data as unknown as RefreshTokenPayload) : null;
}

/**
 * Rotaciona um Refresh Token (segurança adicional)
 * Gera um novo refresh token mantendo a configuração rememberMe
 */
export function rotateRefreshToken(oldToken: string): string | null {
  const payload = verifyRefreshToken(oldToken);
  if (!payload) return null;

  return createRefreshToken(payload.sub, payload.rememberMe);
}
