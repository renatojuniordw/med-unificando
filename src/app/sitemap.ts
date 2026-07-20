import { prisma } from '@/lib/prisma'
import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE.BASE_URL

  const [medicines, references, atcCodes] = await Promise.all([
    prisma.medicine.findMany({
      select: { id: true, updatedAt: true, referenceMedicine: true, atcCode: true },
      take: 50000,
    }),
    prisma.medicine.findMany({
      select: { referenceMedicine: true },
      where: { referenceMedicine: { not: null } },
      distinct: ['referenceMedicine'],
    }),
    prisma.medicine.findMany({
      select: { atcCode: true },
      where: { atcCode: { not: null } },
      distinct: ['atcCode'],
    }),
  ])

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

  const holderUrls = await prisma.medicine.findMany({
    select: { similarHolder: true },
    where: { similarHolder: { not: '' } },
    distinct: ['similarHolder'],
    take: 2000,
  }).then(holders =>
    holders
      .filter(h => h.similarHolder)
      .map(h => ({
        url: `${baseUrl}/detentor/${encodeURIComponent(h.similarHolder!)}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.4,
      }))
  )

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
