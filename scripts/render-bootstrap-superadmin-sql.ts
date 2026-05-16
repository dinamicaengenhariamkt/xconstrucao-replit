/**
 * Renderiza scripts/sql/bootstrap-superadmin-prod.sql.tpl com:
 *  - senha forte de 16 chars gerada em runtime
 *  - hash bcrypt cost 12 (mesma rotina de features/auth/api/auth-service.ts)
 *  - email/nome/username escapados como literais SQL
 *
 * Saída:
 *  - SQL renderizado vai para STDOUT (você redireciona/pipa onde quiser).
 *  - Senha + email vão para STDERR num banner mostrado UMA ÚNICA VEZ.
 *  - Nenhum arquivo é gravado em disco; nada é commitado no repo.
 *
 * Uso típico:
 *   npx tsx scripts/render-bootstrap-superadmin-sql.ts \
 *     --email admin@xconstrucao.com --name "Super Admin" \
 *     | pbcopy   # ou redireciona para o executor de SQL de produção
 *
 * Args:
 *   --email <email>      (obrigatório; também aceita SUPERADMIN_EMAIL)
 *   --name "<nome>"      (default "Super Admin"; também SUPERADMIN_NAME)
 *   --username <user>    (default = parte antes do @ do email)
 */
import fs from "node:fs/promises";
import path from "node:path";
import { hashPassword } from "../features/auth/api/auth-service";
import { evaluatePasswordPolicy } from "../features/auth/schemas/password";
import { generateStrongPassword } from "../features/auth/api/password-generator";

interface Args { email?: string; name?: string; username?: string; help?: boolean }

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    const eat = () => { i++; return next; };
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--email") out.email = eat();
    else if (a === "--name") out.name = eat();
    else if (a === "--username") out.username = eat();
    else if (a.startsWith("--email=")) out.email = a.slice(8);
    else if (a.startsWith("--name=")) out.name = a.slice(7);
    else if (a.startsWith("--username=")) out.username = a.slice(11);
  }
  return out;
}

/** Escapa um valor para literal SQL string ($$...$$ dollar-quoting com tag random). */
function sqlLiteral(value: string): string {
  let tag = "x";
  while (value.includes(`$${tag}$`)) tag = tag + "x";
  return `$${tag}$${value}$${tag}$`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stderr.write(`Uso: npx tsx scripts/render-bootstrap-superadmin-sql.ts --email <email> [--name <nome>] [--username <user>]\n`);
    process.exit(0);
  }

  const email = (args.email ?? process.env.SUPERADMIN_EMAIL ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    process.stderr.write("Email é obrigatório (--email ou SUPERADMIN_EMAIL).\n");
    process.exit(1);
  }
  const name = (args.name ?? process.env.SUPERADMIN_NAME ?? "Super Admin").trim();
  const username = (args.username ?? email.split("@")[0]).trim();

  const password = generateStrongPassword(16);
  const policy = evaluatePasswordPolicy(password, { email, name });
  if (!policy.valid) {
    process.stderr.write(`Senha gerada não passou na política (${policy.message}). Re-execute.\n`);
    process.exit(1);
  }
  const hash = await hashPassword(password);

  const tplPath = path.resolve(process.cwd(), "scripts/sql/bootstrap-superadmin-prod.sql.tpl");
  const tpl = await fs.readFile(tplPath, "utf8");
  const rendered = tpl
    .replace(/__EMAIL_LIT__/g, sqlLiteral(email))
    .replace(/__NAME_LIT__/g, sqlLiteral(name))
    .replace(/__USERNAME_LIT__/g, sqlLiteral(username))
    .replace(/__PASSWORD_HASH_LIT__/g, sqlLiteral(hash))
    .replace(/__EMAIL__/g, email);

  process.stdout.write(rendered);

  const banner = "═".repeat(72);
  process.stderr.write(`\n${banner}\n`);
  process.stderr.write("  CREDENCIAIS DE 1º LOGIN (mostradas UMA ÚNICA VEZ — copie agora):\n");
  process.stderr.write(`  Email: ${email}\n`);
  process.stderr.write(`  Senha: ${password}\n`);
  process.stderr.write("  → must_change_password=TRUE: o sistema vai exigir trocar a senha no 1º login.\n");
  process.stderr.write("  → A senha NÃO está no SQL renderizado em texto puro — só o hash bcrypt.\n");
  process.stderr.write(`${banner}\n\n`);
}

main().catch((err) => { process.stderr.write(`Falhou: ${String(err)}\n`); process.exit(1); });
