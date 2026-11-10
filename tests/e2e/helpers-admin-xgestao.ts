import { expect, type APIRequestContext } from '@playwright/test';

/**
 * TST-19 — números globais do admin xgestão mudam enquanto outros specs criam
 * contas em paralelo, então "depois - antes" não mede só a conta do teste.
 *
 * `contribuicaoDaConta` mede exatamente o peso de UMA conta nos números: lê,
 * marca a conta como interna (ADM-02: sai de todas as métricas), lê de novo,
 * desmarca e lê pela terceira vez. Só aceita a medida quando a 1ª e a 3ª
 * leitura batem (janela em que ninguém mais mexeu); senão repete.
 */
export type Numeros = Record<string, number>;

export async function getJsonAdmin(ctx: APIRequestContext, url: string): Promise<Record<string, any>> {
  const r = await ctx.get(url);
  expect(r.status(), await r.text()).toBe(200);
  return r.json();
}

export async function marcarContaInterna(adminCtx: APIRequestContext, userId: string, contaInterna: boolean) {
  const r = await adminCtx.patch(`/api/admin/xgestao/assinantes/${userId}`, { data: { contaInterna } });
  expect(r.status(), await r.text()).toBe(200);
  return r.json() as Promise<{ contaInterna: boolean; alterou: boolean }>;
}

const arred = (v: number) => Math.round(v * 100) / 100;

export async function contribuicaoDaConta(
  adminCtx: APIRequestContext,
  userId: string,
  ler: () => Promise<Numeros>,
  opcoes: { timeout?: number } = {},
): Promise<Numeros> {
  let contribuicao: Numeros = {};
  try {
    await expect(async () => {
      const com = await ler();
      await marcarContaInterna(adminCtx, userId, true);
      let sem: Numeros;
      try {
        sem = await ler();
      } finally {
        await marcarContaInterna(adminCtx, userId, false);
      }
      const comDeNovo = await ler();
      // Janela quieta: ninguém mais mudou os números entre a 1ª e a 3ª leitura.
      expect(comDeNovo).toEqual(com);
      contribuicao = Object.fromEntries(Object.keys(com).map((k) => [k, arred((com[k] ?? 0) - (sem[k] ?? 0))]));
    }).toPass({ timeout: opcoes.timeout ?? 60_000, intervals: [250, 500, 1_000, 2_000] });
  } finally {
    await marcarContaInterna(adminCtx, userId, false).catch(() => undefined);
  }
  return contribuicao;
}

/** Compara duas leituras que só podem divergir por escrita concorrente: repete até baterem. */
export async function leiturasBatem<T>(ler: () => Promise<[T, T]>, timeout = 30_000) {
  await expect(async () => {
    const [a, b] = await ler();
    expect(a as unknown).toEqual(b as unknown);
  }).toPass({ timeout, intervals: [250, 500, 1_000] });
}
