import { prisma } from '@/lib/prisma'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://medicamentos.unificando.com.br'

  const medicines = await prisma.medicine.findMany({
    select: { id: true, updatedAt: true },
    take: 50000,
  })

  const medicineUrls = medicines.map(med => ({
    url: `${baseUrl}/medicamento/${med.id}`,
    lastModified: med.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/dashboard`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.5 },
    { url: `${baseUrl}/referencias`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/atc`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    ...medicineUrls,
  ]
}
