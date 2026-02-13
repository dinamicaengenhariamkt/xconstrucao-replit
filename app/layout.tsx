import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { StructuredData } from "@/components/structured-data";
import { generateOrganizationSchema, BASE_URL } from "@/lib/seo";

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
    <html lang="pt-BR" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body>
        <StructuredData data={generateOrganizationSchema()} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
