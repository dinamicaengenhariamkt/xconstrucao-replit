'use client';

import { SidebarProvider } from '@shared/components/ui/sidebar';
import { AnuncianteSidebar } from './AnuncianteSidebar';
import { AnuncianteTopbar } from './AnuncianteTopbar';

export function AnuncianteLayout({ children }: { children: React.ReactNode }) {
  const style = {
    '--sidebar-width': '16rem',
    '--sidebar-width-icon': '3rem',
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AnuncianteSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <AnuncianteTopbar />
          <main className="flex-1 overflow-auto bg-gray-50 dark:bg-background-dark">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
