"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useThemeStore } from "@shared/store/theme-store";

function useHasMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

function ThemeSync() {
  const theme = useThemeStore((state) => state.theme);
  const mounted = useHasMounted();

  useEffect(() => {
    useThemeStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme, mounted]);

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
  const mounted = useHasMounted();
  const storeTheme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const theme = mounted ? storeTheme : "light";
  return { theme, toggleTheme };
}
