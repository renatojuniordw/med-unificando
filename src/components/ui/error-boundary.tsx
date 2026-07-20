'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex items-center justify-center min-h-[40vh] p-8">
          <div className="bg-[var(--color-bg)] border border-border rounded-md shadow-card p-8 max-w-md text-center">
            <p className="font-semibold text-lg text-[var(--color-text)] mb-2">
              Algo deu errado
            </p>
            <p className="text-sm text-muted mb-4">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-brand-black text-white px-4 py-2 text-sm font-medium rounded-sm hover:bg-primary-light transition-colors"
            >
              Recarregar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
