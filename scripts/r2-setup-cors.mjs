/**
 * Configura a política CORS do bucket R2 para permitir uploads diretos do browser.
 *
 * Uso:
 *   node scripts/r2-setup-cors.mjs
 *
 * Requer as variáveis de ambiente R2_* (pode usar dotenv-cli ou definir no shell).
 *
 * O CORS correto é essencial: sem ele, o browser não lê a resposta de erro do
 * PUT cross-origin (aparece como "Falha de rede" em vez de status 4xx legível).
 */

import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET     = process.env.R2_BUCKET;
const ENDPOINT   = process.env.R2_S3_ENDPOINT;

if (!ACCOUNT_ID || !ACCESS_KEY || !SECRET_KEY || !BUCKET || !ENDPOINT) {
  console.error("❌ Configure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_S3_ENDPOINT.");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: ENDPOINT,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

// Origens permitidas (dev + produção). Ajuste a prod URL conforme necessário.
const ALLOWED_ORIGINS = [
  "https://xconstrucao.replit.app",
  "https://*.replit.dev",
  "http://localhost:5000",
  "http://localhost:3000",
  "https://xconstrucao-app.dinamicareforma.com.br",
];

const corsRules = [
  {
    AllowedOrigins: ALLOWED_ORIGINS,
    AllowedMethods: ["PUT", "GET", "HEAD"],
    AllowedHeaders: ["Content-Type", "Content-Length", "x-amz-*"],
    ExposeHeaders: ["ETag"],
    MaxAgeSeconds: 3600,
  },
];

console.log("🔧 Aplicando política CORS no bucket:", BUCKET);
console.log("   Origens:", ALLOWED_ORIGINS.join(", "));

try {
  await client.send(
    new PutBucketCorsCommand({
      Bucket: BUCKET,
      CORSConfiguration: { CORSRules: corsRules },
    }),
  );
  console.log("✅ CORS aplicado com sucesso.");

  // Verificação: lê de volta para confirmar.
  const result = await client.send(new GetBucketCorsCommand({ Bucket: BUCKET }));
  console.log("📋 CORS atual:", JSON.stringify(result.CORSRules, null, 2));
} catch (err) {
  console.error("❌ Erro ao aplicar CORS:", err.name, err.message);
  process.exit(1);
}
