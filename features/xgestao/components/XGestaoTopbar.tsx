'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  RiLogoutBoxRLine,
  RiMenuLine,
  RiPriceTag3Line,
  RiSettings3Line,
  RiUserLine,
} from 'react-icons/ri';
import { useAuth } from '@features/auth/hooks/use-auth';
import { usePerfilPlano } from '@features/planos/ui/use-planos';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { SidebarTrigger } from '@shared/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';

export function XGestaoTopbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: plano } = usePerfilPlano('xgestao');

  const handleLogout = useCallback(async () => {
    const { redirect } = await logout({ persona: 'xgestao', next: '/xgestao/obras' });
    router.push(redirect);
  }, [logout, router]);

  return (
    <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center justify-between border-b border-gray-100 bg-white/80 px-4 py-2 backdrop-blur-md md:px-12 dark:border-gray-800 dark:bg-background-dark/80">
      <div className="flex min-w-0 items-center gap-4">
        <SidebarTrigger icon={RiMenuLine} />
        <div className="hidden sm:block">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">xgestão</p>
          <p className="text-xs text-muted-foreground">Gestão das suas próprias obras</p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-3 rounded-xl p-1.5 text-left outline-none transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-primary dark:hover:bg-gray-800"
            aria-label="Abrir menu da conta"
          >
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold leading-none text-gray-900 dark:text-gray-100">
                {user?.name ?? 'Empreiteiro'}
              </p>
              <p className="mt-1 text-[11px] font-medium text-gray-500">Conta xgestão</p>
              <span className="mt-1 inline-flex w-fit rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                {plano?.catalogo.nome ?? 'Plano xgestão'}
              </span>
            </div>
            <Avatar className="size-10 border border-border-light">
              {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name || ''} />}
              <AvatarFallback className="bg-primary text-sm font-bold text-primary-foreground">
                {user?.name?.slice(0, 2).toUpperCase() ?? 'EM'}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
            <span className="text-sm font-semibold">{user?.name ?? 'Empreiteiro'}</span>
            <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
            <span className="mt-1 inline-flex w-fit rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              {plano?.catalogo.nome ?? 'Plano xgestão'}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/xgestao/configuracoes?tab=perfil')}>
            <RiUserLine className="mr-2 size-4" />
            Meu perfil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/xgestao/configuracoes?tab=plano')}>
            <RiPriceTag3Line className="mr-2 size-4" />
            Plano e uso
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/xgestao/configuracoes')}>
            <RiSettings3Line className="mr-2 size-4" />
            Configurações
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            data-testid="xgestao-topbar-logout"
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <RiLogoutBoxRLine className="mr-2 size-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}