import { Switch, Route, Redirect } from "wouter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Bell, Sun, Moon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/components/theme-provider";
import DashboardHome from "./index";
import ClientesPage from "./clientes";
import EmpreiteirasPage from "./empreiteiras";
import ObrasPage from "./obras";
import FinanceiroPage from "./financeiro";

function TopBar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="h-16 flex items-center justify-between gap-4 px-4 md:px-8 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            className="pl-9 rounded-xl w-72 bg-muted/50 border-none"
            placeholder="Buscar..."
            data-testid="input-global-search"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="button-theme-toggle">
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="icon" data-testid="button-notifications">
          <Bell className="w-4 h-4" />
        </Button>
        <div className="h-6 w-px bg-border"></div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold leading-none" data-testid="text-topbar-name">{user?.name || "Usuário"}</p>
            <p className="text-[11px] text-muted-foreground font-medium capitalize">{user?.role || "admin"}</p>
          </div>
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {user?.name?.slice(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

export default function DashboardLayout() {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-12 rounded-md mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/access" />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto bg-background">
            <Switch>
              <Route path="/dashboard" component={DashboardHome} />
              <Route path="/dashboard/clientes" component={ClientesPage} />
              <Route path="/dashboard/empreiteiras" component={EmpreiteirasPage} />
              <Route path="/dashboard/obras" component={ObrasPage} />
              <Route path="/dashboard/financeiro" component={FinanceiroPage} />
              <Route path="/dashboard/entradas" component={FinanceiroPage} />
              <Route path="/dashboard/saidas" component={FinanceiroPage} />
              <Route path="/dashboard/:rest*" component={DashboardHome} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
