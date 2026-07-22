export function unformatCep(cep: string): string {
  return (cep || "").replace(/\D/g, "").slice(0, 8);
}

export function formatCep(cep: string): string {
  const d = unformatCep(cep);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function isCepValid(cep: string): boolean {
  return unformatCep(cep).length === 8;
}

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export interface CepLookupResult {
  cep: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export async function lookupCep(cep: string, signal?: AbortSignal): Promise<CepLookupResult | null> {
  const digits = unformatCep(cep);
  if (digits.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal });
    if (!res.ok) return null;
    const data = (await res.json()) as ViaCepResponse;
    if (data.erro) return null;
    return {
      cep: formatCep(digits),
      endereco: [data.logradouro, data.bairro].filter(Boolean).join(", "),
      bairro: data.bairro || "",
      cidade: data.localidade || "",
      estado: data.uf || "",
    };
  } catch {
    return null;
  }
}

export function unformatPhone(v: string): string {
  return (v || "").replace(/\D/g, "").slice(0, 11);
}

export function formatPhone(v: string): string {
  const d = unformatPhone(v);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function isPhoneValid(v: string): boolean {
  const d = unformatPhone(v);
  return d.length === 10 || d.length === 11;
}

/* ── CPF ── */
export function unformatCpf(v: string): string {
  return (v || "").replace(/\D/g, "").slice(0, 11);
}

export function formatCpf(v: string): string {
  const d = unformatCpf(v);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function isCpfValid(v: string): boolean {
  const d = unformatCpf(v);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  const calc = (slice: number) => {
    let sum = 0;
    for (let i = 0; i < slice; i++) sum += parseInt(d[i], 10) * (slice + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === parseInt(d[9], 10) && calc(10) === parseInt(d[10], 10);
}

/* ── CNPJ ── */
export function unformatCnpj(v: string): string {
  return (v || "").replace(/\D/g, "").slice(0, 14);
}

export function formatCnpj(v: string): string {
  const d = unformatCnpj(v);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function isCnpjValid(v: string): boolean {
  const d = unformatCnpj(v);
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;
  const calc = (length: number) => {
    const weights = length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < length; i++) sum += parseInt(d[i], 10) * weights[i];
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === parseInt(d[12], 10) && calc(13) === parseInt(d[13], 10);
}

/* ── CPF/CNPJ unificado ── */
export function formatCpfCnpj(v: string): string {
  const d = (v || "").replace(/\D/g, "");
  return d.length <= 11 ? formatCpf(v) : formatCnpj(v);
}

export function unformatCpfCnpj(v: string): string {
  return (v || "").replace(/\D/g, "").slice(0, 14);
}

/**
 * Valida CPF ou CNPJ de forma unificada, decidindo pelo comprimento dos
 * dígitos (≤11 → CPF, senão CNPJ). Reaproveita os validadores de dígito
 * verificador acima. Usado no cadastro e em Configurações.
 */
export function isCpfCnpjValid(v: string): boolean {
  const d = unformatCpfCnpj(v);
  return d.length <= 11 ? isCpfValid(d) : isCnpjValid(d);
}
