import { createHmac, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";

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

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Não autenticado" });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ message: "Token inválido" });
  (req as any).userId = payload.userId;
  next();
}
