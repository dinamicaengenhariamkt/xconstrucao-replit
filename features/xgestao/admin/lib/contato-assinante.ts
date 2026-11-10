/**
 * CRM-01/CRM-07 — contato do assinante no admin, em regras puras: telefone para
 * o WhatsApp, link de e-mail, máscaras e a validação do registro de contato.
 * A tela, a rota e o CSV leem daqui; os testes unitários exercitam direto.
 */

export function somenteDigitos(valor: string | null | undefined): string {
  return (valor ?? '').replace(/\D/g, '');
}

/**
 * Número nacional (DDD + telefone, 10 ou 11 dígitos) a partir do que foi
 * digitado, aceitando +55, 0 de longa distância e máscara. `null` quando não é
 * um telefone brasileiro válido (DDD 11 a 99; celular de 11 dígitos começa com 9).
 */
export function telefoneNacional(valor: string | null | undefined): string | null {
  let d = somenteDigitos(valor);
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (d.length !== 10 && d.length !== 11) return null;
  if (d[0] === '0' || d[1] === '0') return null;
  if (d.length === 11 && d[2] !== '9') return null;
  return d;
}

/** `https://wa.me/55<dígitos>` ou `null` sem telefone válido. */
export function linkWhatsapp(valor: string | null | undefined): string | null {
  const d = telefoneNacional(valor);
  return d ? `https://wa.me/55${d}` : null;
}

/** `mailto:` só para um e-mail com cara de e-mail. */
export function linkEmail(email: string | null | undefined): string | null {
  const limpo = (email ?? '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpo) ? `mailto:${limpo}` : null;
}

/** "(11) 91234-5678"; fora do padrão, devolve o texto como veio. */
export function formatarTelefone(valor: string | null | undefined): string {
  const d = telefoneNacional(valor);
  if (!d) return (valor ?? '').trim();
  return d.length === 11
    ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
}

/** CPF "000.000.000-00" ou CNPJ "00.000.000/0000-00"; fora disso, como veio. */
export function formatarDocumento(valor: string | null | undefined): string {
  const d = somenteDigitos(valor);
  if (d.length === 11) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length === 14) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  return (valor ?? '').trim();
}

// ── Registro de contato (CRM-07) ────────────────────────────────────────────

export const CANAIS_CONTATO = ['whatsapp', 'email', 'telefone', 'outro'] as const;
export type CanalContato = (typeof CANAIS_CONTATO)[number];

export const ROTULO_CANAL_CONTATO: Record<CanalContato, string> = {
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  telefone: 'Telefone',
  outro: 'Outro',
};

export const NOTA_CONTATO_MAX = 1000;

export function isCanalContato(valor: unknown): valor is CanalContato {
  return typeof valor === 'string' && (CANAIS_CONTATO as readonly string[]).includes(valor);
}

export function validarRegistroContato(
  entrada: unknown,
): { ok: true; canal: CanalContato; nota: string | null } | { ok: false; erro: string } {
  const dados = (entrada && typeof entrada === 'object' ? entrada : {}) as Record<string, unknown>;
  if (!isCanalContato(dados.canal)) return { ok: false, erro: 'Escolha o canal: WhatsApp, e-mail, telefone ou outro.' };
  if (dados.nota !== undefined && dados.nota !== null && typeof dados.nota !== 'string') {
    return { ok: false, erro: 'A nota deve ser texto.' };
  }
  const nota = typeof dados.nota === 'string' ? dados.nota.trim() : '';
  if (nota.length > NOTA_CONTATO_MAX) return { ok: false, erro: `A nota pode ter até ${NOTA_CONTATO_MAX} caracteres.` };
  return { ok: true, canal: dados.canal, nota: nota || null };
}
