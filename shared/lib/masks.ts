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
