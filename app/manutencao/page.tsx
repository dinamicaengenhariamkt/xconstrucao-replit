import type { Metadata } from "next";
import Link from "next/link";
import { RiToolsFill } from "react-icons/ri";

export const metadata: Metadata = {
  title: "Em manutenção — XConstrução",
  robots: { index: false, follow: false },
};

/**
 * Tela de manutenção (J26). Exibida quando o modo manutenção está ativo e um
 * usuário NÃO-admin tenta acessar as áreas logadas (/contratante, /empreiteiro).
 * A landing pública e o /admin seguem acessíveis (o proxy não redireciona aqui).
 *
 * Não está sob as rotas protegidas pelo proxy → evita loop de redirect.
 */
export default function ManutencaoPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
        <RiToolsFill className="h-10 w-10 text-primary" />
      </div>
      <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
        Estamos em manutenção
      </h1>
      <p className="mt-4 max-w-md text-base text-slate-500">
        A plataforma está passando por uma atualização rápida para melhorar sua
        experiência. Já voltamos — tente novamente em alguns minutos.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
