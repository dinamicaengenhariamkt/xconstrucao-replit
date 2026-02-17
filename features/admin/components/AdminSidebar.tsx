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
import {
  RiUserLine,
  RiTeamLine,
  RiMoneyDollarCircleLine,
  RiWalletLine,
  RiArrowUpCircleLine,
  RiArrowDownCircleLine,
  RiMegaphoneLine,
  RiQuestionLine,
  RiSettings3Line,
  RiLogoutBoxRLine,
} from 'react-icons/ri';
import { Separator } from '@shared/components/ui/separator';
import Image from 'next/image';

const adminItems = [
  { title: 'Cliente', url: '/admin/clientes', icon: RiUserLine },
  { title: 'Empreiteira', url: '/admin/empreiteiras', icon: RiTeamLine },
  { title: 'Financeiro', url: '/admin/financeiro', icon: RiMoneyDollarCircleLine },
  { title: 'Caixa', url: '/admin/caixa', icon: RiWalletLine },
  { title: 'Entradas', url: '/admin/entradas', icon: RiArrowUpCircleLine },
  { title: 'Saídas', url: '/admin/saidas', icon: RiArrowDownCircleLine },
  { title: 'Anúncios', url: '/admin/anuncios', icon: RiMegaphoneLine },
];

const bottomItems = [
  { title: 'Perguntas Frequentes', url: '/admin/faq', icon: RiQuestionLine },
  { title: 'Configurações', url: '/admin/config', icon: RiSettings3Line },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/');
  }, [logout, router]);

  const isActive = (url: string) => pathname.startsWith(url);

  return (
    <Sidebar className="bg-[#FAFAFA] dark:bg-background-dark">
      <SidebarHeader className="p-6">
        <Link href="/admin/financeiro">
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
              {adminItems.map((item) => (
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
          {bottomItems.map((item) => (
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
