/**
 * Link válido de uma empresa em somente leitura. O texto é neutro de
 * propósito: quem abre é o cliente da obra, e a situação da conta é assunto
 * entre a empresa e a plataforma. Nenhum dado da obra entra aqui.
 */
export function ObraPublicaIndisponivel() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-background py-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 sm:px-6">
        <header className="flex items-center justify-between gap-4">
          <p className="text-sm font-extrabold tracking-tight text-primary">xgestão</p>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Acompanhamento da obra
          </span>
        </header>
        <section
          className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm dark:border-border dark:bg-card sm:p-12"
          data-testid="obra-publica-indisponivel"
        >
          <h1 className="text-xl font-bold text-gray-900 dark:text-foreground sm:text-2xl">
            Esta obra não está disponível no momento
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-gray-600 dark:text-slate-300">
            Fale com o responsável pela obra para mais informações.
          </p>
        </section>
      </div>
    </main>
  );
}
