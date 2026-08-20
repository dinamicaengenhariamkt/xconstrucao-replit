import { createHmac, randomBytes } from "crypto";
import type { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.SESSION_SECRET || randomBytes(32).toString("hex");
const COOKIE_NAME = "impersonation_token";
const TTL_SECONDS = 60 * 60; // 1h

export interface ImpersonationPayload {
  actorId: string;
  targetId: string;
  iat: number;
  exp: number;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

export function createImpersonationToken(actorId: string, targetId: string): string {
  const header = b64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "IMP" })));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(
    Buffer.from(
      JSON.stringify({
        type: "impersonation",
        actorId,
        targetId,
        iat: now,
        exp: now + TTL_SECONDS,
      }),
    ),
  );
  const sig = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

export function verifyImpersonationToken(token: string): ImpersonationPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, sig] = parts;
    const expected = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
    if (sig !== expected) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as Record<string, unknown>;
    if (data.type !== "impersonation") return null;
    if ((data.exp as number) < Math.floor(Date.now() / 1000)) return null;
    return {
      actorId: data.actorId as string,
      targetId: data.targetId as string,
      iat: data.iat as number,
      exp: data.exp as number,
    };
  } catch {
    return null;
  }
}

export function readImpersonationFromRequest(request: NextRequest): ImpersonationPayload | null {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyImpersonationToken(token);
}

export function setImpersonationCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    // O endpoint E2E usa HTTP em 127.0.0.1. Fora desse modo de teste explícito,
    // a sessão de impersonação permanece sempre restrita a HTTPS.
    secure: process.env.E2E_TEST_AUTH !== "1",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export function clearImpersonationCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export const IMPERSONATION_COOKIE_NAME = COOKIE_NAME;

/** Verbos HTTP considerados read-only durante impersonation. */
export function isReadOnlyMethod(method: string): boolean {
  const m = method.toUpperCase();
  return m === "GET" || m === "HEAD" || m === "OPTIONS";
}
