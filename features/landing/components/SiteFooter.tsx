import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="py-12 px-6 border-t border-slate-100 dark:border-slate-800">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <Link href="/">
          <Image
            src="/images/logo-xconstrucao-horizontal-01.png"
            alt="XConstrução"
            width={160}
            height={48}
            className="h-12 w-auto"
          />
        </Link>
        <div className="text-xs text-slate-400 font-medium text-center md:text-right">
          &copy; 2026 xconstrução.lab. Todos os direitos reservados.<br />
          Desenvolvido por{" "}
          <a
            href="https://ramongomes.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#333333] transition-colors"
          >
            Ramon Gomes
          </a>
        </div>
      </div>
    </footer>
  );
}
