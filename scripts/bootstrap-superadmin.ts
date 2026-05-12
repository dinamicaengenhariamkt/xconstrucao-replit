/**
 * CLI standalone para criar/garantir um Super Admin.
 *
 * Uso:
 *   npx tsx scripts/bootstrap-superadmin.ts
 *
 * Variáveis de ambiente (opcionais — se ausentes, prompt interativo):
 *   SUPERADMIN_EMAIL=admin@xconstrucao.com
 *   SUPERADMIN_PASSWORD=Admin@2026!Constru
 *   SUPERADMIN_NAME="Rafael Santos"
 *   FORCE_RESET=YES   (se a conta já existir, redefine a senha)
 *
 * Comportamento:
 *   1. Garante que o schema (enum superadmin, colunas, tabelas) está aplicado
 *      via bootstrapSuperAdmin().
 *   2. Se a conta com SUPERADMIN_EMAIL existir:
 *        - sem FORCE_RESET=YES: garante que role=superadmin e ativo=true.
 *        - com FORCE_RESET=YES: redefine senha e desliga must_change_password.
 *   3. Se NÃO existir: cria com a senha informada.
 *   4. Em qualquer caso, garante que existe pelo menos um superadmin ativo.
 */
import { eq } from "drizzle-orm";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { db } from "../shared/db/db";
import { users } from "../shared/db/schema";
import { hashPassword } from "../features/auth/api/auth-service";
import { evaluatePasswordPolicy } from "../features/auth/schemas/password";
import { bootstrapSuperAdmin } from "../server/bootstrap-superadmin";

async function prompt(question: string, secret = false): Promise<string> {
  const rl = readline.createInterface({ input, output });
  if (secret) {
    process.stdout.write(question);
    return await new Promise<string>((resolve) => {
      let value = "";
      const onData = (char: Buffer) => {
        const s = char.toString("utf8");
        if (s === "\n" || s === "\r" || s === "\r\n") {
          process.stdin.removeListener("data", onData);
          process.stdout.write("\n");
          rl.close();
          resolve(value);
        } else if (s === "\u0003") {
          process.exit(1);
        } else if (s === "\b" || s === "\x7f") {
          value = value.slice(0, -1);
        } else {
          value += s;
        }
      };
      process.stdin.on("data", onData);
    });
  }
  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
}

async function main() {
  console.log("[bootstrap] Aplicando migrations idempotentes…");
  await bootstrapSuperAdmin();

  const email = (process.env.SUPERADMIN_EMAIL || (await prompt("Email do Super Admin: "))).trim().toLowerCase();
  if (!email) {
    console.error("Email é obrigatório.");
    process.exit(1);
  }
  const name = process.env.SUPERADMIN_NAME || (await prompt("Nome completo: ")) || "Super Admin";
  const password = process.env.SUPERADMIN_PASSWORD || (await prompt("Senha: ", true));
  if (!password) {
    console.error("Senha é obrigatória.");
    process.exit(1);
  }

  const policy = evaluatePasswordPolicy(password, { email, name });
  if (!policy.valid) {
    console.error(`Senha não atende à política: ${policy.message}`);
    process.exit(1);
  }

  const forceReset = process.env.FORCE_RESET === "YES";
  const [existing] = await db.select().from(users).where(eq(users.email, email));

  if (existing) {
    if (forceReset) {
      const hashed = await hashPassword(password);
      await db
        .update(users)
        .set({
          password: hashed,
          role: "superadmin",
          ativo: true,
          mustChangePassword: false,
          emailVerified: existing.emailVerified ?? new Date(),
        })
        .where(eq(users.id, existing.id));
      console.log(`[bootstrap] Conta ${email} resetada e promovida a superadmin.`);
    } else {
      await db
        .update(users)
        .set({ role: "superadmin", ativo: true })
        .where(eq(users.id, existing.id));
      console.log(`[bootstrap] Conta ${email} já existe — promovida a superadmin (use FORCE_RESET=YES para redefinir senha).`);
    }
  } else {
    const hashed = await hashPassword(password);
    await db.insert(users).values({
      name,
      email,
      role: "superadmin",
      password: hashed,
      ativo: true,
      mustChangePassword: false,
      emailVerified: new Date(),
      username: email.split("@")[0],
    });
    console.log(`[bootstrap] Super Admin ${email} criado.`);
  }

  console.log("[bootstrap] OK.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[bootstrap] Falhou:", err);
  process.exit(1);
});
