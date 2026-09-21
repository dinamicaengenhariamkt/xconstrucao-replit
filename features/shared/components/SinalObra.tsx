'use client';

import { cn } from '@shared/lib/utils';
import type { Semaforo } from '@features/xgestao/lib/indicadores-obra';

/**
 * XG29 — um sinal de obra: a cor diz o estado de relance, o texto diz o número.
 *
 * Nasceu dentro do `XGestaoDashboard` na XG27 e saiu de lá quando o card da
 * listagem precisou do mesmo sinal. Ficar em dois lugares significaria duas
 * paletas divergindo com o tempo, e o ponto destes indicadores é justamente
 * que dashboard e listagem digam a mesma coisa da mesma forma.
 *
 * **Os tons são os de `HEALTH_DOT_CLASSES`, copiados e não importados.**
 * Reusar o módulo de saúde traria junto o vocabulário "SAUDÁVEL/ATENÇÃO/RISCO"
 * que a XG17 removeu do xgestão por ser ilegível para o dono da obra — e que a
 * XG29 acabou de tirar deste mesmo card. Volta a paleta, não a régua.
 */
const SEMAFORO_DOT: Record<Semaforo, string> = {
  ok: 'bg-green-500',
  atencao: 'bg-amber-500',
  critico: 'bg-red-500',
  sem_dado: 'bg-gray-300 dark:bg-gray-600',
};

/**
 * O ponto é `aria-hidden` porque o significado inteiro está no texto ao lado.
 * Cor pura obrigaria o dono da obra a decorar a régua por trás, que foi o
 * defeito que tirou a Saúde do produto.
 */
export function SinalObra({
  estado,
  className,
  children,
}: {
  estado: Semaforo;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
      <span aria-hidden className={cn('size-2 shrink-0 rounded-full', SEMAFORO_DOT[estado])} />
      {children}
    </span>
  );
}

/** "No prazo" ou "Atrasada há N dias" — o texto que acompanha o sinal de prazo. */
export function textoPrazo(diasAtraso: number): string {
  return diasAtraso > 0
    ? `Atrasada há ${diasAtraso} dia${diasAtraso > 1 ? 's' : ''}`
    : 'No prazo';
}

/**
 * "N% do orçamento", ou o aviso de que não há orçamento lançado.
 *
 * Sem denominador não há percentual: dizer 0% afirmaria uma folga que ninguém
 * verificou.
 */
export function textoOrcamento(consumoOrcamento: number | null, curto = false): string {
  if (consumoOrcamento === null) return curto ? 'Não lançado' : 'Orçamento não lançado';
  return `${consumoOrcamento}% do orçamento`;
}
