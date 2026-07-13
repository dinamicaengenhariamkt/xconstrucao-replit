'use client';

import { SidebarProvider } from '@shared/components/ui/sidebar';
import { ContratanteSidebar } from './ContratanteSidebar';
import { ContratanteTopbar } from './ContratanteTopbar';
import type { ContratanteLayoutProps } from '../types';

export function ContratanteLayout({ children }: ContratanteLayoutProps) {
  const style = {
    '--sidebar-width': '16rem',
    '--sidebar-width-icon': '3rem',
  };

  return (
    <SidebarProvider
      style={style as React.CSSProperties}
      className="h-svh min-h-0 overflow-hidden"
    >
      <div className="flex h-svh w-full overflow-hidden">
        <ContratanteSidebar />
        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
          <ContratanteTopbar />
          <main className="flex-1 overflow-auto bg-gray-50 dark:bg-background-dark">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
