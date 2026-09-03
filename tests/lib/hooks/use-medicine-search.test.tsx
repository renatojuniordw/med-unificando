import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import type { SearchResponse } from '@/types'

let currentParams = new URLSearchParams('')
vi.mock('next/navigation', () => ({
  useSearchParams: () => currentParams,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

vi.mock('@/lib/actions/search', () => ({
  searchMedicines: vi.fn(),
}))

import { searchMedicines } from '@/lib/actions/search'
import { useMedicineSearch } from '@/lib/hooks/use-medicine-search'

const INITIAL: SearchResponse = { data: [], total: 0, page: 1, pageSize: 10 }

function Harness() {
  useMedicineSearch(INITIAL)
  return null
}

describe('useMedicineSearch — sem double-fetch no mount (Fase 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentParams = new URLSearchParams('')
    vi.mocked(searchMedicines).mockResolvedValue(INITIAL)
  })

  it('mount com initialData NÃO chama a action (o SSR já serviu os dados)', () => {
    render(<Harness />)
    expect(searchMedicines).not.toHaveBeenCalled()
  })

  it('muda a URL (page=2) → chama a action uma vez', () => {
    const { rerender } = render(<Harness />)
    expect(searchMedicines).not.toHaveBeenCalled()

    currentParams = new URLSearchParams('page=2')
    rerender(<Harness />)

    expect(searchMedicines).toHaveBeenCalledTimes(1)
    expect(searchMedicines).toHaveBeenCalledWith(2, 10, expect.anything())
  })
})