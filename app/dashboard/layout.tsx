"use client";
import { useAuth } from "@features/auth/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@shared/components/ui/sidebar";
import { AppSidebar } from "@shared/components/AppSidebar";
import { useTheme } from "@shared/components/theme-provider";
import { Button } from "@shared/components/ui/button";
import { Moon, Sun } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Só redireciona se realmente não tem usuário E não está carregando
    // Adiciona delay para evitar redirect durante login
    if (!isLoading && !user) {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    );
  }

  if (!user) return null;

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between gap-2 p-2 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
