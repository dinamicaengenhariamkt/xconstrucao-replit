"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@shared/lib/queryClient";
import { AuthProvider } from "@features/auth/hooks/use-auth";
import { ThemeProvider } from "@shared/components/theme-provider";
import { Toaster } from "@shared/components/ui/toaster";
import { TooltipProvider } from "@shared/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
