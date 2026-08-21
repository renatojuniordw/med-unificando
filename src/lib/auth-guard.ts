import { auth } from '@/auth'
import type { Session } from 'next-auth'

const UNAUTHORIZED = { success: false, error: 'Não autorizado' } as const

export async function withAuth<T extends { success: boolean }>(
  fn: (session: Session) => Promise<T>
): Promise<T | typeof UNAUTHORIZED> {
  const session = await auth()
  if (!session?.user) {
    return UNAUTHORIZED
  }
  return fn(session)
}

export async function withAuthReturn<T>(
  defaultValue: T,
  fn: (session: Session) => Promise<T>
): Promise<T> {
  const session = await auth()
  if (!session?.user) {
    return defaultValue
  }
  return fn(session)
}
