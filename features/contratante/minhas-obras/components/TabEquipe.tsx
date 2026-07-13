'use client';

import { cn } from '@shared/lib/utils';
import { RiPhoneLine, RiTeamLine } from 'react-icons/ri';
import type { MembroEquipe } from '../types';

interface TabEquipeProps {
  equipe?: MembroEquipe[];
}

export function TabEquipe({ equipe = [] }: TabEquipeProps) {
  if (equipe.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center gap-4 text-center" data-testid="tab-content-equipe">
        <RiTeamLine className="w-12 h-12 text-gray-200 dark:text-gray-700" />
        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Nenhum membro na equipe ainda
          </p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">
            Quando o empreiteiro cadastrar a equipe da obra, os membros aparecerão aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="tab-content-equipe">
      {equipe.map((membro) => (
        <div key={membro.id} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 text-center">
          <div className={cn('w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-bold mx-auto mb-3', membro.cor)}>
            {membro.iniciais}
          </div>
          <h4 className="font-bold text-gray-900 dark:text-white">{membro.nome}</h4>
          <p className="text-xs text-gray-500 mt-1">{membro.funcao}</p>
          {membro.telefone && (
            <a
              href={`tel:${membro.telefone}`}
              className="flex items-center justify-center gap-1 text-xs text-primary mt-3 hover:underline"
            >
              <RiPhoneLine className="w-3 h-3" />
              {membro.telefone}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
