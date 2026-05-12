import { createHash } from "crypto";
import { and, eq, isNull, gt } from "drizzle-orm";
import { db } from "@shared/db/db";
import { passwordSetupTokens } from "@shared/db/schema";
import { generateSetupToken } from "./password-generator";

const TTL_HOURS = 24;

export interface IssuedSetupToken {
  token: string;
  expiresAt: Date;
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function issueSetupToken(userId: string, createdBy: string | null): Promise<IssuedSetupToken> {
  const token = generateSetupToken();
  const expiresAt = new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000);
  await db.insert(passwordSetupTokens).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
    createdBy,
  });
  return { token, expiresAt };
}

export async function consumeSetupToken(rawToken: string): Promise<{ userId: string } | null> {
  const tokenHash = hashToken(rawToken);
  const [row] = await db
    .select()
    .from(passwordSetupTokens)
    .where(
      and(
        eq(passwordSetupTokens.tokenHash, tokenHash),
        isNull(passwordSetupTokens.usedAt),
        gt(passwordSetupTokens.expiresAt, new Date()),
      ),
    );
  if (!row) return null;
  await db
    .update(passwordSetupTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordSetupTokens.id, row.id));
  return { userId: row.userId };
}
