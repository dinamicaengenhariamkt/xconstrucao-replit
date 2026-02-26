"use client";

import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@shared/lib/queryClient";
import { AuthInit } from "@features/auth/components/AuthInit";
import { ThemeProvider } from "@shared/components/theme-provider";
import { Toaster } from "@shared/components/ui/toaster";
import { TooltipProvider } from "@shared/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (document.querySelector('link[data-font="material-symbols"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';
    link.setAttribute('data-font', 'material-symbols');
    document.head.appendChild(link);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthInit />
          {children}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
      {mounted && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
