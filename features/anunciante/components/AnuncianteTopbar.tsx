'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@features/auth/hooks/use-auth';
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
import { RiMenuLine, RiSettings3Line, RiLogoutBoxRLine } from 'react-icons/ri';

export function AnuncianteTopbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    const { redirect } = await logout();
    router.push(redirect);
  };

  return (
    <header className="h-20 flex items-center justify-between px-4 md:px-12 py-2 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-2 md:gap-4">
        <SidebarTrigger icon={RiMenuLine} />
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Área do Anunciante</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-3 cursor-pointer rounded-xl p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors outline-none">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none">
                {user?.name ?? 'Anunciante'}
              </p>
              <p className="text-[11px] text-gray-500 font-medium">Anunciante</p>
            </div>
            <Avatar className="w-10 h-10 border border-border-light">
              {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name || ''} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                {user?.name?.slice(0, 2).toUpperCase() ?? 'AN'}
              </AvatarFallback>
            </Avatar>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
            <span className="text-sm font-semibold">{user?.name ?? 'Anunciante'}</span>
            <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/anunciante/configuracoes')}>
            <RiSettings3Line className="w-4 h-4 mr-2" />
            Configurações
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <RiLogoutBoxRLine className="w-4 h-4 mr-2" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
