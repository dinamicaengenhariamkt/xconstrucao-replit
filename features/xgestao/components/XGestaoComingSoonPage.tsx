import Link from 'next/link';

type XGestaoComingSoonPageProps = {
  title: string;
  description: string;
};

export function XGestaoComingSoonPage({ title, description }: XGestaoComingSoonPageProps) {
  return (
    <main className="flex min-h-full items-center justify-center p-6 sm:p-10">
      <section className="w-full max-w-xl rounded-2xl border border-[#dce5df] bg-white p-8 shadow-sm dark:border-[#314039] dark:bg-[#202e29]">
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#d45e2a]">xgestão</span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#25332f] dark:text-[#f5faf6]">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#68766f] dark:text-[#aab8b0]">{description}</p>
        <Link
          href="/xgestao/obras"
          className="mt-7 inline-flex rounded-lg bg-[#e06d36] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#c95222]"
        >
          Ver minhas obras
        </Link>
      </section>
    </main>
  );
}