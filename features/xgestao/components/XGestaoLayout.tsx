'use client';

import type { CSSProperties, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@shared/components/ui/sidebar';
import { Separator } from '@shared/components/ui/separator';
import { XGestaoSidebar } from './XGestaoSidebar';
import { XGESTAO_NAV_ITEMS } from '../constants';

export function XGestaoLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const currentItem = XGESTAO_NAV_ITEMS.find((item) =>
    item.url === '/xgestao/dashboard' ? pathname === item.url : pathname.startsWith(item.url),
  );

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '17rem',
          '--sidebar-width-icon': '3.5rem',
        } as CSSProperties
      }
    >
      <XGestaoSidebar />
      <SidebarInset className="min-h-[100dvh] bg-[#f8faf8] dark:bg-[#121a17]">
        <header className="sticky top-0 z-20 flex h-[72px] shrink-0 items-center gap-3 border-b border-[#e2e9e4] bg-[#f8faf8]/95 px-4 backdrop-blur-sm sm:px-7 dark:border-[#29352f] dark:bg-[#121a17]/95">
          <SidebarTrigger className="-ml-1 rounded-lg text-[#53635b] hover:bg-[#eaf0ec] hover:text-[#25332f] dark:text-[#b9c8bf] dark:hover:bg-[#22302b] dark:hover:text-[#f5faf6]" />
          <Separator orientation="vertical" className="h-5 bg-[#d8e0dc] dark:bg-[#34433b]" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#25332f] dark:text-[#f5faf6]">
              {currentItem?.title ?? 'xgestão'}
            </p>
            <p className="hidden text-[11px] font-medium text-[#83918b] sm:block">
              Controle operacional para quem está no canteiro
            </p>
          </div>
          <div className="ml-auto hidden items-center gap-2 rounded-full border border-[#dce5df] bg-[#f0f5f1] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6e7d75] sm:flex dark:border-[#314039] dark:bg-[#202e29]">
            <span className="size-1.5 rounded-full bg-[#4e9b71]" />
            Operação ativa
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}