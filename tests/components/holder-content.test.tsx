import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const mockUseSearchParams = vi.fn()
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockUseSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
}))

vi.mock('@/lib/actions/search', () => ({
  getHolderMedicines: vi.fn(),
  searchAutocomplete: vi.fn(),
}))

import { getHolderMedicines, searchAutocomplete } from '@/lib/actions/search'
import { HolderContent } from '@/components/medicines/holder-content'
import type { SearchResponse } from '@/types'

const ERROR_MESSAGE = 'Não foi possível carregar os medicamentos. Tente novamente.'
const RETRY_LABEL = 'Tentar novamente'
const EMPTY: SearchResponse = { data: [], total: 0, page: 1, pageSize: 20 }

function renderHolder() {
  return render(
    <HolderContent
      holder="ABC"
      initialData={EMPTY}
      totalMedicines={0}
      ativos={0}
      categoriasCount={0}
    />
  )
}

describe('HolderContent — erro e retry (F7)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSearchParams.mockReturnValue(new URLSearchParams(''))
    vi.mocked(searchAutocomplete).mockResolvedValue([])
    vi.mocked(getHolderMedicines).mockResolvedValue(EMPTY)
  })

  it('shows the error banner and a retry button when loading fails', async () => {
    vi.mocked(getHolderMedicines).mockRejectedValue(new Error('boom'))

    renderHolder()

    expect(await screen.findByText(ERROR_MESSAGE)).toBeInTheDocument()
    expect(screen.getByText(RETRY_LABEL)).toBeInTheDocument()
  })

  it('clears the banner after retry succeeds', async () => {
    vi.mocked(getHolderMedicines)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(EMPTY)

    renderHolder()

    await screen.findByText(ERROR_MESSAGE)
    fireEvent.click(screen.getByText(RETRY_LABEL))

    await waitFor(() => expect(screen.queryByText(ERROR_MESSAGE)).not.toBeInTheDocument())
    expect(getHolderMedicines).toHaveBeenCalledTimes(2)
  })

  it('shows the empty state when there are no results', async () => {
    renderHolder()

    expect(await screen.findAllByText('Nenhum medicamento encontrado')).toHaveLength(2)
  })
})