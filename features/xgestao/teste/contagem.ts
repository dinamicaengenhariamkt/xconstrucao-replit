/** Relógio regressivo da faixa do teste: "12d 04h 31min"; nas últimas 24h, "04h 31min 09s". */
export function formatarContagem(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const dias = Math.floor(total / 86_400);
  const horas = Math.floor((total % 86_400) / 3_600);
  const minutos = Math.floor((total % 3_600) / 60);
  const segundos = total % 60;
  const dd = (n: number) => String(n).padStart(2, '0');
  return dias > 0
    ? `${dias}d ${dd(horas)}h ${dd(minutos)}min`
    : `${dd(horas)}h ${dd(minutos)}min ${dd(segundos)}s`;
}
