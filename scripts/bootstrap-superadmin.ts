/**
 * CLI standalone para criar/garantir um Super Admin.
 *
 * Uso (args nomeados, recomendado):
 *   npx tsx scripts/bootstrap-superadmin.ts \
 *     --email admin@xconstrucao.com \
 *     --name "Rafael Santos" \
 *     --password "Admin@2026!Constru" \
 *     [--force-reset-password]
 *
 * Variáveis de ambiente (alternativa equivalente):
 *   SUPERADMIN_EMAIL=admin@xconstrucao.com
 *   SUPERADMIN_PASSWORD=Admin@2026!Constru
 *   SUPERADMIN_NAME="Rafael Santos"
 *   FORCE_RESET=YES
 *
 * Se nenhuma das duas formas for passada, o script entra em modo
 * interativo (prompts).
 *
 * Comportamento:
 *   1. Garante que o schema (enum superadmin, colunas, tabelas) está aplicado
 *      via bootstrapSuperAdmin().
 *   2. Se a conta com o email existir:
 *        - sem --force-reset-password: garante que role=superadmin e ativo=true.
 *        - com --force-reset-password: redefine senha e desliga
 *          must_change_password.
 *   3. Se NÃO existir: cria com a senha informada.
 *   4. Em qualquer caso, garante que existe pelo menos um superadmin ativo.
 *   5. Registra entrada em audit_logs (action="cli.bootstrap-superadmin").
 */
import { eq, sql } from "drizzle-orm";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { db } from "../shared/db/db";
import { users, auditLogs } from "../shared/db/schema";
import { hashPassword } from "../features/auth/api/auth-service";
import { evaluatePasswordPolicy } from "../features/auth/schemas/password";
import { bootstrapSuperAdmin } from "../server/bootstrap-superadmin";

interface Args {
  email?: string;
  name?: string;
  password?: string;
  forceReset?: boolean;
  help?: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    const eat = () => { i++; return next; };
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--force-reset-password" || a === "--force-reset") out.forceReset = true;
    else if (a === "--email") out.email = eat();
    else if (a === "--name") out.name = eat();
    else if (a === "--password") out.password = eat();
    else if (a.startsWith("--email=")) out.email = a.slice(8);
    else if (a.startsWith("--name=")) out.name = a.slice(7);
    else if (a.startsWith("--password=")) out.password = a.slice(11);
  }
  return out;
}

function printHelp() {
  console.log(`Uso: npx tsx scripts/bootstrap-superadmin.ts [opções]

Opções:
  --email <email>            Email do super admin
  --name <nome>              Nome completo
  --password <senha>         Senha (min 8 chars, 3 categorias)
  --force-reset-password     Se a conta existir, redefine a senha
  -h, --help                 Mostra esta ajuda

Equivalente via env: SUPERADMIN_EMAIL, SUPERADMIN_NAME,
SUPERADMIN_PASSWORD, FORCE_RESET=YES.
`);
}

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

async function recordCliAudit(targetUserId: string, payload: Record<string, unknown>) {
  try {
    await db.insert(auditLogs).values({
      actorId: null,
      action: "cli.bootstrap-superadmin",
      targetUserId,
      payload,
      ip: "cli",
      userAgent: `cli/${process.argv0 ?? "node"}`,
    });
  } catch (err) {
    console.warn("[bootstrap] não foi possível gravar audit_log:", err);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  console.log("[bootstrap] Aplicando migrations idempotentes…");
  await bootstrapSuperAdmin();

  const email = (
    args.email
    ?? process.env.SUPERADMIN_EMAIL
    ?? (await prompt("Email do Super Admin: "))
  ).trim().toLowerCase();
  if (!email) {
    console.error("Email é obrigatório.");
    process.exit(1);
  }
  const name = (
    args.name
    ?? process.env.SUPERADMIN_NAME
    ?? (await prompt("Nome completo: "))
    ?? "Super Admin"
  ).trim() || "Super Admin";
  const password = (
    args.password
    ?? process.env.SUPERADMIN_PASSWORD
    ?? (await prompt("Senha: ", true))
  );
  if (!password) {
    console.error("Senha é obrigatória.");
    process.exit(1);
  }

  const policy = evaluatePasswordPolicy(password, { email, name });
  if (!policy.valid) {
    console.error(`Senha não atende à política: ${policy.message}`);
    process.exit(1);
  }

  const forceReset = args.forceReset === true || process.env.FORCE_RESET === "YES";
  const [existing] = await db.select().from(users).where(eq(users.email, email));

  let action: "created" | "promoted" | "reset" = "created";
  let targetId: string;

  if (existing) {
    targetId = existing.id;
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
      action = "reset";
      console.log(`[bootstrap] Conta ${email} resetada e promovida a superadmin.`);
    } else {
      await db
        .update(users)
        .set({ role: "superadmin", ativo: true })
        .where(eq(users.id, existing.id));
      action = "promoted";
      console.log(`[bootstrap] Conta ${email} já existe — promovida a superadmin (use --force-reset-password para redefinir senha).`);
    }
  } else {
    const hashed = await hashPassword(password);
    const [created] = await db
      .insert(users)
      .values({
        name,
        email,
        role: "superadmin",
        password: hashed,
        ativo: true,
        mustChangePassword: false,
        emailVerified: new Date(),
        username: email.split("@")[0],
      })
      .returning({ id: users.id });
    targetId = created.id;
    console.log(`[bootstrap] Super Admin ${email} criado.`);
  }

  // Garante invariante: pelo menos 1 superadmin ativo (ele mesmo, agora).
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(sql`role = 'superadmin' AND ativo = true`);
  if (count === 0) {
    console.error("[bootstrap] FATAL: não há nenhum super admin ativo após a operação.");
    process.exit(1);
  }

  await recordCliAudit(targetId, { email, action, forceReset });

  console.log(`[bootstrap] OK (${action}). Super admins ativos: ${count}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[bootstrap] Falhou:", err);
  process.exit(1);
});
