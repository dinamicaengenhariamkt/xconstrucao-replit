import { db } from "@shared/db/db";
import { auditLogs } from "@shared/db/schema";
import type { NextRequest } from "next/server";
import { getClientIp } from "./rate-limit";

export interface AuditInput {
  actorId: string | null;
  action: string;
  targetUserId?: string | null;
  payload?: Record<string, unknown>;
  request?: NextRequest;
}

export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    const ip = input.request ? getClientIp(input.request) : null;
    const userAgent = input.request?.headers.get("user-agent") ?? null;
    await db.insert(auditLogs).values({
      actorId: input.actorId,
      action: input.action,
      targetUserId: input.targetUserId ?? null,
      payload: input.payload ?? {},
      ip,
      userAgent,
    });
  } catch (err) {
    console.error("[audit] falha ao gravar log:", err);
  }
}
