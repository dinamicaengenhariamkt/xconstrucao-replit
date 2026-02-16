'use client';

import { SidebarProvider, SidebarTrigger } from '@shared/components/ui/sidebar';
import { EmpreiteiroSidebar } from './EmpreiteiroSidebar';
import { EmpreiteiroTopbar } from './EmpreiteiroTopbar';

interface EmpreiteiroLayoutProps {
  children: React.ReactNode;
}

export function EmpreiteiroLayout({ children }: EmpreiteiroLayoutProps) {
  const style = {
    '--sidebar-width': '16rem',
    '--sidebar-width-icon': '3rem',
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <EmpreiteiroSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <EmpreiteiroTopbar />
          <main className="flex-1 overflow-auto bg-gray-50 dark:bg-background-dark">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
