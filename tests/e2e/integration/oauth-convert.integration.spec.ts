import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { users } from "@shared/db/schema";
import { ensureProfileRow, getUser } from "@features/auth/api/auth-storage";

test("sessão Google simulada: persona empreiteiro, mesmo role e acesso xgestão", async ({ request }) => {
  const email = `oauth-convert-${Date.now()}-${Math.random().toString(36).slice(2)}@example.invalid`;
  try {
    const simulated = await request.post("/api/test/oauth-simulate", {
      data: { email, name: "Cadastro xgestão" },
    });
    expect(simulated.ok()).toBeTruthy();
    const { user } = await simulated.json();
    // O adaptador agora persiste a role de signIn antes de oauth-convert.
    await db.update(users).set({ role: "empreiteiro" }).where(eq(users.id, user.id));
    const sessionCookie = simulated.headers()["set-cookie"]?.split(";")[0];
    expect(sessionCookie).toBeTruthy();
    const converted = await request.post("/api/auth/oauth-convert", {
      headers: { cookie: `${sessionCookie}; x_signup_persona=xgestao` },
    });
    expect(converted.status(), await converted.text()).toBe(200);
    expect((await converted.json()).user.role).toBe("empreiteiro");
    const authCookies = converted.headersArray()
      .filter((h) => h.name.toLowerCase() === "set-cookie")
      .map((h) => h.value.split(";")[0]);
    const me = await request.get("/api/auth/me", { headers: { cookie: authCookies.join("; ") } });
    expect(me.status()).toBe(200);
    expect((await me.json()).roles).toContain("xgestao");
  } finally {
    await request.delete(`/api/test/oauth-simulate?email=${encodeURIComponent(email)}`);
  }
});

test("sessão Google simulada: login xgestão não concede acesso a conta existente", async ({ request }) => {
  const email = `oauth-existing-${Date.now()}-${Math.random().toString(36).slice(2)}@example.invalid`;
  try {
    const simulated = await request.post("/api/test/oauth-simulate", {
      data: { email, name: "Empreiteiro existente" },
    });
    expect(simulated.ok()).toBeTruthy();
    const { user } = await simulated.json();
    await db.update(users).set({ role: "empreiteiro" }).where(eq(users.id, user.id));
    await ensureProfileRow((await getUser(user.id))!);
    const sessionCookie = simulated.headers()["set-cookie"]?.split(";")[0];
    expect(sessionCookie).toBeTruthy();
    const converted = await request.post("/api/auth/oauth-convert", {
      headers: { cookie: `${sessionCookie}; x_signup_persona=xgestao` },
    });
    expect(converted.status(), await converted.text()).toBe(200);
    expect((await converted.json()).user.role).toBe("empreiteiro");
    const authCookies = converted.headersArray()
      .filter((h) => h.name.toLowerCase() === "set-cookie")
      .map((h) => h.value.split(";")[0]);
    const me = await request.get("/api/auth/me", { headers: { cookie: authCookies.join("; ") } });
    expect(me.status()).toBe(200);
    expect((await me.json()).roles).not.toContain("xgestao");
  } finally {
    await request.delete(`/api/test/oauth-simulate?email=${encodeURIComponent(email)}`);
  }
});