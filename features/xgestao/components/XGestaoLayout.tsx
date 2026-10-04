'use client';

import type { CSSProperties, ReactNode } from 'react';
import { SidebarProvider } from '@shared/components/ui/sidebar';
import { ImpersonationBanner } from '@features/admin/components/ImpersonationBanner';
import { XGestaoSidebar } from './XGestaoSidebar';
import { XGestaoTopbar } from './XGestaoTopbar';
import { TesteGratisAviso } from '../teste/components/TesteGratisAviso';

export function XGestaoLayout({ children, isOwner }: { children: ReactNode; isOwner: boolean }) {
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
        <XGestaoSidebar isOwner={isOwner} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <ImpersonationBanner />
          <XGestaoTopbar isOwner={isOwner} />
          {/* XG35 — plano e teste grátis são decisão do responsável, não do membro. */}
          {isOwner && <TesteGratisAviso />}
          <main className="min-h-0 flex-1 overflow-auto bg-gray-50 dark:bg-background-dark">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}