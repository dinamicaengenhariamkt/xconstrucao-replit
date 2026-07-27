import { APIRequestContext, expect } from "@playwright/test";

/**
 * Emails das personas usadas como default pelos utilitários compartilhados. Um
 * spec pode sobrescrevê-los passando argumentos explícitos.
 *
 * Historicamente vinham de `server/seed.ts`, que só popula a base quando a
 * tabela `users` está vazia. `ensurePersonas()` abaixo remove essa dependência.
 */
export const SEED_CONTRATANTE_EMAIL = "joao@construtora.com";
export const SEED_EMPREITEIRO_EMAIL = "maria@empreiteira.com";
export const SEED_ADMIN_EMAIL = "admin@xconstrucao.com";

/**
 * Segundo contratante, para specs que precisam de um dono DIFERENTE ao
 * exercitar 403 de não-dono (IDOR em obra e chat). Criado por
 * `ensurePersonas`; antes os specs apontavam para uma conta real da base.
 */
export const SEED_CONTRATANTE_2_EMAIL = "contratante2.e2e@xconstrucao.test";

/** Par do contratante secundário — forma a "thread alheia" nos testes de chat. */
export const SEED_EMPREITEIRO_2_EMAIL = "empreiteiro2.e2e@xconstrucao.test";

/**
 * Documentos fiscais válidos (dígito verificador correto) para cadastro nos
 * testes. A escolha entre eles NÃO é indiferente — `registerSchema` aplica
 * regra por persona:
 *
 *   contratante → CPF ou CNPJ
 *   empreiteiro → somente CNPJ (cadastro é de pessoa jurídica)
 *   anunciante  → isento (documento coletado no checkout do anúncio)
 *
 * Use `DOC_VALIDO_POR_ROLE` para não precisar lembrar da regra em cada spec.
 */
export const CPF_VALIDO = "52998224725";
export const CNPJ_VALIDO = "11222333000181";

/** Documento aceito por persona no cadastro. */
export const DOC_VALIDO_POR_ROLE: Record<string, string> = {
  contratante: CPF_VALIDO,
  empreiteiro: CNPJ_VALIDO,
  anunciante: CPF_VALIDO,
};

/**
 * `true` quando o Chromium do Playwright consegue subir neste ambiente.
 *
 * Aqui ele NÃO sobe: o `REPLIT_LD_AUDIT` faz o loader resolver a `libpthread`
 * do sistema base, que não exporta `GLIBC_PRIVATE`, enquanto a `librt.so.1`
 * da glibc do Nix exige — o launch falha com `GLIBC_PRIVATE not found`.
 * Diagnóstico completo em docs/jornadas/37-testes-e2e.md §11.
 *
 * Alguns specs misturam testes de API e de UI no mesmo arquivo. Sem este
 * guard, ou o arquivo inteiro fica fora da suíte (era o caso — e junto com
 * ele iam testes de API que cobrem medição→pagamento), ou o arquivo inteiro
 * falha no primeiro teste que abre página. Use assim:
 *
 *     test("algo visual", async ({ page }) => {
 *       test.skip(!BROWSER_DISPONIVEL, MOTIVO_BROWSER_INDISPONIVEL);
 *       ...
 *     });
 *
 * Ligue com `E2E_BROWSER=1` quando rodar num runner com glibc consistente
 * (imagem `mcr.microsoft.com/playwright` ou CI externo).
 */
export const BROWSER_DISPONIVEL = process.env.E2E_BROWSER === "1";

export const MOTIVO_BROWSER_INDISPONIVEL =
  "Chromium não sobe neste ambiente (GLIBC_PRIVATE). Rode com E2E_BROWSER=1 num runner com browser — ver J37 §11.";

/**
 * Memoiza a garantia por processo-worker: dezenas de specs chamam `loginAs`,
 * mas só a primeira precisa bater no endpoint.
 */
let personasProntas: Promise<void> | null = null;

/**
 * Garante que as três personas existam antes de autenticar.
 *
 * A suíte dependia dos usuários criados por `server/seed.ts` — que não roda
 * com a base já populada nem é recriado após uma limpeza operacional
 * (scripts/limpar-base.ts). O resultado era a suíte inteira falhando com
 * `login-as ... 404` sempre que a base era zerada para simular cenários reais.
 *
 * Best-effort: se o endpoint test-only estiver desabilitado (E2E_TEST_AUTH≠1),
 * segue adiante — o `loginAs` ainda pode autenticar via login real.
 */
export async function ensurePersonas(request: APIRequestContext): Promise<void> {
  if (!personasProntas) {
    personasProntas = request
      .post("/api/test/ensure-users")
      .then(() => undefined)
      .catch(() => undefined);
  }
  return personasProntas;
}

/**
 * Autentica via endpoint test-only `POST /api/test/login-as` (habilitado por
 * E2E_TEST_AUTH=1). Emite os cookies de sessão pulando senha/verificação de
 * email. Se `password` for informado e o login-as falhar (ex.: test-auth
 * indisponível), faz fallback para um login real com o payload anti-bot.
 */
export async function loginAs(
  request: APIRequestContext,
  email: string,
  password?: string
): Promise<void> {
  // Recria as personas se a base tiver sido zerada. No-op quando já existem.
  await ensurePersonas(request);

  const fast = await request.post("/api/test/login-as", { data: { email } });
  if (fast.ok()) return;

  if (password) {
    const res = await request.post("/api/auth/login", {
      data: { email, password, mountedAt: Date.now() - 3000, website: "" },
    });
    expect(
      res.ok(),
      `login real de ${email} deve responder ok (status ${res.status()})`
    ).toBeTruthy();
    return;
  }

  expect(
    fast.ok(),
    `login-as ${email} deve responder ok (status ${fast.status()})`
  ).toBeTruthy();
}

/** Encerra a sessão atual. Best-effort (nunca lança). */
export async function logout(request: APIRequestContext): Promise<void> {
  await request.post("/api/auth/logout").catch(() => {});
}

function asRows(payload: unknown): Array<Record<string, unknown>> {
  return Array.isArray(payload)
    ? (payload as Array<Record<string, unknown>>)
    : (((payload as { rows?: Array<Record<string, unknown>> })?.rows) ?? []);
}

/**
 * Conclui (via admin) todas as obras abertas do contratante para liberar a cota
 * do plano free. Best-effort — nunca lança. Envia `numero` junto para satisfazer
 * a revalidação `insertObraSchemaStrict` em obras publicadas sem número.
 */
export async function liberarCotaObras(
  request: APIRequestContext,
  {
    contratanteEmail = SEED_CONTRATANTE_EMAIL,
    adminEmail = SEED_ADMIN_EMAIL,
  }: { contratanteEmail?: string; adminEmail?: string } = {}
): Promise<void> {
  await loginAs(request, contratanteEmail);
  const listRes = await request.get("/api/obras");
  if (!listRes.ok()) {
    await logout(request);
    return;
  }
  const abertas = asRows(await listRes.json()).filter((o) => o.status !== "concluida");
  await logout(request);
  if (abertas.length === 0) return;

  await loginAs(request, adminEmail);
  for (const o of abertas) {
    await request
      .patch(`/api/obras/${o.id as string}`, { data: { status: "concluida", numero: "0" } })
      .catch(() => {});
  }
  await logout(request);
}

/**
 * Apaga as obras E2E do contratante (e as candidaturas delas) via endpoint
 * test-only. Best-effort — nunca lança.
 *
 * Diferente de `liberarCotaObras`, que apenas CONCLUI as obras: o limite de
 * propostas/mês do plano (J11) conta candidaturas criadas no mês corrente,
 * independente do estado da obra. Concluir não devolve a cota do empreiteiro —
 * só apagar a candidatura devolve. Specs que criam propostas com o empreiteiro
 * seed devem chamar isto no `afterAll`, senão a cota free (5/mês) se esgota
 * após poucas execuções e os runs seguintes skipam em silêncio.
 */
export async function limparObrasE2E(
  request: APIRequestContext,
  { contratanteEmail = SEED_CONTRATANTE_EMAIL }: { contratanteEmail?: string } = {}
): Promise<void> {
  await request
    .delete(`/api/test/cleanup-obras?email=${encodeURIComponent(contratanteEmail)}`)
    .catch(() => {});
}

/** Conclui (via admin) uma obra específica para liberar a cota. Best-effort. */
export async function concluirObra(
  request: APIRequestContext,
  obraId: string,
  { adminEmail = SEED_ADMIN_EMAIL }: { adminEmail?: string } = {}
): Promise<void> {
  if (!obraId) return;
  await loginAs(request, adminEmail);
  await request
    .patch(`/api/obras/${obraId}`, { data: { status: "concluida", numero: "0" } })
    .catch(() => {});
  await logout(request);
}

export type CapturedEmail = {
  id: string;
  to: string;
  subject: string;
  html: string;
  meta?: Record<string, unknown> & { verificationUrl?: string };
  sentAt: string;
};

/** Gera um email único por execução para evitar colidir com cadastros antigos. */
export function uniqueEmail(prefix: string): string {
  const slug = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return `${prefix}+${slug}@xconstrucao-e2e.test`;
}

export function uniqueUsername(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

/** Busca emails capturados pelo modo de teste para um destinatário específico. */
export async function fetchCapturedEmails(
  request: APIRequestContext,
  to: string
): Promise<CapturedEmail[]> {
  const res = await request.get(`/api/test/emails?to=${encodeURIComponent(to)}`);
  expect(res.ok(), "endpoint /api/test/emails deve responder OK (EMAIL_TEST_MODE=1)").toBeTruthy();
  const body = (await res.json()) as { emails: CapturedEmail[] };
  return body.emails ?? [];
}

/** Faz polling até encontrar um email de verificação para o destinatário. */
export async function waitForVerificationEmail(
  request: APIRequestContext,
  to: string,
  { timeoutMs = 8000, intervalMs = 250 }: { timeoutMs?: number; intervalMs?: number } = {}
): Promise<CapturedEmail> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const emails = await fetchCapturedEmails(request, to);
    const verification = emails.find(
      (e) => e.meta?.kind === "verification" && typeof e.meta?.verificationUrl === "string"
    );
    if (verification) return verification;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Email de verificação para ${to} não chegou em ${timeoutMs}ms`);
}

/** Limpa o store de emails capturados (entre testes). */
export async function clearCapturedEmails(request: APIRequestContext): Promise<void> {
  await request.delete("/api/test/emails");
}
