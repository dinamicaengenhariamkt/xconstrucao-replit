/**
 * Endpoint test-only: garante que os três usuários usados pela suíte existem.
 *
 * Disponível APENAS quando E2E_TEST_AUTH=1.
 *
 *   POST /api/test/ensure-users → { ok, criados: [...], jaExistiam: [...] }
 *
 * Contexto: a suíte de integração autenticava via `login-as` com os usuários
 * criados por `server/seed.ts`. Isso acoplava os testes a um seed que só roda
 * quando a tabela `users` está vazia — então zerar a base para simular cenários
 * reais (scripts/limpar-base.ts) derrubava 76 testes de uma vez, todos com
 * `login-as ... 404`.
 *
 * Aqui recriamos SÓ o necessário para autenticar e exercitar as três personas:
 * os usuários e seus perfis (`clientes` / `empreiteiras`). Nada dos dados de
 * demonstração do seed (obras, lançamentos, clientes/empreiteiras fictícios) —
 * os specs criam o que precisam e limpam pelo nome "E2E".
 *
 * Idempotente: rodar com a base cheia não altera nada.
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { users, clientes, empreiteiras } from "@shared/db/schema";
import { hashPassword } from "@features/auth/api/auth-service";

function isEnabled(): boolean {
  return process.env.E2E_TEST_AUTH === "1";
}

/**
 * Documentos fiscais válidos (dígito verificador correto). Espelham
 * `CPF_VALIDO`/`CNPJ_VALIDO` de `tests/e2e/helpers.ts`.
 *
 * A regra do `registerSchema` vale aqui também: empreiteiro é pessoa jurídica
 * (só CNPJ); contratante aceita CPF ou CNPJ. Sem documento, o onboarding de
 * subconta do empreiteiro (J45) responde PERFIL_INCOMPLETO e os specs de
 * split/saldo/saque falham.
 */
const CPF_VALIDO = "52998224725";
const CNPJ_VALIDO = "11222333000181";

/**
 * Personas da suíte. As senhas espelham as de `server/seed.ts` porque
 * `loginAs()` faz fallback para o login real quando o test-auth está fora.
 */
const PERSONAS = [
  {
    email: "admin@xconstrucao.com",
    username: "admin",
    name: "Rafael Santos",
    password: "Admin@2026!Constru",
    role: "admin" as const,
    phone: null,
    cpfCnpj: null,
  },
  {
    email: "joao@construtora.com",
    username: "joao",
    name: "João Oliveira",
    password: "Joao@2026!Obras",
    role: "contratante" as const,
    phone: "(11) 98765-4321",
    cpfCnpj: CPF_VALIDO,
  },
  {
    email: "maria@empreiteira.com",
    username: "maria",
    name: "Maria Fernandes",
    password: "Maria@2026!Reforma",
    role: "empreiteiro" as const,
    phone: "(21) 97654-3210",
    cpfCnpj: CNPJ_VALIDO,
  },
  // Segundo contratante: os specs de chat e candidatura precisam de um dono
  // DIFERENTE para exercitar os 403 de não-dono (IDOR). Antes apontavam para
  // uma conta real que por acaso existia na base — quebrava assim que ela era
  // removida, e testava contra dados de um usuário de verdade.
  {
    email: "contratante2.e2e@xconstrucao.test",
    username: "contratante2_e2e",
    name: "Contratante Secundário E2E",
    password: "Contra2@2026!E2E",
    role: "contratante" as const,
    phone: "(11) 90000-0002",
    cpfCnpj: CPF_VALIDO,
  },
  // Par do contratante secundário: juntos formam a "thread alheia" usada para
  // provar que um terceiro recebe 403 no chat.
  {
    email: "empreiteiro2.e2e@xconstrucao.test",
    username: "empreiteiro2_e2e",
    name: "Empreiteiro Secundário E2E",
    password: "Empre2@2026!E2E",
    role: "empreiteiro" as const,
    phone: "(11) 90000-0003",
    cpfCnpj: CNPJ_VALIDO,
  },
];

export async function POST() {
  if (!isEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const criados: string[] = [];
  const jaExistiam: string[] = [];
  const now = new Date();

  for (const p of PERSONAS) {
    const [existente] = await db.select().from(users).where(eq(users.email, p.email));

    if (existente) {
      jaExistiam.push(p.email);
      // Um teste anterior pode ter desativado a conta ou marcado troca de senha
      // obrigatória; ambos bloqueiam toda rota autenticada. O documento pode
      // estar NULL em contas criadas antes do fix da J44 — sem ele o onboarding
      // de subconta responde PERFIL_INCOMPLETO. Normaliza os três.
      const precisaNormalizar =
        !existente.ativo ||
        existente.mustChangePassword ||
        !existente.emailVerified ||
        (p.cpfCnpj !== null && !existente.cpfCnpj);

      if (precisaNormalizar) {
        await db
          .update(users)
          .set({
            ativo: true,
            mustChangePassword: false,
            emailVerified: existente.emailVerified ?? now,
            cpfCnpj: existente.cpfCnpj ?? p.cpfCnpj,
          })
          .where(eq(users.id, existente.id));
      }
      continue;
    }

    const [novo] = await db
      .insert(users)
      .values({
        username: p.username,
        password: await hashPassword(p.password),
        name: p.name,
        email: p.email,
        role: p.role,
        phone: p.phone,
        cpfCnpj: p.cpfCnpj,
        emailVerified: now,
      })
      .returning();
    criados.push(p.email);

    // Perfil correspondente ao papel. Sem ele o usuário loga mas não consegue
    // criar obra (contratante) nem se candidatar (empreiteiro).
    if (p.role === "contratante") {
      await db.insert(clientes).values({
        userId: novo.id,
        nome: p.name,
        tipo: p.cpfCnpj && p.cpfCnpj.length > 11 ? "Pessoa Jurídica" : "Pessoa Física",
        email: p.email,
        telefone: p.phone,
        cnpjCpf: p.cpfCnpj,
        status: "ativo",
      });
    } else if (p.role === "empreiteiro") {
      await db.insert(empreiteiras).values({
        userId: novo.id,
        nome: `${p.name} Empreiteira`,
        responsavel: p.name,
        email: p.email,
        telefone: p.phone,
        cnpj: p.cpfCnpj,
        especialidade: "Acabamento e Pintura",
        status: "ativo",
      });
    }
  }

  return NextResponse.json({ ok: true, criados, jaExistiam });
}
