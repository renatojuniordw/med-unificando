// Wrappers de cache para dados usados em páginas dinâmicas.
// No Next 16, rotas com dynamic segments não têm ISR de página sem
// generateStaticParams; unstable_cache evita queries repetidas no banco.

import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getMedicineDetail } from '@/lib/actions/medicine-detail'
import { getMedicinesByAtc, getAtcLevels } from '@/lib/actions/atc'
import { getHolderMedicines, getHolderSummary, getDashboardStats } from '@/lib/actions/search'
import type { SearchFilters } from '@/types'

const REVALIDATE = 3600

export const getCachedDashboardStats = unstable_cache(
  async () => getDashboardStats(),
  ['dashboard-stats'],
  { revalidate: REVALIDATE }
)

export const getCachedAtcLevels = unstable_cache(
  async () => getAtcLevels(),
  ['atc-levels'],
  { revalidate: REVALIDATE }
)

export const getCachedFilteredStats = unstable_cache(
  async (filters: SearchFilters) => {
    const { getFilteredStats } = await import('@/lib/actions/search')
    return getFilteredStats(filters)
  },
  ['filtered-stats'],
  { revalidate: REVALIDATE }
)

export const getCachedMedicineDetail = unstable_cache(
  async (id: number) => getMedicineDetail(id),
  ['medicine-detail'],
  { revalidate: REVALIDATE }
)

export const getCachedAtcMedicines = unstable_cache(
  async (code: string, page: number, pageSize: number) => getMedicinesByAtc(code, page, pageSize),
  ['atc-medicines'],
  { revalidate: REVALIDATE }
)

export const getCachedHolderMedicines = unstable_cache(
  async (holder: string, page: number, pageSize: number, search?: string, status?: string) =>
    getHolderMedicines(holder, page, pageSize, search, status),
  ['holder-medicines'],
  { revalidate: REVALIDATE }
)

export const getCachedHolderSummary = unstable_cache(
  async (holder: string) => getHolderSummary(holder),
  ['holder-summary'],
  { revalidate: REVALIDATE }
)

export const getCachedReferenceMedicines = unstable_cache(
  async (name: string) =>
    prisma.medicine.findMany({
      where: { referenceMedicine: { equals: name, mode: 'insensitive' } },
      orderBy: { tradeName: 'asc' },
    }),
  ['reference-medicines'],
  { revalidate: REVALIDATE }
)

export const getCachedSitemapData = unstable_cache(
  async () => {
    const [medicines, references, atcCodes, holders] = await Promise.all([
      prisma.medicine.findMany({
        select: { id: true, tradeName: true, updatedAt: true, referenceMedicine: true, atcCode: true },
        orderBy: { id: 'asc' },
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
      prisma.medicine.findMany({
        select: { similarHolder: true },
        where: { similarHolder: { not: '' } },
        distinct: ['similarHolder'],
        take: 2000,
      }),
    ])
    return { medicines, references, atcCodes, holders }
  },
  ['sitemap-data'],
  { revalidate: 86400 }
)