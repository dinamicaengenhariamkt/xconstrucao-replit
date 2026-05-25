/**
 * Smoke (Task #42 / J04.B) — Marketplace paginado + obras-salvas.
 *
 * Cobre os 12 critérios da seção 10 da J04:
 *  1. GET /api/obras paginado (envelope { rows, total, page, pageSize, totalPages })
 *  2. pageSize=10000 → clampado para 100
 *  3. cidade ILIKE case-insensitive
 *  4. Filtros materiaisPor / tipo / modalidade funcionam
 *  5. Anti-self: empreiteiro com candidatura na obra não a vê no feed
 *  6. Obra com empreiteira_id != NULL não aparece no feed
 *  7. Obra visibilidade=rascunho não aparece para empreiteiro
 *  8. POST /api/empreiteiro/obras-salvas idempotente (2x → 1 row)
 *  9. POST com obraId de rascunho → 404 (anti-enumeração)
 * 10. DELETE com obraId inexistente → 200 silencioso
 * 11. GET /obras-salvas exclui obras pausadas/vinculadas/anti-self
 * 12. Contratante POST /obras-salvas → 403
 *
 * Uso: BASE_URL=http://localhost:5000 tsx scripts/smoke-task42-marketplace.ts
 */
import { Pool } from "pg";
import { randomUUID } from "crypto";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:5000";
const EMP_EMAIL = "maria@empreiteira.com";
const EMP_PASS = "Maria@2026!Reforma";
const CON_EMAIL = "joao@construtora.com";
const CON_PASS = "Joao@2026!Obras";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não setado.");
  process.exit(1);
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

let failures = 0;
function assert(cond: boolean, label: string, detail?: unknown) {
  if (cond) {
    console.log(`  ✓ ${label}`);
  } else {
    failures += 1;
    console.log(`  ✗ ${label}`, detail !== undefined ? detail : "");
  }
}

async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, mountedAt: Date.now() - 2000, website: "" }),
  });
  if (!res.ok) throw new Error(`Login ${email} falhou: ${res.status} ${await res.text()}`);
  const cookies = res.headers.getSetCookie?.() ?? [];
  const cookieHeader = cookies.map((c) => c.split(";")[0]).join("; ");
  if (!cookieHeader) throw new Error(`Sem cookies de login para ${email}`);
  return cookieHeader;
}

async function api(
  cookie: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; json: any }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      cookie,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  return { status: res.status, json };
}

async function getEmpreiteiroUserId(): Promise<string> {
  const r = await pool.query(`SELECT id FROM users WHERE email = $1`, [EMP_EMAIL]);
  if (r.rows.length === 0) throw new Error("Seed empreiteiro maria não encontrada.");
  return r.rows[0].id;
}

async function getContratanteClienteId(): Promise<string> {
  const r = await pool.query(
    `SELECT c.id FROM clientes c JOIN users u ON u.id = c.user_id WHERE u.email = $1`,
    [CON_EMAIL],
  );
  if (r.rows.length === 0) throw new Error("Seed cliente joao não encontrado.");
  return r.rows[0].id;
}

async function main() {
  console.log(`[smoke #42] BASE_URL=${BASE_URL}`);

  const empCookie = await login(EMP_EMAIL, EMP_PASS);
  const conCookie = await login(CON_EMAIL, CON_PASS);
  const empUserId = await getEmpreiteiroUserId();
  const clienteId = await getContratanteClienteId();

  // Fixtures: 3 obras publicadas (uma em SP, uma em RJ), 1 rascunho, 1 com candidatura, 1 vinculada.
  const tag = `smoke42-${Date.now().toString(36)}`;
  const obraIds = {
    spA: randomUUID(),
    spB: randomUUID(),
    rj: randomUUID(),
    rascunho: randomUUID(),
    candidatada: randomUUID(),
    vinculada: randomUUID(),
  };
  const fakeEmpreiteiraUserId = randomUUID();
  const fakeEmpreiteiraId = randomUUID();

  await pool.query(
    `INSERT INTO users (id, username, email, password, role, name)
     VALUES ($1,$2,$3,'x','contratante','Smoke Owner Vinc')`,
    [fakeEmpreiteiraUserId, `smoke-vinc-${tag}`, `smoke-vinc-${tag}@x.test`],
  );
  await pool.query(
    `INSERT INTO empreiteiras (id, user_id, nome, cnpj, responsavel, email, telefone)
     VALUES ($1,$2,'Empreiteira Vinc','00000000000000','Resp Smoke','smoke-resp@x.test','11999999999')`,
    [fakeEmpreiteiraId, fakeEmpreiteiraUserId],
  );

  await pool.query(
    `INSERT INTO obras (id, cliente_id, nome, endereco, status, visibilidade, cidade, uf, tipo, modalidade, materiais_por, valor_total)
     VALUES
       ($1,$7,$8,'Rua A','planejamento','publicada','São Paulo','SP','reforma','empreitada_global','contratante',100000),
       ($2,$7,$9,'Rua B','planejamento','publicada','São Paulo','SP','construcao','empreitada_etapa','empreiteiro',300000),
       ($3,$7,$10,'Rua C','planejamento','publicada','Rio de Janeiro','RJ','reforma','administracao','misto',150000),
       ($4,$7,$11,'Rua D','planejamento','rascunho',NULL,NULL,NULL,NULL,NULL,NULL),
       ($5,$7,$12,'Rua E','planejamento','publicada','Curitiba','PR','reforma','empreitada_global','contratante',200000),
       ($6,$7,$13,'Rua F','em_andamento','publicada','Belo Horizonte','MG','reforma','empreitada_global','contratante',400000)`,
    [
      obraIds.spA, obraIds.spB, obraIds.rj, obraIds.rascunho, obraIds.candidatada, obraIds.vinculada,
      clienteId,
      `Obra SP A ${tag}`, `Obra SP B ${tag}`, `Obra RJ ${tag}`,
      `Obra Rascunho ${tag}`, `Obra Candidatada ${tag}`, `Obra Vinculada ${tag}`,
    ],
  );
  // Vincula obraVinculada à empreiteira (deve sumir do feed empreiteiro)
  await pool.query(`UPDATE obras SET empreiteira_id = $1 WHERE id = $2`, [fakeEmpreiteiraId, obraIds.vinculada]);
  // Candidata maria à obraCandidatada (deve sumir do feed dela via anti-self)
  await pool.query(
    `INSERT INTO candidaturas (obra_id, empreiteiro_id, valor_proposta, status)
     VALUES ($1,$2,90000,'pendente')`,
    [obraIds.candidatada, empUserId],
  );

  try {
    console.log("\n[1] GET /api/obras envelope + paginação");
    const r1 = await api(empCookie, "GET", "/api/obras?pageSize=2&page=1");
    assert(r1.status === 200, "status 200", r1.status);
    assert(typeof r1.json === "object" && Array.isArray(r1.json?.rows), "envelope { rows: [] }");
    assert(typeof r1.json?.total === "number", "envelope.total numérico");
    assert(r1.json?.page === 1 && r1.json?.pageSize === 2, "page/pageSize ecoam");
    assert((r1.json?.rows ?? []).length <= 2, "rows ≤ pageSize");
    assert(r1.json?.totalPages >= 1, "totalPages calculado");

    console.log("\n[2] pageSize=10000 → clamp 100");
    const r2 = await api(empCookie, "GET", "/api/obras?pageSize=10000");
    assert(r2.status === 200 && r2.json?.pageSize === 100, "pageSize clampado a 100", r2.json?.pageSize);

    console.log("\n[3] cidade ILIKE case-insensitive");
    const r3 = await api(empCookie, "GET", "/api/obras?cidade=são paulo&pageSize=100");
    const r3Names: string[] = (r3.json?.rows ?? []).map((o: any) => o.nome);
    assert(r3.status === 200, "status 200");
    assert(r3Names.includes(`Obra SP A ${tag}`) && r3Names.includes(`Obra SP B ${tag}`), "match cidade lowercase → São Paulo", r3Names);
    assert(!r3Names.includes(`Obra RJ ${tag}`), "não traz RJ");

    console.log("\n[4] Filtros materiaisPor / tipo / modalidade");
    const r4a = await api(empCookie, "GET", "/api/obras?materiaisPor=empreiteiro&pageSize=100");
    const r4aNames: string[] = (r4a.json?.rows ?? []).map((o: any) => o.nome);
    assert(r4aNames.includes(`Obra SP B ${tag}`), "materiaisPor=empreiteiro pega SP B");
    assert(!r4aNames.includes(`Obra SP A ${tag}`), "exclui SP A (contratante)");

    const r4b = await api(empCookie, "GET", "/api/obras?tipo=construcao&pageSize=100");
    const r4bNames: string[] = (r4b.json?.rows ?? []).map((o: any) => o.nome);
    assert(r4bNames.includes(`Obra SP B ${tag}`) && !r4bNames.includes(`Obra SP A ${tag}`), "tipo=construcao filtra corretamente");

    const r4c = await api(empCookie, "GET", "/api/obras?modalidade=administracao&pageSize=100");
    const r4cNames: string[] = (r4c.json?.rows ?? []).map((o: any) => o.nome);
    assert(r4cNames.includes(`Obra RJ ${tag}`) && !r4cNames.includes(`Obra SP A ${tag}`), "modalidade=administracao filtra corretamente");

    console.log("\n[5/6/7] Anti-self + obra vinculada + rascunho ausentes do feed");
    const rFeed = await api(empCookie, "GET", "/api/obras?pageSize=100");
    const feedIds: string[] = (rFeed.json?.rows ?? []).map((o: any) => o.id);
    assert(!feedIds.includes(obraIds.candidatada), "[5] anti-self: candidatada some");
    assert(!feedIds.includes(obraIds.vinculada), "[6] obra vinculada some");
    assert(!feedIds.includes(obraIds.rascunho), "[7] rascunho não aparece");
    const feedSample = rFeed.json?.rows?.[0];
    assert(feedSample && feedSample.clienteId === undefined, "PII contratante sanitizada (sem clienteId)");

    console.log("\n[8] POST /obras-salvas idempotente");
    const sav1 = await api(empCookie, "POST", "/api/empreiteiro/obras-salvas", { obraId: obraIds.spA });
    const sav2 = await api(empCookie, "POST", "/api/empreiteiro/obras-salvas", { obraId: obraIds.spA });
    assert(sav1.status === 200 && sav2.status === 200, "ambos POST → 200", { s1: sav1.status, s2: sav2.status });
    const dup = await pool.query(
      `SELECT COUNT(*)::int AS c FROM obras_salvas WHERE user_id=$1 AND obra_id=$2`,
      [empUserId, obraIds.spA],
    );
    assert(dup.rows[0].c === 1, "DB tem exatamente 1 row", dup.rows[0]);

    console.log("\n[9] POST favoritar rascunho → 404");
    const savRasc = await api(empCookie, "POST", "/api/empreiteiro/obras-salvas", { obraId: obraIds.rascunho });
    assert(savRasc.status === 404, "rascunho → 404", savRasc.status);

    console.log("\n[10] DELETE fantasma → 200");
    const delGhost = await api(empCookie, "DELETE", `/api/empreiteiro/obras-salvas/${randomUUID()}`);
    assert(delGhost.status === 200, "delete fantasma → 200", delGhost.status);

    console.log("\n[11] GET /obras-salvas exclui pausadas/vinculadas/anti-self");
    // salvar a vinculada e a candidatada e a rj
    await pool.query(
      `INSERT INTO obras_salvas (user_id, obra_id) VALUES ($1,$2),($1,$3),($1,$4)
       ON CONFLICT DO NOTHING`,
      [empUserId, obraIds.vinculada, obraIds.candidatada, obraIds.rj],
    );
    const listed = await api(empCookie, "GET", "/api/empreiteiro/obras-salvas");
    const listedIds: string[] = (listed.json?.rows ?? []).map((o: any) => o.id);
    assert(listed.status === 200, "GET 200");
    assert(listedIds.includes(obraIds.spA), "spA salva aparece");
    assert(listedIds.includes(obraIds.rj), "rj salva aparece");
    assert(!listedIds.includes(obraIds.vinculada), "vinculada não aparece");
    assert(!listedIds.includes(obraIds.candidatada), "candidatada (anti-self) não aparece");

    console.log("\n[12] Contratante POST /obras-salvas → 403");
    const conSav = await api(conCookie, "POST", "/api/empreiteiro/obras-salvas", { obraId: obraIds.spA });
    assert(conSav.status === 403, "contratante → 403", conSav.status);
  } finally {
    console.log("\n[cleanup]");
    await pool.query(`DELETE FROM obras_salvas WHERE user_id=$1`, [empUserId]);
    await pool.query(`DELETE FROM candidaturas WHERE empreiteiro_id=$1 AND obra_id=$2`, [empUserId, obraIds.candidatada]);
    await pool.query(`DELETE FROM obras WHERE id = ANY($1::text[])`, [Object.values(obraIds)]);
    await pool.query(`DELETE FROM empreiteiras WHERE id=$1`, [fakeEmpreiteiraId]);
    await pool.query(`DELETE FROM users WHERE id=$1`, [fakeEmpreiteiraUserId]);
    await pool.end();
  }

  if (failures > 0) {
    console.log(`\n❌ ${failures} falha(s)`);
    process.exit(1);
  }
  console.log("\n✅ Todos os 12 critérios passaram.");
}

main().catch(async (err) => {
  console.error("[smoke #42] erro:", err);
  await pool.end().catch(() => {});
  process.exit(1);
});
