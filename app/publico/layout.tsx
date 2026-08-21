import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Área pública propositalmente sem a navegação de áreas autenticadas. */
export default function PublicoLayout({ children }: { children: React.ReactNode }) {
  return children;
}