'use client';

import { useAuth } from '@features/auth/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Badge } from '@shared/components/ui/badge';
import { Search, Bell, Settings } from 'lucide-react';

export function EmpreiteiroTopbar() {
  const { user } = useAuth();

  return (
    <header className="h-20 flex items-center justify-between px-12 py-2 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-10">
      {/* Busca Global */}
      <div className="flex items-center gap-4 w-1/3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Buscar obras, documentos ou propostas..."
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
            <Bell className="w-5 h-5" />
          </Button>
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-[10px] border-2 border-background">
            3
          </Badge>
        </div>

        {/* Configurações */}
        <Button
          size="icon"
          variant="ghost"
          className="size-10 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
        >
          <Settings className="w-5 h-5" />
        </Button>

        {/* Separator */}
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>

        {/* User Info */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none">
                {user.name}
              </p>
              <p className="text-[11px] text-gray-500 font-medium capitalize">Empreiteiro</p>
            </div>
            <Avatar className="w-10 h-10 border border-border-light">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name || ''} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                {user.name?.slice(0, 2).toUpperCase() || 'E'}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </header>
  );
}
