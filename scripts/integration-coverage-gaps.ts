/**
 * Gatilho de sugestão de testes de integração faltantes (Jornada 36 — Fase 5).
 *
 * Varre `app/api/**​/route.ts`, deriva cada endpoint (URL + métodos HTTP) e cruza
 * com os paths que os specs em `tests/e2e/**` já exercitam. Reporta os endpoints
 * ainda SEM cobertura de integração, priorizando:
 *   1. Mutações (POST/PATCH/PUT/DELETE) — mais risco de quebrar dados.
 *   2. Áreas sensíveis (auth, admin, chat, financeiro, obras, candidaturas,
 *      medições, pagamentos, webhooks, uploads).
 *
 * Não é um checador de cobertura de linha — é um radar de "endpoint crítico que
 * ninguém testa ainda". Heurístico por design: casa por substring de path, então
 * pode haver falso-positivo/negativo. Serve para SUGERIR o próximo teste a escrever.
 *
 * Uso:
 *   npm run test:integration:gaps
 *   npm run test:integration:gaps -- --all      (lista também os GET sem cobertura)
 *   npm run test:integration:gaps -- --json     (saída JSON para automação/hook)
 *
 * Exit code: 0 sempre (é um radar informativo, não um gate de CI). Para
 * transformar em gate, troque o exit final por process.exit(gaps.length ? 1 : 0).
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const API_DIR = join(ROOT, "app", "api");
const TESTS_DIR = join(ROOT, "tests", "e2e");

const MUTATION_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

// Áreas consideradas críticas (peso maior na priorização).
const CRITICAL_SEGMENTS = [
  "auth",
  "admin",
  "chat",
  "financeiro",
  "obras",
  "candidaturas",
  "medicoes",
  "pagamentos",
  "webhooks",
  "uploads",
  "assinaturas",
  "disputas",
];

// Endpoints test-only e utilitários que não precisam de teste de integração.
const IGNORED_SEGMENTS = ["/test/", "/[...nextauth]"];

interface Endpoint {
  url: string; // ex.: /api/obras/[id]
  methods: string[]; // ex.: ["GET","PATCH","DELETE"]
  file: string; // caminho relativo do route.ts
  critical: boolean;
  hasMutation: boolean;
}

/** Percorre recursivamente um diretório e retorna todos os caminhos de arquivo. */
function walk(dir: string): string[] {
  const out: string[] = [];
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

/** Deriva a URL do endpoint a partir do caminho do route.ts. */
function urlFromRouteFile(file: string): string {
  const rel = relative(API_DIR, file).split(sep).slice(0, -1).join("/"); // remove /route.ts
  return "/api" + (rel ? "/" + rel : "");
}

/** Extrai os métodos HTTP exportados de um route.ts. */
function methodsInFile(content: string): string[] {
  const re = /export\s+(?:async\s+)?function\s+(GET|POST|PATCH|PUT|DELETE|HEAD|OPTIONS)\b/g;
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) found.add(m[1]!);
  return [...found];
}

/** Coleta todos os endpoints reais da API. */
function collectEndpoints(): Endpoint[] {
  const files = walk(API_DIR).filter((f) => f.endsWith(`${sep}route.ts`) || f.endsWith("/route.ts"));
  const endpoints: Endpoint[] = [];
  for (const file of files) {
    const url = urlFromRouteFile(file);
    if (IGNORED_SEGMENTS.some((seg) => (url + "/").includes(seg))) continue;
    const content = readFileSync(file, "utf8");
    const methods = methodsInFile(content).filter((x) => x !== "HEAD" && x !== "OPTIONS");
    if (methods.length === 0) continue;
    const critical = CRITICAL_SEGMENTS.some((seg) => url.split("/").includes(seg));
    const hasMutation = methods.some((x) => MUTATION_METHODS.has(x));
    endpoints.push({ url, methods, file: relative(ROOT, file), critical, hasMutation });
  }
  return endpoints;
}

/** Concatena o texto de todos os specs de teste (para casar paths por substring). */
function readAllTestText(): string {
  const files = walk(TESTS_DIR).filter((f) => f.endsWith(".spec.ts") || f.endsWith(".ts"));
  return files.map((f) => readFileSync(f, "utf8")).join("\n");
}

/**
 * Um endpoint é considerado "coberto" se seu path (com os segmentos dinâmicos
 * [x] transformados em curinga) aparece em algum spec. Heurística por regex.
 */
function isCovered(url: string, testText: string): boolean {
  // /api/obras/[id] → /api/obras/[^"'`\s]+  (casa /api/obras/<qualquer-id>)
  const pattern = url
    .split("/")
    .map((seg) => (seg.startsWith("[") ? "[^/\"'`\\s?]+" : seg.replace(/[.*+?^${}()|\\]/g, "\\$&")))
    .join("/");
  // casa o path exato OU com querystring/subpath logo após.
  const re = new RegExp(pattern + "(?:[\"'`/?]|$)");
  return re.test(testText);
}

function main(): void {
  const args = process.argv.slice(2);
  const includeGets = args.includes("--all");
  const asJson = args.includes("--json");

  const endpoints = collectEndpoints();
  const testText = readAllTestText();

  const gaps = endpoints
    .filter((e) => !isCovered(e.url, testText))
    .filter((e) => (includeGets ? true : e.hasMutation || e.critical));

  // Priorização: crítico+mutação > mutação > crítico > resto; depois alfabético.
  const score = (e: Endpoint) => (e.critical ? 2 : 0) + (e.hasMutation ? 1 : 0);
  gaps.sort((a, b) => score(b) - score(a) || a.url.localeCompare(b.url));

  if (asJson) {
    console.log(JSON.stringify({ total: endpoints.length, gaps }, null, 2));
    return;
  }

  const covered = endpoints.length - gaps.length;
  console.log("");
  console.log("🔎 Radar de cobertura de integração (Jornada 36 — Fase 5)");
  console.log(`   Endpoints na API: ${endpoints.length}`);
  console.log(`   Sem cobertura de integração (mutação/crítico): ${gaps.length}`);
  console.log(`   (use --all para incluir GETs; --json para saída de máquina)`);
  console.log("");

  if (gaps.length === 0) {
    console.log("✅ Nenhum endpoint crítico/mutação sem cobertura detectado. Bom trabalho!");
    return;
  }

  console.log("   Sugestões priorizadas (mais crítico primeiro):");
  console.log("   ─────────────────────────────────────────────");
  for (const e of gaps.slice(0, 40)) {
    const tag = [e.critical ? "CRÍTICO" : "", e.hasMutation ? "MUTAÇÃO" : "leitura"]
      .filter(Boolean)
      .join(" · ");
    console.log(`   • ${e.methods.join("/").padEnd(16)} ${e.url}`);
    console.log(`     ${tag}  —  ${e.file}`);
  }
  if (gaps.length > 40) console.log(`   … e mais ${gaps.length - 40} endpoint(s).`);
  console.log("");
  console.log("   Dica: escreva o spec em tests/e2e/integration/ seguindo os padrões");
  console.log("   já existentes (login-as, cleanup por nome 'E2E', asserts de status + estado).");
}

main();
