import { ZONAS, isZonaValida } from "@features/anuncios/anuncios-service";

/**
 * J23 — Precificação de protótipo do self-service de anúncios.
 *
 * Valores SIMULADOS por zona (preço por dia) — placeholders editáveis. A cobrança
 * real (J31) substituirá esta tabela pela do gateway/catálogo comercial. A UI deve
 * deixar claro que o valor é simulação até a J31 entrar.
 *
 * Decisão aberta documentada em §13 da jornada: valores definitivos com os sócios.
 */

// Preço-base por dia, por zona (R$). Zonas premium (vitrine da home, banners)
// custam mais que sidebars. Valores ilustrativos.
const PRECO_DIA_POR_ZONA: Record<string, number> = {
  "home-mercado": 80,
  "banner-dashboard-contratante": 60,
  "banner-dashboard-empreiteiro": 60,
  "banner-qa": 50,
  "sidebar-sup-contratante": 30,
  "sidebar-inf-contratante": 25,
  "sidebar-sup-empreiteiro": 30,
  "sidebar-inf-empreiteiro": 25,
};

const PRECO_DIA_PADRAO = 30;
const MIN_DIAS = 1;
const MAX_DIAS = 365;

/**
 * Dias inclusivos entre duas datas ISO (yyyy-mm-dd). Sem período → 30 dias.
 *
 * NOTA (protótipo): período é opcional no self-service; quando ausente, assume-se
 * 30 dias para precificar, e o anúncio é materializado sem data-fim (veiculação
 * contínua). A J31 (cobrança real) deve tornar o período OBRIGATÓRIO — é validação
 * de app, não muda schema. Ver docs/jornadas/23-...md §14 e 31-pagamento-anuncios.md.
 */
export function calcularDias(periodoInicio?: string | null, periodoFim?: string | null): number {
  if (!periodoInicio || !periodoFim) return 30;
  const ini = Date.parse(periodoInicio);
  const fim = Date.parse(periodoFim);
  if (Number.isNaN(ini) || Number.isNaN(fim) || fim < ini) return 30;
  const dias = Math.floor((fim - ini) / 86_400_000) + 1;
  return Math.min(MAX_DIAS, Math.max(MIN_DIAS, dias));
}

/** Preço de um slot = preço/dia da zona × dias do período. Zona inválida → 0. */
export function precoSlot(zona: string, periodoInicio?: string | null, periodoFim?: string | null): number {
  if (!isZonaValida(zona)) return 0;
  const precoDia = PRECO_DIA_POR_ZONA[zona] ?? PRECO_DIA_PADRAO;
  const dias = calcularDias(periodoInicio, periodoFim);
  return Math.round(precoDia * dias * 100) / 100;
}

export interface PrecoZonaView {
  zona: string;
  nome: string;
  precoDia: number;
  multiplo: boolean;
  templates: string[];
}

/** Tabela de preços por zona para alimentar o checkout (GET /api/anuncios/precos). */
export function tabelaPrecos(): PrecoZonaView[] {
  return ZONAS.map((z) => ({
    zona: z.id,
    nome: z.nome,
    precoDia: PRECO_DIA_POR_ZONA[z.id] ?? PRECO_DIA_PADRAO,
    multiplo: (z as { multiplo?: boolean }).multiplo === true,
    templates: [...((z as { templates?: readonly string[] }).templates ?? [])],
  }));
}
