'use client';

import { useState } from 'react';
import { RiSmartphoneLine } from 'react-icons/ri';
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@shared/components/ui/sidebar';
import { useInstalarApp } from '../lib/use-instalar-app';
import { InstalarAppDialog } from './InstalarAppDialog';

/** PWA — "Instalar app" no menu lateral do xgestão. Some dentro do app instalado. */
export function InstalarAppMenuItem() {
  const { plataforma, comoApp } = useInstalarApp();
  const { setOpenMobile } = useSidebar();
  const [aberto, setAberto] = useState(false);

  if (!plataforma || comoApp) return null;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => {
          setOpenMobile(false);
          setAberto(true);
        }}
        data-testid="xgestao-sidebar-instalar-app"
      >
        <RiSmartphoneLine className="size-4" />
        <span className="text-sm font-medium">Instalar app</span>
      </SidebarMenuButton>
      <InstalarAppDialog open={aberto} onOpenChange={setAberto} />
    </SidebarMenuItem>
  );
}
