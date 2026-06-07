'use client';

import type { AdCreativeProps, BlocoDado } from '../types';

interface Conteudo {
  fonte?: string;
  atualizadoEm?: string;
  blocos?: BlocoDado[];
}

const tendenciaCor: Record<NonNullable<BlocoDado['tendencia']>, string> = {
  up: 'text-green-500',
  down: 'text-red-500',
  flat: 'text-slate-400',
};
const tendenciaSeta: Record<NonNullable<BlocoDado['tendencia']>, string> = {
  up: '▲',
  down: '▼',
  flat: '—',
};

/**
 * Template `destaque-dados` (J24) — card de blocos de dados (rótulo + valor +
 * variação/tendência). Substitui o widget de cotações antes hardcoded na home.
 * Sem integração de bolsa: os blocos são preenchidos manualmente pelo admin.
 */
export function DestaqueDadosTemplate({ titulo, conteudo }: AdCreativeProps) {
  const c = (conteudo ?? {}) as Conteudo;
  const blocos = c.blocos ?? [];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-lg p-6">
      {titulo && (
        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">{titulo}</h3>
      )}

      <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800 flex-1">
        {blocos.map((b, i) => (
          <div key={i} className="flex items-center justify-between py-3 gap-3">
            <span className="text-slate-700 dark:text-slate-300 text-sm">{b.rotulo}</span>
            <div className="flex items-center gap-2 text-right">
              <span className="text-slate-900 dark:text-slate-100 font-semibold text-sm">{b.valor}</span>
              {b.variacao && (
                <span className={`text-xs font-bold flex items-center gap-1 ${tendenciaCor[b.tendencia ?? 'flat']}`}>
                  <span>{tendenciaSeta[b.tendencia ?? 'flat']}</span>
                  {b.variacao}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {(c.atualizadoEm || c.fonte) && (
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
          {c.atualizadoEm && <span>atualizado {c.atualizadoEm}</span>}
          {c.fonte && <span className="font-semibold text-slate-500 dark:text-slate-400">fonte: {c.fonte}</span>}
        </div>
      )}
    </div>
  );
}
