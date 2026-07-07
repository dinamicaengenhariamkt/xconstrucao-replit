/**
 * Gera e dispara o download de um arquivo CSV no browser.
 *
 * - Escapa aspas duplas (RFC 4180) e envolve cada célula em aspas.
 * - Prefixa BOM UTF-8 para o Excel reconhecer acentuação pt-BR.
 *
 * Client-side apenas (usa `Blob`/`URL`/`document`).
 */
export function downloadCSV(filename: string, headers: string[], rows: string[][]): void {
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
