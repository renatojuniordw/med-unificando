'use client'

import dynamic from 'next/dynamic'

// recharts (~500KB) carrega apenas no client, via code-splitting (ssr: false).
export const PriceChart = dynamic(
  () => import('@/components/medicines/price-chart').then(m => m.PriceChart),
  { ssr: false, loading: () => null }
)