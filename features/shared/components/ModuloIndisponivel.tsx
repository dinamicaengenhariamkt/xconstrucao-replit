'use client';

import { RiToolsLine } from 'react-icons/ri';

/**
 * Estado exibido quando um módulo da plataforma foi desativado pelo admin (J26).
 * Usado, por exemplo, no gating de FAQ quando `plataforma.faq === false`.
 */
export function ModuloIndisponivel({
  titulo = 'Módulo indisponível',
  mensagem = 'Esta área está temporariamente desativada. Tente novamente mais tarde.',
}: {
  titulo?: string;
  mensagem?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <RiToolsLine className="mb-4 h-12 w-12 text-slate-300" />
      <h2 className="text-lg font-bold text-slate-600">{titulo}</h2>
      <p className="mt-1 max-w-sm text-sm text-slate-400">{mensagem}</p>
    </div>
  );
}
