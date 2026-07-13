'use client';

import { SidebarProvider } from '@shared/components/ui/sidebar';
import { EmpreiteiroSidebar } from './EmpreiteiroSidebar';
import { EmpreiteiroTopbar } from './EmpreiteiroTopbar';
import { ImpersonationBanner } from '@features/admin/components/ImpersonationBanner';
import type { EmpreiteiroLayoutProps } from '../types';

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
          <ImpersonationBanner />
          <EmpreiteiroTopbar />
          <main className="flex-1 min-h-0 overflow-auto bg-gray-50 dark:bg-background-dark">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
