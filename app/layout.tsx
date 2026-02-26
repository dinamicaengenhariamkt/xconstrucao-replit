import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "@shared/components/providers";
import { StructuredData } from "@features/landing/components/StructuredData";
import { BackToTop } from "@features/landing/components/BackToTop";
import { generateOrganizationSchema, BASE_URL } from "@features/landing/seo/seo-utils";

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
    'SINAPI',
    'orçamento de obras',
    'gestão de construção',
    'plataforma de construção',
  ],
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning data-scroll-behavior="smooth" className={manrope.variable}>
      <body suppressHydrationWarning>
        <StructuredData data={generateOrganizationSchema()} />
        <Providers>{children}</Providers>
        <BackToTop />
      </body>
    </html>
  );
}
