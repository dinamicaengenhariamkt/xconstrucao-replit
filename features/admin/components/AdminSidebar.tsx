'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@features/auth/hooks/use-auth';
import { useCallback, useMemo } from 'react';
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
import Image from 'next/image';
import { ADMIN_NAV_ITEMS, ADMIN_BOTTOM_NAV_ITEMS } from '../constants';
import type { NavItem } from '../types';

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();

  const handleLogout = useCallback(async () => {
    const { redirect } = await logout();
    router.push(redirect);
  }, [logout, router]);

  // Best-match: entre todos os itens, só o de URL mais específica (mais longa)
  // que casa com a rota atual fica ativo. Evita ativar "Obras" (/admin/obras)
  // junto com filhas como /admin/obras/moderacao, e o falso-positivo de prefixo
  // de string (/admin/obras-destaque).
  // XG06 — escopo do admin. `undefined` (token antigo, admin comum) ⇒ "global",
  // que enxerga tudo: para o admin de hoje os dois filtros abaixo são no-op.
  // Isto é montagem de menu, não autorização — o proxy e as rotas revalidam.
  const escopo = (user as { adminEscopo?: string } | null)?.adminEscopo === 'xgestao'
    ? 'xgestao'
    : 'global';

  const podeVer = useCallback(
    (item: NavItem) => escopo === 'global' || (item.escopos ?? ['global']).includes(escopo),
    [escopo],
  );

  const navItems = useMemo(() => ADMIN_NAV_ITEMS.filter(podeVer), [podeVer]);
  const bottomNavItems = useMemo(() => ADMIN_BOTTOM_NAV_ITEMS.filter(podeVer), [podeVer]);

  // Best-match sobre a lista JÁ FILTRADA — senão o realce cairia em item que o
  // usuário não enxerga.
  const activeUrl = useMemo(() => {
    const all = [...navItems, ...bottomNavItems];
    return (
      all
        .filter((i) => pathname === i.url || pathname.startsWith(`${i.url}/`))
        .sort((a, b) => b.url.length - a.url.length)[0]?.url ?? null
    );
  }, [pathname, navItems, bottomNavItems]);

  const isActive = (url: string): boolean => url === activeUrl;

  return (
    <Sidebar className="bg-[#FAFAFA] dark:bg-background-dark">
      <SidebarHeader className="p-6">
        {/* XG06 — o destino do logo depende do escopo: /admin/financeiro está
            fora da allowlist do admin xgestão e daria 403. */}
        <Link href={escopo === 'xgestao' ? '/admin/xgestao' : '/admin/financeiro'}>
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
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          {bottomNavItems.map((item) => (
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
