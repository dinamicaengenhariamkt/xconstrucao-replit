'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { RiLogoutBoxRLine } from 'react-icons/ri';
import { useAuth } from '@features/auth/hooks/use-auth';
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
import { XGESTAO_NAV_ITEMS } from '../constants';

export function XGestaoSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = useCallback(async () => {
    const { redirect } = await logout();
    router.push(redirect);
  }, [logout, router]);

  const isActive = (url: string) =>
    url === '/xgestao/dashboard'
      ? pathname === url
      : pathname.startsWith(url);

  return (
    <Sidebar className="border-r border-[#d8e0dc] bg-[#f4f7f5] text-[#25332f] dark:border-[#2e3b37] dark:bg-[#18221f] dark:text-[#edf3ef]">
      <SidebarHeader className="px-5 pb-5 pt-6">
        <Link
          href="/xgestao/obras"
          className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#e06d36] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f7f5] dark:focus-visible:ring-offset-[#18221f]"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-[#e06d36] text-lg font-black tracking-[-0.08em] text-[#fff8f2] shadow-[0_5px_14px_rgba(180,75,30,0.18)] transition-transform duration-200 group-hover:-translate-y-0.5">
              x.
            </span>
            <span className="leading-none">
              <span className="block text-[17px] font-extrabold tracking-[-0.04em] text-[#25332f] dark:text-[#f5faf6]">
                xgestão
              </span>
              <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.18em] text-[#77847e]">
                operação de obras
              </span>
            </span>
          </div>
        </Link>
        <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#83918b]">
          <span className="size-1.5 rounded-full bg-[#e06d36]" />
          Área do empreiteiro
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {XGESTAO_NAV_ITEMS.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={`h-auto min-h-12 rounded-lg px-3 py-2.5 transition-[background-color,color,transform] duration-200 ${
                        active
                          ? 'bg-[#e7eeea] text-[#25332f] shadow-[inset_3px_0_0_#e06d36] dark:bg-[#26352f] dark:text-[#f5faf6]'
                          : 'text-[#68766f] hover:translate-x-0.5 hover:bg-[#e9efeb] hover:text-[#25332f] dark:text-[#aab8b0] dark:hover:bg-[#22302b] dark:hover:text-[#f5faf6]'
                      }`}
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className={`size-[19px] shrink-0 ${active ? 'text-[#d45e2a]' : ''}`} />
                        <span className="flex min-w-0 flex-col">
                          <span className="text-[13px] font-semibold">{item.title}</span>
                          <span className="mt-0.5 truncate text-[10px] font-medium text-[#89958f]">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="mb-3 rounded-lg border border-[#dce5df] bg-[#edf3ef] px-3 py-2.5 dark:border-[#314039] dark:bg-[#202e29]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#77847e]">Operação ativa</p>
          <p className="mt-1 text-xs font-semibold text-[#3b4a44] dark:text-[#d9e5dd]">Tudo em um só lugar.</p>
        </div>
        <Separator className="mb-2 bg-[#d8e0dc] dark:bg-[#2e3b37]" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="h-10 rounded-lg px-3 text-[#68766f] transition-colors hover:bg-[#f7e9e3] hover:text-[#b34e28] dark:text-[#aab8b0] dark:hover:bg-[#3a2923] dark:hover:text-[#ef9b72]"
            >
              <RiLogoutBoxRLine className="size-[17px]" />
              <span className="text-[13px] font-semibold">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}