import { getCachedSitemapData } from '@/lib/data-cache'
import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/config'

export const revalidate = 86400

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE.BASE_URL

  let sitemapData = { medicines: [] as { id: number; updatedAt: Date | null }[], references: [] as { referenceMedicine: string | null }[], atcCodes: [] as { atcCode: string | null }[], holders: [] as { similarHolder: string }[] }
  try {
    sitemapData = await getCachedSitemapData()
  } catch {
    // DB unreachable during build (e.g. Docker build)
  }

  const { medicines, references, atcCodes, holders } = sitemapData

  const now = new Date()

  const medicineUrls = medicines.map(med => ({
    url: `${baseUrl}/medicamento/${med.id}`,
    lastModified: med.updatedAt ?? now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const referenceUrls = references
    .filter(r => r.referenceMedicine)
    .map(r => ({
      url: `${baseUrl}/referencias/${encodeURIComponent(r.referenceMedicine!)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

  const atcUrls = atcCodes
    .filter(a => a.atcCode)
    .map(a => ({
      url: `${baseUrl}/atc/${encodeURIComponent(a.atcCode!)}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }))

  const holderUrls = holders
    .filter(h => h.similarHolder)
    .map(h => ({
      url: `${baseUrl}/detentor/${encodeURIComponent(h.similarHolder!)}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    }))

  return [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/buscar-avancado`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/referencias`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/atc`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/dashboard`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${baseUrl}/sobre`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    ...medicineUrls,
    ...referenceUrls,
    ...atcUrls,
    ...holderUrls,
  ]
}
