/**
 * CLI standalone para criar/garantir um Admin de escopo xgestão (XG06).
 *
 * Uso:
 *   npx tsx scripts/bootstrap-admin-xgestao.ts \
 *     --email gestor@xconstrucao.com \
 *     --name "Nome do Gestor" \
 *     [--password "P@ssX26Gestao"] \
 *     [--force]
 *
 * Env equivalente: ADMIN_XGESTAO_EMAIL, ADMIN_XGESTAO_NAME,
 * ADMIN_XGESTAO_PASSWORD, FORCE=YES.
 *
 * O que cria:
 *   role="admin", admin_escopo="xgestao", can_manage_users=false,
 *   must_change_password=true, ativo=true.
 *
 * Por que role="admin" e não um role novo:
 *   `isAdminLike` (223 call sites) continua respondendo "é admin?" — verdadeiro.
 *   O recorte é feito pela coluna `admin_escopo`, que é ortogonal ao role. Ver
 *   features/auth/api/admin-scope.ts e docs/jornadas-xgestao/06-admin-xgestao.md.
 *
 * Gate anti-acidente:
 *   Rebaixar para escopo xgestão uma conta que HOJE é admin global (ou
 *   superadmin) exige --force. Sem isso, um erro de digitação no email tiraria
 *   um administrador de plataforma do ar sem aviso. Superadmin nunca é
 *   rebaixado por este script, mesmo com --force.
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
  force?: boolean;
  help?: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    const eat = () => { i++; return next; };
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--force") out.force = true;
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
  console.log(`Uso: npx tsx scripts/bootstrap-admin-xgestao.ts [opções]

Cria um administrador restrito ao escopo xgestão (role=admin,
admin_escopo=xgestao). Ele NÃO enxerga as seções do marketplace.

Opções:
  --email <email>     Email do admin xgestão (obrigatório)
  --name <nome>       Nome completo
  --password <senha>  Senha (min 8 chars, 3 categorias). Opcional — se omitida
                      e stdin não for TTY, gera uma forte de 16 chars.
  --force             Necessário para rebaixar ao escopo xgestão uma conta que
                      hoje é admin global.
  -h, --help          Mostra esta ajuda

Equivalente via env: ADMIN_XGESTAO_EMAIL, ADMIN_XGESTAO_NAME,
ADMIN_XGESTAO_PASSWORD, FORCE=YES.
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

/** Termos vigentes (v1.0). Idempotente via uniqueIndex (user_id, documento, versao). */
async function ensureConsents(userId: string) {
  const docs: Array<"termos" | "privacidade"> = ["termos", "privacidade"];
  for (const documento of docs) {
    try {
      await db
        .insert(userConsents)
        .values({ userId, documento, versao: "1.0", ip: "cli", userAgent: "cli/bootstrap-admin-xgestao" })
        .onConflictDoNothing();
    } catch (err) {
      console.warn(`[bootstrap-xgestao] não foi possível gravar consent ${documento} v1.0:`, err);
    }
  }
}

async function recordCliAudit(targetUserId: string, payload: Record<string, unknown>) {
  try {
    await db.insert(auditLogs).values({
      actorId: null,
      action: "cli.bootstrap-admin-xgestao",
      targetUserId,
      payload,
      ip: "cli",
      userAgent: `cli/${process.argv0 ?? "node"}`,
    });
  } catch (err) {
    console.warn("[bootstrap-xgestao] não foi possível gravar audit_log:", err);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  // Garante o schema (inclui a coluna admin_escopo com DEFAULT 'global').
  console.log("[bootstrap-xgestao] Aplicando migrations idempotentes…");
  await bootstrapSuperAdmin();

  const email = (
    args.email
    ?? process.env.ADMIN_XGESTAO_EMAIL
    ?? (await prompt("Email do admin xgestão: "))
  ).trim().toLowerCase();
  if (!email) {
    console.error("Email é obrigatório.");
    process.exit(1);
  }
  const name = (
    args.name
    ?? process.env.ADMIN_XGESTAO_NAME
    ?? (await prompt("Nome completo: "))
    ?? "Admin xgestão"
  ).trim() || "Admin xgestão";

  let password = args.password ?? process.env.ADMIN_XGESTAO_PASSWORD ?? "";
  let generated = false;
  if (!password) {
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

  const force = args.force === true || process.env.FORCE === "YES";
  const [existing] = await db.select().from(users).where(eq(users.email, email));

  // Superadmin NUNCA é rebaixado por este script — nem com --force. Rebaixar o
  // último superadmin ativo deixaria a plataforma sem administrador global.
  if (existing?.role === "superadmin") {
    console.error(
      `[bootstrap-xgestao] ${email} é superadmin. Este script não rebaixa superadmin. ` +
        `Se a intenção é criar um admin xgestão, use outro email.`,
    );
    process.exit(1);
  }

  // Gate anti-acidente: conta que hoje é admin GLOBAL só é restringida com --force.
  const ehAdminGlobalHoje = existing?.role === "admin" && (existing.adminEscopo ?? "global") === "global";
  if (ehAdminGlobalHoje && !force) {
    console.error(
      `[bootstrap-xgestao] ${email} já é admin de escopo GLOBAL. Restringi-lo ao ` +
        `escopo xgestão removeria o acesso dele às demais seções. ` +
        `Re-execute com --force (ou env FORCE=YES) se for essa a intenção.`,
    );
    process.exit(1);
  }

  let action: "created" | "updated" = "created";
  let targetId: string;

  if (existing) {
    targetId = existing.id;
    const hashed = await hashPassword(password);
    await db
      .update(users)
      .set({
        password: hashed,
        role: "admin",
        adminEscopo: "xgestao",
        canManageUsers: false,
        ativo: true,
        mustChangePassword: true,
        emailVerified: existing.emailVerified ?? new Date(),
      })
      .where(eq(users.id, existing.id));
    action = "updated";
    console.log(
      `[bootstrap-xgestao] Conta ${email} atualizada para admin de escopo xgestão (troca de senha exigida no 1º login).`,
    );
  } else {
    const hashed = await hashPassword(password);
    const [created] = await db
      .insert(users)
      .values({
        name,
        email,
        role: "admin",
        adminEscopo: "xgestao",
        canManageUsers: false,
        password: hashed,
        ativo: true,
        mustChangePassword: true,
        emailVerified: new Date(),
        username: email.split("@")[0],
      })
      .returning({ id: users.id });
    targetId = created.id;
    console.log(`[bootstrap-xgestao] Admin xgestão ${email} criado (troca de senha exigida no 1º login).`);
  }

  // Invariante da plataforma: continuar existindo ao menos 1 superadmin ativo.
  // Este script não mexe em superadmin, mas a verificação é barata e documenta
  // a expectativa para quem rodar em produção.
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(sql`role = 'superadmin' AND ativo = true`);
  if (count === 0) {
    console.warn("[bootstrap-xgestao] ATENÇÃO: não há nenhum superadmin ativo na base.");
  }

  await ensureConsents(targetId);
  await recordCliAudit(targetId, {
    email,
    action,
    escopo: "xgestao",
    force,
    generated,
    consents: ["termos@1.0", "privacidade@1.0"],
  });

  console.log(`[bootstrap-xgestao] OK (${action}). Escopo: xgestao.`);

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
  console.error("[bootstrap-xgestao] Falhou:", err);
  process.exit(1);
});
