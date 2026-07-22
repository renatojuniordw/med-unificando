'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Credenciais inválidas')
      setLoading(false)
      return
    }

    router.push('/admin/import')
    router.refresh()
  }

  return (
    <section className="min-h-[80vh] flex items-center justify-center bg-[var(--color-bg)] p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Badge variant="primary" className="mb-4">
            Acesso Restrito
          </Badge>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-[var(--color-text)]">
            Admin
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[var(--color-bg)] border border-border rounded-md shadow-card p-8 space-y-6"
        >
          {error && (
            <div className="bg-error text-white rounded-sm p-3 text-sm font-medium" role="alert">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-invalid={error ? 'true' : 'false'}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-[var(--color-text-secondary)]">
                Senha
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="text-xs text-muted hover:text-[var(--color-text)] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-invalid={error ? 'true' : 'false'}
                className="w-full border border-[var(--color-border)] rounded-sm px-3 py-2.5 min-h-[44px] text-sm bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-black focus:ring-offset-1 dark:focus:ring-offset-[var(--color-bg)] transition-shadow pr-10"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </section>
  )
}
