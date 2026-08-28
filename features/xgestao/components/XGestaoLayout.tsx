'use client';

import type { CSSProperties, ReactNode } from 'react';
import { SidebarProvider } from '@shared/components/ui/sidebar';
import { ImpersonationBanner } from '@features/admin/components/ImpersonationBanner';
import { XGestaoSidebar } from './XGestaoSidebar';
import { XGestaoTopbar } from './XGestaoTopbar';

export function XGestaoLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '16rem',
          '--sidebar-width-icon': '3rem',
        } as CSSProperties
      }
    >
      <div className="flex h-screen w-full">
        <XGestaoSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <ImpersonationBanner />
          <XGestaoTopbar />
          <main className="min-h-0 flex-1 overflow-auto bg-gray-50 dark:bg-background-dark">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}