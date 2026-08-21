import { MetadataRoute } from 'next'
import { isMarketplaceVisivel } from '@features/admin/platform-settings/server/settings-reader'

// A fonte de verdade tem cache próprio de até 30 segundos. Não congele o
// sitemap no build, ou a reativação exigiria uma nova publicação.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://xconstrucao.com.br'
  const marketplaceVisivel = await isMarketplaceVisivel()

  const pages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date('2026-02-13'),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/xgestao-inteligente`,
      lastModified: new Date('2026-02-13'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/termos`,
      lastModified: new Date('2026-02-13'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/politica-privacidade`,
      lastModified: new Date('2026-02-13'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // A rota continua funcionando quando oculta, mas só é descoberta por
  // buscadores quando o marketplace estiver oficialmente apresentado.
  if (marketplaceVisivel) {
    pages.splice(2, 0, {
      url: `${baseUrl}/acesso-plataforma`,
      lastModified: new Date('2026-02-13'),
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  return pages
}
