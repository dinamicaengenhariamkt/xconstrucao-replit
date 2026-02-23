'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@features/auth/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Badge } from '@shared/components/ui/badge';
import { SidebarTrigger } from '@shared/components/ui/sidebar';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
import { SearchModal, SearchResult } from '@shared/components/SearchModal';
import {
  RiSearchLine,
  RiNotification3Line,
  RiSettings3Line,
  RiMenuLine,
  RiRefreshLine,
} from 'react-icons/ri';

function useRelativeTime(date: Date | null): string {
  const [label, setLabel] = useState('');

  const compute = useCallback(() => {
    if (!date) { setLabel(''); return; }
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) setLabel('agora mesmo');
    else if (diff < 3600) setLabel(`há ${Math.floor(diff / 60)} min`);
    else setLabel(`há ${Math.floor(diff / 3600)}h`);
  }, [date]);

  useEffect(() => {
    compute();
    const id = setInterval(compute, 30_000);
    return () => clearInterval(id);
  }, [compute]);

  return label;
}

export function AdminTopbar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(() => new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const relativeTime = useRelativeTime(lastRefreshedAt);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setLastRefreshedAt(new Date());
    setIsRefreshing(false);
    setPopoverOpen(false);
  }, [queryClient]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSearchResults([]);
  };

  return (
    <header className="h-20 flex items-center justify-between px-4 md:px-12 py-2 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-10">
      {/* Busca Global */}
      <div className="flex items-center gap-2 md:gap-4 w-full md:w-1/3">
        {/* Mobile Hamburger */}
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
        >
          <RiSearchLine className="w-5 h-5" />
        </Button>

        {/* Desktop: Campo de Busca Inline */}
        <div className="relative w-full max-w-xs md:max-w-sm hidden md:block">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Buscar clientes, empreiteiras ou lançamentos..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-xl pl-10 py-2 text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Notificações */}
        <div className="relative">
          <Button
            size="icon"
            variant="ghost"
            className="size-10 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
          >
            <RiNotification3Line className="w-5 h-5" />
          </Button>
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-[10px] border-2 border-background">
            5
          </Badge>
        </div>

        {/* Sincronizar dados */}
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="size-10 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
              aria-label="Sincronizar dados"
            >
              <RiRefreshLine className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4" align="end">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Sincronização de dados</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {lastRefreshedAt ? `Última atualização: ${relativeTime}` : 'Carregando dados...'}
            </p>
            <Button
              size="sm"
              className="w-full"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RiRefreshLine className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Atualizando...' : 'Sincronizar agora'}
            </Button>
          </PopoverContent>
        </Popover>

        {/* Configurações */}
        <Button
          size="icon"
          variant="ghost"
          className="size-10 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
        >
          <RiSettings3Line className="w-5 h-5" />
        </Button>

        {/* Separator */}
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2" />

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none">
              {user?.name ?? 'Administrador'}
            </p>
            <p className="text-[11px] text-gray-500 font-medium">Administrador</p>
          </div>
          <Avatar className="w-10 h-10 border border-border-light">
            {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name || ''} />}
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
              {user?.name?.slice(0, 2).toUpperCase() ?? 'AD'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Modal de Busca (Mobile) */}
      <SearchModal
        isOpen={searchOpen}
        onOpenChange={setSearchOpen}
        placeholder="Buscar clientes, empreiteiras ou lançamentos..."
        results={searchResults}
        onSearch={handleSearch}
        emptyMessage="Nenhum resultado encontrado."
      />
    </header>
  );
}
