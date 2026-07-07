/**
 * Scrubbing de PII para eventos Sentry.
 * Remove CPF, e-mail, senhas, tokens e cookies antes do envio.
 */

const CPF_FORMATTED = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g;
const CPF_RAW = /(?<![0-9])\d{11}(?![0-9])/g;
const EMAIL = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const SENSITIVE_KEYS = /(password|senha|token|secret|authorization|cookie|cpf|cnpj|api[_-]?key)/i;

function scrubString(value: string): string {
  return value
    .replace(CPF_FORMATTED, "[CPF]")
    .replace(CPF_RAW, "[CPF_RAW]")
    .replace(EMAIL, "[EMAIL]");
}

function scrubValue(value: unknown, key?: string): unknown {
  if (key && SENSITIVE_KEYS.test(key)) return "[REDACTED]";
  if (typeof value === "string") return scrubString(value);
  if (Array.isArray(value)) return value.map((v) => scrubValue(v));
  if (value !== null && typeof value === "object") return scrubObject(value as Record<string, unknown>);
  return value;
}

function scrubObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    result[k] = scrubValue(v, k);
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function scrubEvent(event: any): any {
  if (!event || typeof event !== "object") return event;
  try {
    return scrubObject(event as Record<string, unknown>);
  } catch {
    return null;
  }
}
