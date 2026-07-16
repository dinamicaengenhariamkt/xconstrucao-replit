'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@features/auth/hooks/use-auth';
import { useCallback } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from '@shared/components/ui/sidebar';
import { RiLogoutBoxRLine } from 'react-icons/ri';
import { Separator } from '@shared/components/ui/separator';
import { Button } from '@shared/components/ui/button';
import Image from 'next/image';
import { RiMegaphoneLine } from 'react-icons/ri';
import { useHasRole } from '@features/auth/store/auth-store';
import { AdSidebarSlot } from '@features/shared/anuncios/components/AdSidebarSlot';
import { useContratanteUnreadCount } from '@features/contratante/xchat/hooks/use-unread-count';
import {
  CONTRATANTE_NAV_ITEMS,
  CONTRATANTE_BOTTOM_NAV_ITEMS,
} from '../constants';

export function ContratanteSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { data: unreadCount = 0 } = useContratanteUnreadCount();
  // J23/D6 — "Meus Anúncios" embutido na visão de cliente quando tem o papel.
  const isAnunciante = useHasRole('anunciante');
  const navItems = isAnunciante
    ? [...CONTRATANTE_NAV_ITEMS, { title: 'Meus Anúncios', url: '/contratante/meus-anuncios', icon: RiMegaphoneLine }]
    : CONTRATANTE_NAV_ITEMS;

  const handleLogout = useCallback(async () => {
    const { redirect } = await logout();
    router.push(redirect);
  }, [logout, router]);

  const PLANO_ATUAL_ID: string = 'empresarial'; // 'starter' | 'empresarial' | 'enterprise'

  const isActive = (url: string): boolean => {
    if (url === '/contratante/dashboard') return pathname === url;
    return pathname.startsWith(url);
  };

  return (
    <Sidebar className="bg-[#FAFAFA] dark:bg-background-dark">
      <SidebarHeader className="p-6">
        <Link href="/contratante/dashboard">
          <div className="flex items-center cursor-pointer">
            <Image
              src="/images/logo-xconstrucao-horizontal-01.png"
              alt="XConstrução"
              width={160}
              height={48}
              className="h-12 w-auto"
            />
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className={
                      isActive(item.url)
                        ? 'bg-[#f3f7f8] dark:bg-gray-800 border-r-3 border-primary font-semibold'
                        : ''
                    }
                  >
                    <Link href={item.url}>
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm">{item.title}</span>
                      {item.url === '/contratante/chat' && unreadCount > 0 && (
                        <span
                          className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none"
                          data-testid="sidebar-unread-badge"
                          aria-label={`${unreadCount} mensagens não lidas`}
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Anúncio — só aparece quando há criativo ativo cadastrado para a zona. */}
        <AdSidebarSlot zoneId="sidebar-sup-contratante" />
      </SidebarContent>

      <SidebarFooter className="p-4">
        {/* CTA Upgrade — exibido apenas no plano gratuito (starter) */}
        {PLANO_ATUAL_ID === 'starter' && (
          <div className="bg-primary/5 rounded-xl p-4 mb-4">
            <p className="text-xs font-bold text-primary mb-1">Upgrade de Plano</p>
            <p className="text-[10px] text-gray-500 mb-3">
              Obtenha acesso a relatórios avançados de IA.
            </p>
            <Button
              className="w-full py-2 bg-primary text-white text-[11px] font-bold rounded-lg uppercase tracking-wider"
              onClick={() => router.push('/contratante/planos')}
            >
              Ver Planos
            </Button>
          </div>
        )}

        <SidebarMenu>
          {CONTRATANTE_BOTTOM_NAV_ITEMS.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link href={item.url}>
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <Separator className="my-2" />
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <RiLogoutBoxRLine className="w-4 h-4" />
              <span className="text-sm font-medium">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
