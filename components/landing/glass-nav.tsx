import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function GlassNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center py-4 px-6">
      <nav className="flex items-center justify-between w-full max-w-[1200px] px-8 py-3 rounded-full border border-white/20 dark:border-white/10 bg-white/70 dark:bg-[#1C1F22]/70 backdrop-blur-xl shadow-lg">
        <img
          src="/logo-xconstrucao-horizontal.png"
          alt="XCon"
          className="h-12"
        />
        <div className="hidden md:flex items-center gap-10">
          <a
            className="text-sm font-medium hover:opacity-70 transition-opacity"
            href="#inicio"
          >
            Início
          </a>
          <a
            className="text-sm font-medium hover:opacity-70 transition-opacity"
            href="#solucoes"
          >
            Soluções
          </a>
          <a
            className="text-sm font-medium hover:opacity-70 transition-opacity"
            href="#projetos"
          >
            Projetos
          </a>
        </div>
        <Link href="/login">
          <Button className="rounded-full font-bold">
            Acesso à Plataforma
          </Button>
        </Link>
      </nav>
    </header>
  );
}
