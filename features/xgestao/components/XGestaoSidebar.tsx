'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { RiLogoutBoxRLine, RiRocketLine } from 'react-icons/ri';
import { useAuth } from '@features/auth/hooks/use-auth';
import { usePerfilPlano } from '@features/planos/ui/use-planos';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@shared/components/ui/sidebar';
import { Separator } from '@shared/components/ui/separator';
import { XGESTAO_BOTTOM_NAV_ITEMS, XGESTAO_NAV_ITEMS } from '../constants';

export function XGestaoSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { data: plano } = usePerfilPlano('xgestao');

  const handleLogout = useCallback(async () => {
    const { redirect } = await logout({ persona: 'xgestao', next: '/xgestao/obras' });
    router.push(redirect);
  }, [logout, router]);

  const isActive = (url: string) =>
    url === '/xgestao/dashboard'
      ? pathname === url
      : pathname.startsWith(url);

  return (
    <Sidebar className="bg-[#FAFAFA] dark:bg-background-dark">
      <SidebarHeader className="p-6 pb-4">
        <Link href="/xgestao/dashboard" className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <div className="flex cursor-pointer items-center">
            <Image
              src="/images/logo-xconstrucao-horizontal-01.png"
              alt="XConstrução"
              width={160}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </div>
        </Link>
        <div className="mt-3 flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary" />
          Área xgestão
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {XGESTAO_NAV_ITEMS.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={active ? 'border-r-3 border-primary bg-[#f3f7f8] font-semibold dark:bg-gray-800' : ''}
                    >
                      <Link href={item.url}>
                        <item.icon className="size-5" />
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              href="/xgestao/configuracoes?tab=plano"
              data-testid="xgestao-sidebar-upgrade"
              className={[
                'mb-2 flex items-start gap-2 rounded-xl border p-3 transition-colors',
                plano?.plano === 'enterprise'
                  ? 'border-border bg-background hover:bg-muted'
                  : 'border-primary/25 bg-primary/5 hover:bg-primary/10',
              ].join(' ')}
            >
              <RiRocketLine className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block text-xs font-bold text-foreground">
                  {plano?.plano === 'free' || !plano ? 'Faça upgrade do seu plano' : plano.plano === 'pro' ? 'Mais espaço para sua operação' : 'Plano Enterprise'}
                </span>
                <span className="mt-0.5 block text-[10px] leading-tight text-muted-foreground">
                  {plano?.plano === 'enterprise' ? 'Plano máximo ativo' : 'Veja opções e limites'}
                </span>
              </span>
            </Link>
          </SidebarMenuItem>
          {XGESTAO_BOTTOM_NAV_ITEMS.map((item) => {
            const active = isActive(item.url);
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  className={active ? 'border-r-3 border-primary bg-[#f3f7f8] font-semibold dark:bg-gray-800' : ''}
                >
                  <Link href={item.url}>
                    <item.icon className="size-4" />
                    <span className="text-sm font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
          <Separator className="my-2" />
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <RiLogoutBoxRLine className="size-4" />
              <span className="text-sm font-medium">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}