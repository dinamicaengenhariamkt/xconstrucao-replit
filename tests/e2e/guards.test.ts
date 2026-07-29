/**
 * Testes unitários para os guards anti-produção de `tests/e2e/guards.ts`.
 *
 * Cobertura:
 *   - inspecionarDatabaseUrl: garante que URLs de dev passam e URLs de prod
 *     são bloqueadas (incluindo hosts desconhecidos sem E2E_ALLOW_ANY_DB).
 *   - inspecionarPaymentGateway: garante que apenas undefined/""/manual passam
 *     e que qualquer gateway real ("asaas", "ASAAS", "stripe", etc.) aborta.
 *
 * Executor: `node:test` (built-in no Node 20) + tsx para TypeScript.
 * Rodar: npx tsx --test tests/e2e/guards.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  inspecionarDatabaseUrl,
  inspecionarPaymentGateway,
} from "./guards.js";

// ---------------------------------------------------------------------------
// inspecionarDatabaseUrl
// ---------------------------------------------------------------------------

describe("inspecionarDatabaseUrl", () => {
  it("bloqueia quando DATABASE_URL é undefined", () => {
    const result = inspecionarDatabaseUrl(undefined);
    assert.equal(result.ok, false);
  });

  it("bloqueia quando DATABASE_URL é string vazia", () => {
    const result = inspecionarDatabaseUrl("");
    assert.equal(result.ok, false);
  });

  it("permite localhost", () => {
    const result = inspecionarDatabaseUrl(
      "postgresql://user:pass@localhost:5432/mydb",
    );
    assert.equal(result.ok, true);
  });

  it("permite 127.0.0.1", () => {
    const result = inspecionarDatabaseUrl(
      "postgresql://user:pass@127.0.0.1:5432/mydb",
    );
    assert.equal(result.ok, true);
  });

  it("permite host 'helium' (banco de dev do Replit)", () => {
    const result = inspecionarDatabaseUrl(
      "postgresql://user:pass@helium:5432/mydb",
    );
    assert.equal(result.ok, true);
  });

  it("bloqueia host com 'prod' no nome", () => {
    const result = inspecionarDatabaseUrl(
      "postgresql://user:pass@prod-db.example.com:5432/mydb",
    );
    assert.equal(result.ok, false);
    assert.ok("reason" in result);
    assert.match(result.reason, /prod/i);
  });

  it("bloqueia host com 'production' no nome", () => {
    const result = inspecionarDatabaseUrl(
      "postgresql://user:pass@production.db.example.com:5432/mydb",
    );
    assert.equal(result.ok, false);
  });

  it("bloqueia host desconhecido sem E2E_ALLOW_ANY_DB", () => {
    const original = process.env.E2E_ALLOW_ANY_DB;
    delete process.env.E2E_ALLOW_ANY_DB;
    try {
      const result = inspecionarDatabaseUrl(
        "postgresql://user:pass@neon.tech:5432/mydb",
      );
      assert.equal(result.ok, false);
    } finally {
      if (original !== undefined) process.env.E2E_ALLOW_ANY_DB = original;
    }
  });

  it("permite host desconhecido quando E2E_ALLOW_ANY_DB=1", () => {
    const original = process.env.E2E_ALLOW_ANY_DB;
    process.env.E2E_ALLOW_ANY_DB = "1";
    try {
      const result = inspecionarDatabaseUrl(
        "postgresql://user:pass@neon.tech:5432/mydb",
      );
      assert.equal(result.ok, true);
    } finally {
      if (original !== undefined) process.env.E2E_ALLOW_ANY_DB = original;
      else delete process.env.E2E_ALLOW_ANY_DB;
    }
  });

  // ── Regressão: hosts gerenciados não podem passar como "dev" ──────────────
  //
  // A allowlist casava por PREFIXO (`host.startsWith("db.")`), pensando em
  // subdomínios de docker-compose. Efeito colateral grave: o host padrão do
  // Supabase é `db.<projeto>.supabase.co` — um banco de PRODUÇÃO era
  // classificado como desenvolvimento. `pareceProducao()` retornava false,
  // `scripts/limpar-base.ts` não exigia a segunda confirmação, e esta suíte
  // rodaria contra a base real. Agora a comparação é por host exato.

  it("bloqueia host Supabase (db.<projeto>.supabase.co) — não é dev", () => {
    const original = process.env.E2E_ALLOW_ANY_DB;
    delete process.env.E2E_ALLOW_ANY_DB;
    try {
      const result = inspecionarDatabaseUrl(
        "postgresql://postgres:senha@db.abcdefgh.supabase.co:5432/postgres",
      );
      assert.equal(
        result.ok,
        false,
        "host Supabase de produção não pode ser tratado como banco de dev",
      );
    } finally {
      if (original !== undefined) process.env.E2E_ALLOW_ANY_DB = original;
    }
  });

  it("bloqueia host com prefixo 'postgres.' (ex.: postgres.railway.internal)", () => {
    const original = process.env.E2E_ALLOW_ANY_DB;
    delete process.env.E2E_ALLOW_ANY_DB;
    try {
      const result = inspecionarDatabaseUrl(
        "postgresql://user:pass@postgres.railway.internal:5432/railway",
      );
      assert.equal(result.ok, false);
    } finally {
      if (original !== undefined) process.env.E2E_ALLOW_ANY_DB = original;
    }
  });

  it("continua permitindo os hosts de dev exatos (docker-compose)", () => {
    for (const host of ["postgres", "db"]) {
      const result = inspecionarDatabaseUrl(
        `postgresql://user:pass@${host}:5432/app`,
      );
      assert.equal(result.ok, true, `host "${host}" deve ser reconhecido como dev`);
    }
  });
});

// ---------------------------------------------------------------------------
// inspecionarPaymentGateway
// ---------------------------------------------------------------------------

describe("inspecionarPaymentGateway", () => {
  it("permite undefined (gateway não configurado)", () => {
    const result = inspecionarPaymentGateway(undefined);
    assert.equal(result.ok, true);
  });

  it("permite string vazia", () => {
    const result = inspecionarPaymentGateway("");
    assert.equal(result.ok, true);
  });

  it("permite 'manual' (gateway seguro para testes)", () => {
    const result = inspecionarPaymentGateway("manual");
    assert.equal(result.ok, true);
  });

  it("bloqueia 'asaas' (gateway real — minúsculas)", () => {
    const result = inspecionarPaymentGateway("asaas");
    assert.equal(result.ok, false);
    assert.ok("reason" in result);
    assert.match(result.reason, /asaas/i);
  });

  it("bloqueia 'ASAAS' (gateway real — maiúsculas, case-insensitive)", () => {
    const result = inspecionarPaymentGateway("ASAAS");
    assert.equal(result.ok, false);
    assert.ok("reason" in result);
  });

  it("bloqueia 'Asaas' (gateway real — capitalizado)", () => {
    const result = inspecionarPaymentGateway("Asaas");
    assert.equal(result.ok, false);
  });

  it("bloqueia 'stripe' (qualquer gateway que não seja 'manual')", () => {
    const result = inspecionarPaymentGateway("stripe");
    assert.equal(result.ok, false);
    assert.ok("reason" in result);
    assert.match(result.reason, /manual/i);
  });

  it("bloqueia 'STRIPE' (case-insensitive)", () => {
    const result = inspecionarPaymentGateway("STRIPE");
    assert.equal(result.ok, false);
  });

  it("bloqueia valor desconhecido arbitrário", () => {
    const result = inspecionarPaymentGateway("paypal");
    assert.equal(result.ok, false);
  });

  it("reason do bloqueio menciona o gateway original (não normalizado)", () => {
    const result = inspecionarPaymentGateway("ASAAS");
    assert.equal(result.ok, false);
    assert.ok("reason" in result);
    assert.ok(
      result.reason.includes("ASAAS"),
      `reason deve citar o valor original "ASAAS"; obtido: "${result.reason}"`,
    );
  });
});
