/**
 * XG36 — CSV para o Excel em pt-BR: separador `;`, decimal com vírgula e BOM
 * UTF-8 (sem ele o Excel abre acentos quebrados).
 */
export type CelulaCsv = string | number | null | undefined;

function celula(valor: CelulaCsv): string {
  if (valor === null || valor === undefined) return '';
  const texto = typeof valor === 'number' ? String(valor).replace('.', ',') : valor;
  // Neutraliza injeção de fórmula ao abrir no Excel (=, +, -, @ no início).
  const seguro = /^[=+\-@]/.test(texto) && typeof valor !== 'number' ? `'${texto}` : texto;
  return /[;"\n\r]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
}

export function montarCsv(cabecalho: string[], linhas: CelulaCsv[][]): string {
  return '﻿' + [cabecalho, ...linhas].map((linha) => linha.map(celula).join(';')).join('\r\n');
}

export function dataBr(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}
