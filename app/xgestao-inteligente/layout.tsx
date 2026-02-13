import { Metadata } from 'next'
import { generateMetadata as genMeta } from '@/lib/seo'

// Route Segment Config - force static generation
export const dynamic = 'force-static'
export const revalidate = false

// SEO Metadata
export const metadata: Metadata = genMeta({
  title: 'xgestão inteligente - Gestão de Obras com Inteligência Artificial',
  description: 'Sistema completo para gerenciar orçamentos, equipes, financeiro e documentação da sua obra com IA. Teste grátis por 3 meses.',
  path: '/xgestao-inteligente',
  ogImage: '/og-images/xgestao.png',
  keywords: [
    'xgestão inteligente',
    'gestão de obras IA',
    'orçamento SINAPI',
    'controle de obras',
    'gestão financeira obras',
  ],
})

export default function XGestaoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
