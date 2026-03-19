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
import { Card, CardContent } from '@shared/components/ui/card';
import Image from 'next/image';
import {
  EMPREITEIRO_NAV_ITEMS,
  EMPREITEIRO_BOTTOM_NAV_ITEMS,
} from '../constants';

export function EmpreiteiroSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/');
  }, [logout, router]);

  const PLANO_ATUAL_ID: string = 'profissional'; // 'basico' | 'profissional' | 'enterprise'

  const isActive = (url: string): boolean => {
    if (url === '/empreiteiro/dashboard') return pathname === url;
    return pathname.startsWith(url);
  };

  return (
    <Sidebar className="bg-[#FAFAFA] dark:bg-background-dark">
      <SidebarHeader className="p-6">
        <Link href="/empreiteiro/dashboard">
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
              {EMPREITEIRO_NAV_ITEMS.map((item) => (
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
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Banner Monetização Superior */}
        <div className="px-2 mt-4">
          <a
            href="#"
            className="block bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm border border-border-light dark:border-gray-800 hover:shadow-md transition-shadow"
          >
            <div
              className="aspect-[4/3] bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300')",
              }}
            />
            <div className="p-3">
              <span className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                Anúncio
              </span>
              <p className="text-[10px] text-gray-400 mt-2">
                Por <span className="font-medium text-gray-500">Parceiro</span>
              </p>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
                Materiais de construção com até 30% de desconto
              </p>
            </div>
          </a>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {/* CTA Upgrade — exibido apenas no plano gratuito (basico) */}
        {PLANO_ATUAL_ID === 'basico' && (
          <div className="bg-primary/5 rounded-xl p-4 mb-4">
            <p className="text-xs font-bold text-primary mb-1">Upgrade de Plano</p>
            <p className="text-[10px] text-gray-500 mb-3">
              Obtenha acesso a relatórios avançados de IA.
            </p>
            <Button
              className="w-full py-2 bg-primary text-white text-[11px] font-bold rounded-lg uppercase tracking-wider"
              onClick={() => router.push('/empreiteiro/planos')}
            >
              Ver Planos
            </Button>
          </div>
        )}

        <SidebarMenu>
          {EMPREITEIRO_BOTTOM_NAV_ITEMS.map((item) => (
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
