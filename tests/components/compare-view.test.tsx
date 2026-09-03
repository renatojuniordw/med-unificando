import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const mockUseSearchParams = vi.fn()
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockUseSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
}))

vi.mock('@/lib/actions/compare', () => ({
  getMedicinesByIds: vi.fn(),
  searchMedicinesForCompare: vi.fn(),
}))

import { getMedicinesByIds } from '@/lib/actions/compare'
import { CompareView } from '@/components/medicines/compare-view'

const ERROR_MESSAGE = 'Não foi possível carregar a comparação. Tente novamente.'
const RETRY_LABEL = 'Tentar novamente'

describe('CompareView — erro e retry (F7)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSearchParams.mockReturnValue(new URLSearchParams('ids=1'))
  })

  it('shows the error message and a retry button when loading fails', async () => {
    vi.mocked(getMedicinesByIds).mockRejectedValue(new Error('boom'))

    render(<CompareView />)

    expect(await screen.findByText(ERROR_MESSAGE)).toBeInTheDocument()
    expect(screen.getByText(RETRY_LABEL)).toBeInTheDocument()
  })

  it('recovers after clicking retry when the request succeeds', async () => {
    vi.mocked(getMedicinesByIds)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([] as never)

    render(<CompareView />)

    await screen.findByText(ERROR_MESSAGE)
    fireEvent.click(screen.getByText(RETRY_LABEL))

    await waitFor(() => expect(screen.queryByText(ERROR_MESSAGE)).not.toBeInTheDocument())
    expect(getMedicinesByIds).toHaveBeenCalledTimes(2)
  })

  it('does not call the action when there are no ids selected', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams(''))

    render(<CompareView />)

    expect(getMedicinesByIds).not.toHaveBeenCalled()
  })
})