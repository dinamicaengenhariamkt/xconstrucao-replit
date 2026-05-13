/**
 * CLI standalone para criar/garantir um Super Admin.
 *
 * Uso (args nomeados, recomendado):
 *   npx tsx scripts/bootstrap-superadmin.ts \
 *     --email admin@xconstrucao.com \
 *     --name "Rafael Santos" \
 *     [--password "Admin@2026!Constru"] \
 *     [--force-reset-password]
 *
 * Variáveis de ambiente (alternativa equivalente):
 *   SUPERADMIN_EMAIL=admin@xconstrucao.com
 *   SUPERADMIN_PASSWORD=Admin@2026!Constru   (opcional)
 *   SUPERADMIN_NAME="Rafael Santos"
 *   FORCE_RESET=YES
 *
 * Senha:
 *   - Se --password / SUPERADMIN_PASSWORD não vierem e o stdin for um TTY,
 *     pergunta interativamente (vazio = gerar automática).
 *   - Se não vierem e o stdin NÃO for TTY (ex.: shell de produção em CI/SSH),
 *     gera uma senha forte de 16 chars automaticamente.
 *   - Em qualquer caso a senha gerada é mostrada UMA ÚNICA VEZ no fim do
 *     output.
 *
 * Comportamento:
 *   1. Garante que o schema (enum superadmin, colunas, tabelas) está aplicado
 *      via bootstrapSuperAdmin().
 *   2. Se a conta com o email existir: persiste a senha hasheada,
 *      promove para role=superadmin, marca ativo=true e
 *      must_change_password=true (independente de --force-reset-password —
 *      o flag só muda o rótulo no log de auditoria entre "promoted" e "reset").
 *   3. Se NÃO existir: cria com a senha (informada ou gerada),
 *      role=superadmin, ativo=true, must_change_password=true.
 *   4. Em qualquer caso, garante que existe pelo menos um superadmin ativo
 *      após a operação.
 *   5. Insere user_consents v1.0 (termos+privacidade) idempotentes e registra
 *      audit_logs (action="cli.bootstrap-superadmin", payload com action,
 *      forceReset, generated, consents).
 *
 * Gate estrito (anti-acidente):
 *   - Se já existe ≥1 super admin ativo e a operação resultaria em uma conta
 *     DIFERENTE virando super admin (criação ou promoção/reativação de outro
 *     usuário), exige --force-reset-password explicitamente.
 *   - Operações idempotentes na mesma conta super existente seguem permitidas.
 */
import { eq, sql } from "drizzle-orm";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { db } from "../shared/db/db";
import { users, auditLogs, userConsents } from "../shared/db/schema";
import { hashPassword } from "../features/auth/api/auth-service";
import { evaluatePasswordPolicy } from "../features/auth/schemas/password";
import { bootstrapSuperAdmin } from "../server/bootstrap-superadmin";
import { generateStrongPassword } from "../features/auth/api/password-generator";

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
  --email <email>            Email do super admin (obrigatório)
  --name <nome>              Nome completo
  --password <senha>         Senha (min 8 chars, 3 categorias). Opcional —
                             se omitida e stdin não for TTY, é gerada uma
                             senha forte de 16 chars e mostrada no fim.
  --force-reset-password     Necessário para criar/promover uma conta
                             DIFERENTE quando já existe um super admin ativo.
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

/**
 * Garante que o super admin tem registro nos termos vigentes (v1.0).
 * Idempotente via uniqueIndex (user_id, documento, versao).
 */
async function ensureSuperAdminConsents(userId: string) {
  const docs: Array<"termos" | "privacidade"> = ["termos", "privacidade"];
  for (const documento of docs) {
    try {
      await db
        .insert(userConsents)
        .values({ userId, documento, versao: "1.0", ip: "cli", userAgent: "cli/bootstrap-superadmin" })
        .onConflictDoNothing();
    } catch (err) {
      console.warn(`[bootstrap] não foi possível gravar consent ${documento} v1.0:`, err);
    }
  }
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
  // Senha: prioriza arg/env. Se nada vier, gera uma senha forte (16 chars)
  // automaticamente — usada para o primeiro super admin em produção.
  // A senha é mostrada UMA ÚNICA VEZ no fim da execução.
  let password = args.password ?? process.env.SUPERADMIN_PASSWORD ?? "";
  let generated = false;
  if (!password) {
    // Modo interativo só se for um TTY real; caso contrário gera automático.
    if (process.stdin.isTTY) {
      password = await prompt("Senha (deixe vazio para gerar uma forte): ", true);
    }
    if (!password) {
      password = generateStrongPassword(16);
      generated = true;
    }
  }

  const policy = evaluatePasswordPolicy(password, { email, name });
  if (!policy.valid) {
    console.error(`Senha não atende à política: ${policy.message}`);
    process.exit(1);
  }

  const forceReset = args.forceReset === true || process.env.FORCE_RESET === "YES";
  const [existing] = await db.select().from(users).where(eq(users.email, email));

  // Gate estrito: se já existe pelo menos 1 super admin ativo e a operação
  // resultaria em um NOVO super admin (conta inexistente, ou conta existente
  // que ainda não é superadmin), exija --force-reset-password explicitamente.
  // Promoção/reset da conta que já é superadmin não exige o flag.
  const [{ count: activeSuperCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(sql`role = 'superadmin' AND ativo = true`);
  const wouldAddNewSuper = !existing || existing.role !== "superadmin" || existing.ativo === false;
  if (activeSuperCount > 0 && wouldAddNewSuper && !forceReset) {
    console.error(
      `[bootstrap] Já existe ${activeSuperCount} super admin(s) ativo(s). ` +
        `Para criar/promover/reativar outra conta como super admin, ` +
        `re-execute com --force-reset-password (ou env FORCE_RESET=YES).`,
    );
    process.exit(1);
  }

  let action: "created" | "promoted" | "reset" = "created";
  let targetId: string;

  if (existing) {
    targetId = existing.id;
    // Sempre persistimos a senha (informada ou gerada) na conta existente:
    // o objetivo do CLI é deixar um super admin utilizável imediatamente.
    // Mantemos must_change_password=true para forçar troca no 1º login,
    // garantindo que a senha mostrada (caso gerada) só vale uma vez.
    const hashed = await hashPassword(password);
    await db
      .update(users)
      .set({
        password: hashed,
        role: "superadmin",
        ativo: true,
        mustChangePassword: true,
        emailVerified: existing.emailVerified ?? new Date(),
      })
      .where(eq(users.id, existing.id));
    action = forceReset ? "reset" : "promoted";
    console.log(
      `[bootstrap] Conta ${email} ${action === "reset" ? "resetada" : "atualizada"} e promovida a superadmin (troca de senha exigida no 1º login).`,
    );
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
        mustChangePassword: true,
        emailVerified: new Date(),
        username: email.split("@")[0],
      })
      .returning({ id: users.id });
    targetId = created.id;
    console.log(`[bootstrap] Super Admin ${email} criado (troca de senha exigida no 1º login).`);
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

  await ensureSuperAdminConsents(targetId);
  await recordCliAudit(targetId, { email, action, forceReset, generated, consents: ["termos@1.0", "privacidade@1.0"] });

  console.log(`[bootstrap] OK (${action}). Super admins ativos: ${count}.`);

  if (generated) {
    const banner = "═".repeat(72);
    console.log(`\n${banner}`);
    console.log("  SENHA TEMPORÁRIA (mostrada UMA ÚNICA VEZ — copie agora):");
    console.log(`  Email:  ${email}`);
    console.log(`  Senha:  ${password}`);
    console.log("  → No primeiro login o sistema vai exigir a troca da senha.");
    console.log(`${banner}\n`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("[bootstrap] Falhou:", err);
  process.exit(1);
});
