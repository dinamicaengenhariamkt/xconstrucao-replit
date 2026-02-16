import { Metadata } from 'next'
import { generateMetadata as genMeta } from '@features/landing/seo/seo-utils'

// Route Segment Config - force static generation
export const dynamic = 'force-static'
export const revalidate = false

// SEO Metadata
export const metadata: Metadata = genMeta({
  title: 'Termos de Uso - XConstrução',
  description: 'Termos de uso da plataforma XConstrução. Leia atentamente antes de utilizar nossos serviços de gestão de obras.',
  path: '/termos',
  ogImage: '/og-images/legal.png',
})

export default function TermosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
