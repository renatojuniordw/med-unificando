import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/config'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE.BASE_URL

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: ['GPTBot', 'Google-Extended', 'ClaudeBot', 'anthropic-ai', 'PerplexityBot'],
        allow: '/',
        disallow: ['/admin/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
