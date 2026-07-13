import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface R2Config {
  accountId: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
}

let cachedClient: S3Client | null = null;
let cachedConfig: R2Config | null = null;

function loadConfig(): R2Config {
  if (cachedConfig) return cachedConfig;
  const required = {
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_S3_ENDPOINT: process.env.R2_S3_ENDPOINT,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: process.env.R2_BUCKET,
    R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
  };
  const missing = Object.entries(required)
    .filter(([, v]) => !v || !String(v).trim())
    .map(([k]) => k);
  if (missing.length > 0) {
    throw new Error(
      `[storage/r2] Secrets ausentes: ${missing.join(", ")}. ` +
        `Configure em Replit Secrets (e Deployments) antes de usar uploads.`,
    );
  }
  cachedConfig = {
    accountId: required.R2_ACCOUNT_ID!,
    endpoint: required.R2_S3_ENDPOINT!.replace(/\/+$/, ""),
    accessKeyId: required.R2_ACCESS_KEY_ID!,
    secretAccessKey: required.R2_SECRET_ACCESS_KEY!,
    bucket: required.R2_BUCKET!,
    publicBaseUrl: required.R2_PUBLIC_BASE_URL!.replace(/\/+$/, ""),
  };
  return cachedConfig;
}

export function getR2Client(): { client: S3Client; config: R2Config } {
  const config = loadConfig();
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      // R2 rejeita os headers de checksum que o SDK v3 ≥ 3.1045 injeta por
      // padrão (x-amz-checksum-crc32 / x-amz-sdk-checksum-algorithm).
      // "WHEN_REQUIRED" desativa o envio automático sem quebrar objetos que
      // realmente exijam checksum.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  return { client: cachedClient, config };
}

export function publicUrlForKey(key: string): string {
  const { config } = getR2Client();
  return `${config.publicBaseUrl}/${key}`;
}

/**
 * Cria URL assinada PUT para upload direto do browser.
 * Header Content-Type é obrigatório no PUT do client.
 */
export async function createSignedUploadUrl(args: {
  key: string;
  mime: string;
  expiresIn?: number;
}): Promise<string> {
  const { client, config } = getR2Client();
  const cmd = new PutObjectCommand({
    Bucket: config.bucket,
    Key: args.key,
    ContentType: args.mime,
  });
  return getSignedUrl(client, cmd, { expiresIn: args.expiresIn ?? 5 * 60 });
}

export async function createSignedReadUrl(args: {
  key: string;
  expiresIn?: number;
  filename?: string;
}): Promise<string> {
  const { client, config } = getR2Client();
  const cmd = new GetObjectCommand({
    Bucket: config.bucket,
    Key: args.key,
    ResponseContentDisposition: args.filename
      ? `attachment; filename="${encodeURIComponent(args.filename)}"`
      : undefined,
  });
  return getSignedUrl(client, cmd, { expiresIn: args.expiresIn ?? 15 * 60 });
}

export async function deleteObject(key: string): Promise<void> {
  const { client, config } = getR2Client();
  await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
}

export async function headObject(key: string): Promise<{ size: number; contentType: string | null } | null> {
  const { client, config } = getR2Client();
  try {
    const out = await client.send(new HeadObjectCommand({ Bucket: config.bucket, Key: key }));
    return { size: out.ContentLength ?? 0, contentType: out.ContentType ?? null };
  } catch (err) {
    const status = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
    if (status === 404 || status === 403) return null;
    throw err;
  }
}

export function isStorageConfigured(): boolean {
  try {
    loadConfig();
    return true;
  } catch {
    return false;
  }
}
