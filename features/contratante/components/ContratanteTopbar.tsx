'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@features/auth/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { Button } from '@shared/components/ui/button';
import { Badge } from '@shared/components/ui/badge';
import { SidebarTrigger } from '@shared/components/ui/sidebar';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import { ContratanteSearchDialog } from '@features/contratante/search/components/ContratanteSearchDialog';
import { CONTRATANTE_SEARCH_CONFIG } from '@features/contratante/search/config';
import {
  RiSearchLine,
  RiNotification3Line,
  RiSettings3Line,
  RiMenuLine,
  RiUserLine,
  RiDraftLine,
  RiLogoutBoxRLine,
  RiCheckDoubleLine,
  RiAlarmLine,
  RiAlertLine,
  RiInformationLine,
  RiCheckboxCircleLine,
  RiArrowRightSLine,
} from 'react-icons/ri';
import { useContratanteNotifications } from '@features/contratante/notifications/hooks/use-notifications';
import { cn } from '@shared/lib/utils';
import type { NotificacaoTipo } from '@features/contratante/notifications/types';

const NOTIF_ICON: Record<NotificacaoTipo, React.ElementType> = {
  lembrete: RiAlarmLine,
  alerta: RiAlertLine,
  info: RiInformationLine,
  sucesso: RiCheckboxCircleLine,
};

const NOTIF_ICON_COLOR: Record<NotificacaoTipo, string> = {
  lembrete: 'text-amber-500',
  alerta: 'text-red-500',
  info: 'text-blue-500',
  sucesso: 'text-green-500',
};

const PLANO_ATUAL = { label: 'Empresarial' } as const;

const NOTIF_DOT_COLOR: Record<NotificacaoTipo, string> = {
  lembrete: 'bg-amber-400',
  alerta: 'bg-red-500',
  info: 'bg-blue-500',
  sucesso: 'bg-green-500',
};

function formatNotifTime(isoDate: string): string {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diff < 60) return 'agora mesmo';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  return `há ${Math.floor(diff / 86400)}d`;
}

export function ContratanteTopbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { topbarNotifications: notifications, unreadCount, marcarComoLida, marcarTodasComoLidas } =
    useContratanteNotifications();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const handleLogout = async () => {
    const { redirect } = await logout();
    router.push(redirect);
  };

  // Atalho de teclado Cmd/Ctrl + K para abrir busca global
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <header className="h-20 flex items-center justify-between px-4 md:px-12 py-2 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-10">
      {/* Busca Global */}
      <div className="flex items-center gap-2 md:gap-4 w-full md:w-1/3">
        {/* Mobile Hamburger Menu */}
        <SidebarTrigger icon={RiMenuLine} className="md:hidden" />

        {/* Desktop Sidebar Toggle */}
        <SidebarTrigger icon={RiMenuLine} className="hidden md:flex" />

        {/* Mobile: Botão Ícone de Busca */}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setSearchOpen(true)}
          className="md:hidden size-10 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
          aria-label="Abrir busca"
          data-testid="button-search-mobile"
        >
          <RiSearchLine className="w-5 h-5" />
        </Button>

        {/* Desktop: Trigger de Busca Global (abre ContratanteSearchDialog) */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="relative w-full max-w-xs md:max-w-sm hidden md:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 border-none rounded-xl pl-10 pr-2 py-2 text-sm text-left text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer"
          aria-label="Abrir busca global"
          data-testid="button-search"
        >
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <span className="flex-1 truncate">{CONTRATANTE_SEARCH_CONFIG.triggerLabel}</span>
          <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 tabular-nums">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Notificações */}
        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <div className="relative">
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-10 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
                aria-label="Notificações"
              >
                <RiNotification3Line className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-[10px] border-2 border-background pointer-events-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </div>
          <PopoverContent className="w-96 p-0" align="end">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900 dark:text-white">Notificações</span>
                {unreadCount > 0 && (
                  <Badge className="h-5 px-1.5 bg-red-500 text-white text-[10px] rounded-full">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={marcarTodasComoLidas}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  <RiCheckDoubleLine className="w-3.5 h-3.5" />
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* Lista */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {notifications.map((notif) => {
                const Icon = NOTIF_ICON[notif.tipo];
                const iconColor = NOTIF_ICON_COLOR[notif.tipo];
                const dotColor = NOTIF_DOT_COLOR[notif.tipo];
                const timeLabel = formatNotifTime(notif.criadoEm);
                return (
                  <button
                    key={notif.id}
                    onClick={() => {
                      marcarComoLida(notif.id);
                      router.push(notif.href);
                      setNotifOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60',
                      !notif.lida
                        ? 'bg-primary/[0.04] dark:bg-primary/10'
                        : 'bg-white dark:bg-gray-900'
                    )}
                  >
                    {/* Dot não lida */}
                    <div className="shrink-0 mt-1 w-4 flex justify-center">
                      {!notif.lida && (
                        <span className={cn('w-2 h-2 rounded-full mt-0.5', dotColor)} />
                      )}
                    </div>

                    {/* Ícone tipo */}
                    <div className="shrink-0 mt-0.5">
                      <Icon className={cn('w-4 h-4', iconColor)} />
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm leading-snug',
                        !notif.lida
                          ? 'font-semibold text-gray-900 dark:text-white'
                          : 'font-medium text-gray-700 dark:text-gray-300'
                      )}>
                        {notif.titulo}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug line-clamp-2">
                        {notif.descricao}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                        {timeLabel}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2.5">
              <button
                onClick={() => { router.push('/contratante/notificacoes'); setNotifOpen(false); }}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors w-full justify-center"
              >
                Ver todas as notificações
                <RiArrowRightSLine className="w-3.5 h-3.5" />
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Separator */}
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer rounded-xl p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors outline-none">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none">
                  {user?.name ?? 'Contratante'}
                </p>
                <p className="text-[11px] text-gray-500 font-medium">Contratante</p>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                  {PLANO_ATUAL.label}
                </span>
              </div>
              <Avatar className="w-10 h-10 border border-border-light">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name || ''} />}
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                  {user?.name?.slice(0, 2).toUpperCase() ?? 'CT'}
                </AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
              <span className="text-sm font-semibold">{user?.name ?? 'Contratante'}</span>
              <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full self-start mt-0.5">
                {PLANO_ATUAL.label}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/contratante/configuracoes?tab=perfil')}>
              <RiUserLine className="w-4 h-4 mr-2" />
              Meu perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/contratante/configuracoes')}>
              <RiSettings3Line className="w-4 h-4 mr-2" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/contratante/minhas-obras?visibilidade=rascunho')}>
              <RiDraftLine className="w-4 h-4 mr-2" />
              Meus rascunhos
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
      </div>

      {/* Dialog de Busca Global (desktop + mobile) */}
      <ContratanteSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
