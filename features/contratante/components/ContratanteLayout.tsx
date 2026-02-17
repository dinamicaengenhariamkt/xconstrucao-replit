'use client';

import { SidebarProvider } from '@shared/components/ui/sidebar';
import { ContratanteSidebar } from './ContratanteSidebar';
import { ContratanteTopbar } from './ContratanteTopbar';

interface ContratanteLayoutProps {
  children: React.ReactNode;
}

export function ContratanteLayout({ children }: ContratanteLayoutProps) {
  const style = {
    '--sidebar-width': '16rem',
    '--sidebar-width-icon': '3rem',
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <ContratanteSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <ContratanteTopbar />
          <main className="flex-1 overflow-auto bg-gray-50 dark:bg-background-dark">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
