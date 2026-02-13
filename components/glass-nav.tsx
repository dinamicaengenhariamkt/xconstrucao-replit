"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface GlassNavProps {
  showAccessButton?: boolean;
  showAdminButton?: boolean;
}

export function GlassNav({ showAccessButton = true, showAdminButton = false }: GlassNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center py-4 px-6">
        <nav
          className="flex items-center justify-between w-full max-w-[1200px] px-8 py-3 rounded-full border border-white/20 dark:border-white/10 backdrop-blur-xl bg-white/70 dark:bg-[#1C1F22]/70"
          style={{
            boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.04)",
          }}
        >
          <Link href="/">
            <Image
              src="/images/logo-xconstrucao-horizontal-01.png"
              alt="XConstrução"
              width={320}
              height={96}
              style={{ height: "2.5rem", width: "auto" }}
              priority
            />
          </Link>

          {/* Mobile Hamburger Button */}
          <SheetTrigger asChild className="md:hidden">
            <button className="p-2 hover:opacity-70 transition-opacity" aria-label="Menu">
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>

          {/* Desktop Navigation */}
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

          {/* Action Buttons - Hidden on mobile, visible on desktop */}
          <div className="hidden md:flex items-center">
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

      {/* Mobile Drawer */}
      <SheetContent
        side="left"
        className="w-[280px] backdrop-blur-xl bg-white/95 dark:bg-[#1C1F22]/95 border-r border-white/20"
      >
        <div className="flex flex-col h-full pt-8">
          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            <Link
              href="/#inicio"
              onClick={() => setIsOpen(false)}
              className="text-lg font-medium py-3 px-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
              data-testid="link-nav-inicio-mobile"
            >
              Início
            </Link>
            <Link
              href="/#solucoes"
              onClick={() => setIsOpen(false)}
              className="text-lg font-medium py-3 px-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
              data-testid="link-nav-solucoes-mobile"
            >
              Soluções
            </Link>
            <Link
              href="/#projetos"
              onClick={() => setIsOpen(false)}
              className="text-lg font-medium py-3 px-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
              data-testid="link-nav-projetos-mobile"
            >
              Projetos
            </Link>
          </nav>

          {/* Action Button at Bottom */}
          <div className="mt-auto pt-6 border-t border-white/20">
            {showAdminButton && (
              <Link
                href="/login?perfil=administrador"
                className="block w-full bg-[#333] text-white text-sm font-bold px-6 py-3 rounded-full hover:brightness-110 transition-all text-center"
                data-testid="link-admin-login-mobile"
              >
                Administrador
              </Link>
            )}
            {showAccessButton && !showAdminButton && (
              <Link
                href="/acesso-plataforma"
                className="block w-full bg-[#333333] text-white text-sm font-bold px-6 py-3 rounded-full hover:brightness-110 transition-all text-center"
                data-testid="link-acesso-plataforma-mobile"
              >
                Acesso à Plataforma
              </Link>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
