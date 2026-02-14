import { createHmac, randomBytes } from "crypto";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.SESSION_SECRET || randomBytes(32).toString("hex");

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, stored: string): Promise<boolean> {
  return bcrypt.compare(password, stored);
}

export function createToken(userId: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  })).toString("base64url");
  const signature = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSig = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
    if (signature !== expectedSig) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: data.sub };
  } catch {
    return null;
  }
}

export function authMiddleware(req: any, res: any, next: any) {
  const cookieHeader = req.headers.cookie || null;
  const userId = getUserIdFromRequest(cookieHeader);
  if (!userId) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  req.userId = userId;
  next();
}

export function getUserIdFromRequest(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...rest] = c.trim().split("=");
      return [key, rest.join("=")];
    })
  );
  const token = cookies.token;
  if (!token) return null;
  const result = verifyToken(token);
  return result?.userId || null;
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
