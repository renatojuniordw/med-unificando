import { vi } from 'vitest'
import type { Session } from 'next-auth'
import type { UpdateMedicineData } from '@/lib/actions/medicines-admin'

export const FULL_MEDICINE_UPDATE: UpdateMedicineData = {
  reference: '123',
  activeIngredient: 'Sub',
  tradeName: 'New',
  similarHolder: 'Co',
  pharmaceuticalForm: 'Comp',
  concentration: '10mg',
  inclusionDate: '2024-01-01',
  category: 'Similar',
  referenceMedicine: 'Ref',
  atcCode: 'A01',
  prescriptionType: 'Tarja',
  status: 'Ativo',
  authorization: 'Aut',
  presentationCount: 1,
  synonyms: '',
  indications: '',
}

/** Typed stand-in for `https.Agent`, used by `vi.mock('https', ...)` factories. */
export class MockAgent {
  options: Record<string, unknown>
  constructor(options: Record<string, unknown>) {
    this.options = options
  }
}

export interface MockHttpResponse {
  headers: Record<string, string>
  resume: () => void
  on: (event: string, handler: (chunk?: Buffer) => void) => MockHttpResponse
}

/** Builds a fake `IncomingMessage` that fires `data`/`end` listeners synchronously. */
export function createMockHttpsResponse(opts: { headers?: Record<string, string>; data?: string } = {}): MockHttpResponse {
  const { headers = {}, data } = opts
  const res: MockHttpResponse = {
    headers,
    resume: vi.fn(),
    on: vi.fn((event: string, handler: (chunk?: Buffer) => void) => {
      if (event === 'data' && data) handler(Buffer.from(data))
      if (event === 'end') handler()
      return res
    }),
  }
  return res
}

export type HttpsGetCallback = (res: MockHttpResponse) => void

/** `https.get` supports `(url, callback)` and `(url, options, callback)` — mirrors both. */
export type HttpsGetMock = (
  url: string,
  optionsOrCallback: Record<string, unknown> | HttpsGetCallback,
  callback?: HttpsGetCallback
) => { on: (event: string, handler: (...args: unknown[]) => void) => void }

export function mockHttpsGet(getFn: unknown) {
  return vi.mocked(getFn as HttpsGetMock)
}

export const MOCK_SESSION: Session = {
  user: { id: '1', role: 'admin' },
  expires: new Date(Date.now() + 86_400_000).toISOString(),
}

type AuthFn = () => Promise<Session | null>

/** `auth()` is overloaded (middleware factory vs. session getter); tests only use the 0-arg form. */
export function mockAuth(authFn: unknown) {
  return vi.mocked(authFn as AuthFn)
}
