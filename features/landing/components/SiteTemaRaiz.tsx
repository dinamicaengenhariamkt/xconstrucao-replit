'use client';

import type { ReactNode } from 'react';
import { SiteTemaContexto, useSiteTema } from '../lib/site-tema';

/** Invólucro das páginas públicas com tema próprio. Ver `lib/site-tema.ts`. */
export function SiteTemaRaiz({ children }: { children: ReactNode }) {
  const valor = useSiteTema();
  return (
    <SiteTemaContexto.Provider value={valor}>
      <div
        className={valor.tema === 'dark' ? 'dark' : undefined}
        style={{ colorScheme: valor.tema }}
        data-site-tema={valor.tema}
      >
        {children}
      </div>
    </SiteTemaContexto.Provider>
  );
}
