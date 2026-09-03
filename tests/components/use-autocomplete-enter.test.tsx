import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { useAutocomplete } from '@/hooks/use-autocomplete'

function Harness({ itemCount, onSelect }: { itemCount: number; onSelect?: (i: number) => void }) {
  const { inputRef, handleKeyDown, containerRef } = useAutocomplete({ itemCount, onSelect })
  return (
    <div ref={containerRef}>
      <form onSubmit={(e) => e.preventDefault()}>
        <input ref={inputRef} onKeyDown={handleKeyDown} aria-label="busca" />
      </form>
    </div>
  )
}

function dispatchEnter(input: HTMLInputElement) {
  const ev = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
  const spy = vi.spyOn(ev, 'preventDefault')
  input.dispatchEvent(ev)
  return { spy }
}

describe('useAutocomplete — Enter (Fase 4)', () => {
  it('NÃO previne o default quando não há sugestão selecionada (form submete por teclado)', () => {
    const onSelect = vi.fn()
    const { getByLabelText } = render(<Harness itemCount={0} onSelect={onSelect} />)
    const input = getByLabelText('busca') as HTMLInputElement

    const { spy } = dispatchEnter(input)

    expect(spy).not.toHaveBeenCalled()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('previne o default e seleciona quando há sugestão destacada (seta + Enter)', () => {
    const onSelect = vi.fn()
    const { getByLabelText } = render(<Harness itemCount={3} onSelect={onSelect} />)
    const input = getByLabelText('busca') as HTMLInputElement

    fireEvent.keyDown(input, { key: 'ArrowDown' }) // activeIndex 0
    const { spy } = dispatchEnter(input)

    expect(spy).toHaveBeenCalled()
    expect(onSelect).toHaveBeenCalledWith(0)
  })
})