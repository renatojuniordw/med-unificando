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
    <section className="min-h-[80vh] flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-4">
            ACESSO RESTRITO
          </Badge>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-brutalist-black">
            ADMIN
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border-8 border-brutalist-black shadow-hard-lg p-8 space-y-6"
        >
          {error && (
            <div className="bg-error-red text-white border-4 border-brutalist-black shadow-hard-md p-4 font-black uppercase text-xs tracking-widest">
              {error}
            </div>
          )}

          <Input
            label="EMAIL"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="SENHA"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="secondary"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'ENTRANDO...' : 'ENTRAR'}
          </Button>
        </form>
      </div>
    </section>
  )
}
