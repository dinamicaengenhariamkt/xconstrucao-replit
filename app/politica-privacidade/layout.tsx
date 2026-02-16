import { Metadata } from 'next'
import { generateMetadata as genMeta } from '@features/landing/seo/seo-utils'

// Route Segment Config - force static generation
export const dynamic = 'force-static'
export const revalidate = false

// SEO Metadata
export const metadata: Metadata = genMeta({
  title: 'Política de Privacidade - XConstrução',
  description: 'Política de privacidade e proteção de dados da XConstrução. Conformidade com LGPD e transparência no tratamento de informações.',
  path: '/politica-privacidade',
  ogImage: '/og-images/legal.png',
})

export default function PrivacidadeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
