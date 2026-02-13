export function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <img
          src="/logo-xconstrucao-horizontal-01.png"
          alt="XCon"
          className="h-12"
        />
        <div className="text-xs text-muted-foreground font-medium text-center md:text-right">
          © 2026 xconstrução.lab. Todos os direitos reservados.
          <br />
          Desenvolvido por{" "}
          <a
            href="https://ramongomes.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors underline"
          >
            Ramon Gomes
          </a>
        </div>
      </div>
    </footer>
  );
}
