import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "@shared/components/providers";
import { StructuredData } from "@features/landing/components/StructuredData";
import { BackToTop } from "@features/landing/components/BackToTop";
import { generateOrganizationSchema, BASE_URL } from "@features/landing/seo/seo-utils";
import { SCRIPT_CAPTURA_INSTALACAO } from "@features/pwa/lib/captura-instalacao";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: '%s | XConstrução',
    default: 'XConstrução - Plataforma de Gestão de Obras',
  },
  description: "Plataforma completa de gestão de construção civil que conecta contratantes e empreiteiros. Controle de obras, financeiro e muito mais.",
  keywords: [
    'gestão de obras',
    'construção civil',
    'empreiteiros',
    'contratantes',
    'orçamento de obras',
    'gestão de construção',
    'plataforma de construção',
  ],
  applicationName: 'xgestão',
  // PWA (11/11/2026): nome e barra de status do app instalado no iPhone.
  appleWebApp: { capable: true, title: 'xgestão', statusBarStyle: 'default' },
  authors: [{ name: 'XConstrução' }],
  creator: 'XConstrução',
  publisher: 'XConstrução',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'XConstrução - Plataforma de Gestão de Obras',
    description: 'Plataforma completa de gestão de construção civil que conecta contratantes e empreiteiros.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'XConstrução',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'XConstrução - Plataforma de Gestão de Obras',
    description: 'Plataforma completa de gestão de construção civil.',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1C1F22' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning data-scroll-behavior="smooth" className={manrope.variable}>
      <body suppressHydrationWarning>
        {/* PWA: guarda o convite de instalação do Android antes de o React montar. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_CAPTURA_INSTALACAO }} />
        <StructuredData data={generateOrganizationSchema()} />
        <Providers>{children}</Providers>
        <BackToTop />
      </body>
    </html>
  );
}
