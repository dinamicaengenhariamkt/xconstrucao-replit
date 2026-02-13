import { Metadata } from 'next'

// Base URL configuration (should match production domain)
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

// Default metadata that all pages will inherit
export const defaultMetadata = {
  siteName: 'XConstrução',
  locale: 'pt_BR',
  type: 'website' as const,
}

// Helper function to generate page metadata
export function generateMetadata({
  title,
  description,
  path = '',
  ogImage = '/og-images/default.png',
  noindex = false,
  keywords = [],
}: {
  title: string
  description: string
  path?: string
  ogImage?: string
  noindex?: boolean
  keywords?: string[]
}): Metadata {
  const url = `${BASE_URL}${path}`

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    robots: noindex ? {
      index: false,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
      },
    } : {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: defaultMetadata.siteName,
      locale: defaultMetadata.locale,
      type: defaultMetadata.type,
      images: [
        {
          url: `${BASE_URL}${ogImage}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${BASE_URL}${ogImage}`],
    },
  }
}

// Structured Data (JSON-LD) generators

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'XConstrução',
    url: BASE_URL,
    logo: `${BASE_URL}/images/logo-xconstrucao-horizontal-01.png`,
    description: 'Plataforma completa de gestão de construção civil que conecta contratantes e empreiteiros',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'BR',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'Portuguese',
    },
  }
}

export function generateProductSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'xgestão inteligente',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
      priceValidUntil: '2026-12-31',
      availability: 'https://schema.org/InStock',
      description: 'Teste gratuito por 3 meses',
    },
    description: 'Sistema completo de gestão de obras com IA para otimizar custos, prazos e recursos',
    featureList: [
      'Orçamento Inteligente com SINAPI',
      'Controle de Obras',
      'Gestão Financeira',
      'Documentação Digital',
      'Relatórios e Análises',
    ],
    provider: {
      '@type': 'Organization',
      name: 'XConstrução',
    },
  }
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  }
}

export function generateWebPageSchema({
  title,
  description,
  url,
  datePublished,
  dateModified = datePublished,
}: {
  title: string
  description: string
  url: string
  datePublished?: string
  dateModified?: string
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: `${BASE_URL}${url}`,
    inLanguage: 'pt-BR',
    isPartOf: {
      '@type': 'WebSite',
      url: BASE_URL,
      name: 'XConstrução',
    },
  }

  if (datePublished) {
    schema.datePublished = datePublished
    schema.dateModified = dateModified
  }

  return schema
}
