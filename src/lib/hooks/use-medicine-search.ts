'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { searchMedicines } from '@/lib/actions/search'
import type { SearchResponse, SearchFilters } from '@/types'

export function useMedicineSearch(initialData: SearchResponse) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [data, setData] = useState<SearchResponse>(initialData)
  const [loading, setLoading] = useState(false)

  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10
  const query = searchParams.get('query') || ''
  const reference = searchParams.get('reference') || ''
  const activeIngredient = searchParams.get('activeIngredient') || ''
  const tradeName = searchParams.get('tradeName') || ''
  const category = searchParams.get('category') || ''
  const status = searchParams.get('status') || ''
  const farmaciaPopular = searchParams.get('farmaciaPopular') === 'true'
  const similarHolder = searchParams.get('similarHolder') || ''
  const pharmaceuticalForm = searchParams.get('pharmaceuticalForm') || ''

  const currentFilters: SearchFilters = useMemo(() => ({
    query: query || undefined,
    reference: reference || undefined,
    activeIngredient: activeIngredient || undefined,
    tradeName: tradeName || undefined,
    category: category || undefined,
    status: status || undefined,
    similarHolder: similarHolder || undefined,
    pharmaceuticalForm: pharmaceuticalForm || undefined,
    farmaciaPopular: farmaciaPopular || undefined,
  }), [query, reference, activeIngredient, tradeName, category, status, similarHolder, pharmaceuticalForm, farmaciaPopular])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const result = await searchMedicines(page, pageSize, currentFilters)
      setData(result)
      setLoading(false)
    }
    fetchData()
  }, [page, pageSize, currentFilters])

  const handlePageChange = useCallback((newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(newPage))
    router.push(`?${params.toString()}`)
  }, [searchParams, router])

  const handlePageSizeChange = useCallback((size: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('pageSize', String(size))
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }, [searchParams, router])

  const totalPages = Math.ceil(data.total / data.pageSize)

  return {
    data,
    loading,
    page,
    pageSize,
    currentFilters,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
    searchParams,
    router,
  }
}
