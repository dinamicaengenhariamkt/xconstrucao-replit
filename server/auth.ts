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

export function verifyPasswordResetToken(token: string): { userId: string; email: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expectedSig = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
    if (signature !== expectedSig) return null;

    const data = JSON.parse(Buffer.from(payload, "base64url").toString());

    // Verificar se é token de reset e se não expirou
    if (data.type !== "password-reset") return null;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;

    return { userId: data.sub, email: data.email };
  } catch {
    return null;
  }
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
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expectedSig = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
    if (signature !== expectedSig) return null;

    const data = JSON.parse(Buffer.from(payload, "base64url").toString());

    if (data.type !== "email-verification") return null;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;

    return { userId: data.sub, email: data.email };
  } catch {
    return null;
  }
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
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expectedSig = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
    if (signature !== expectedSig) return null;

    const data = JSON.parse(Buffer.from(payload, "base64url").toString());

    // Verificar tipo e expiração
    if (data.type !== "access") return null;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;

    return data as AccessTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Verifica e valida um Refresh Token
 * Retorna o payload se válido, null caso contrário
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expectedSig = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
    if (signature !== expectedSig) return null;

    const data = JSON.parse(Buffer.from(payload, "base64url").toString());

    // Verificar tipo e expiração
    if (data.type !== "refresh") return null;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;

    return data as RefreshTokenPayload;
  } catch {
    return null;
  }
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
