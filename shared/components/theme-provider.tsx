"use client";

import { useEffect } from "react";
import { useThemeStore } from "@shared/store/theme-store";

function ThemeSync() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeSync />
      {children}
    </>
  );
}

export function useTheme() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  return { theme, toggleTheme };
}
