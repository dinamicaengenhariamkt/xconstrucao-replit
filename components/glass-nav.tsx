"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface GlassNavProps {
  showAccessButton?: boolean;
  showAdminButton?: boolean;
}

export function GlassNav({ showAccessButton = true, showAdminButton = false }: GlassNavProps) {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center py-4 px-6">
      <nav
        className="flex items-center justify-between w-full max-w-[1200px] px-8 py-3 rounded-full border border-white/20 dark:border-white/10 backdrop-blur-xl bg-white/70 dark:bg-[#1C1F22]/70"
        style={{
          boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.04)",
        }}
      >
        <Link href="/">
          <Image
            src="/images/logo-xconstrucao-horizontal.png"
            alt="XConstrução"
            width={160}
            height={48}
            style={{ height: "2.5rem", width: "auto" }}
            priority
          />
        </Link>
        <div className="hidden md:flex items-center gap-10">
          <Link
            className={`text-sm font-medium hover:opacity-70 transition-opacity ${pathname === "/" ? "opacity-100" : ""}`}
            href="/#inicio"
            data-testid="link-nav-inicio"
          >
            Início
          </Link>
          <Link
            className="text-sm font-medium hover:opacity-70 transition-opacity"
            href="/#solucoes"
            data-testid="link-nav-solucoes"
          >
            Soluções
          </Link>
          <Link
            className="text-sm font-medium hover:opacity-70 transition-opacity"
            href="/#projetos"
            data-testid="link-nav-projetos"
          >
            Projetos
          </Link>
        </div>
        <div className="flex items-center">
          {showAdminButton && (
            <Link
              href="/login?perfil=administrador"
              className="bg-[#333] text-white text-sm font-bold px-6 py-2 rounded-full hover:brightness-110 transition-all"
              data-testid="link-admin-login"
            >
              Administrador
            </Link>
          )}
          {showAccessButton && !showAdminButton && (
            <Link
              href="/acesso-plataforma"
              className="bg-[#333333] text-white text-sm font-bold px-6 py-2 rounded-full hover:brightness-110 transition-all"
              data-testid="link-acesso-plataforma"
            >
              Acesso à Plataforma
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
