import { createHash } from 'node:crypto'

export interface DiffRow {
  id: number
  [key: string]: unknown
}

export interface DiffPlan {
  toCreate: Record<string, unknown>[]
  toUpdate: { id: number; patch: Record<string, unknown> }[]
  toDeleteIds: number[]
  unchanged: number
}

// Fingerprint determinístico de uma linha sobre as chaves dadas — util para
// comparação canônica/hash em outros pontos (determinístico e ordem-independente).
export function computeFingerprint(row: Record<string, unknown>, keys: string[]): string {
  const canonical = keys
    .sort()
    .map(k => `${JSON.stringify(k)}:${JSON.stringify(row[k] ?? null)}`)
    .join('|')
  return createHash('md5').update(canonical).digest('hex')
}

function shallowEq(a: Record<string, unknown>, b: Record<string, unknown>, keys: string[]): boolean {
  for (const k of keys) {
    if (a[k] !== b[k]) return false
  }
  return true
}

// Planeja o diff preservando IDs. O CASAMENTO é pela chave estável (matchKey —
// ex.: "reference", ~única no dataset) com MULTIPLICIDADE (a mesma reference pode
// aparecer em N linhas — caso BIMOXIN). Assim:
//   - linhas idênticas → unchanged (nenhum toque no banco)
//   - linha do mesmo matchKey porém com conteúdo mudado → UPDATE mantendo o MESMO id
//   - excedente do matchKey → INSERT (novo id)
//   - existentes do matchKey não consumidos → DELETE
// Mudanças de conteúdo preservam a URL pública; só linhas realmente novas/removidas
// alteram o conjunto de ids.
export function planDiff(
  existing: DiffRow[],
  incoming: Record<string, unknown>[],
  contentKeys: string[],
  matchKey: string
): DiffPlan {
  // matchKey -> fila de linhas existentes (ordem por id asc mantém estabilidade)
  const byKey = new Map<string, DiffRow[]>()
  for (const row of existing) {
    const key = String(row[matchKey] ?? '')
    const queue = byKey.get(key)
    if (queue) queue.push(row)
    else byKey.set(key, [row])
  }

  const toCreate: Record<string, unknown>[] = []
  const toUpdate: { id: number; patch: Record<string, unknown> }[] = []
  let unchanged = 0

  for (const incomingRow of incoming) {
    const key = String(incomingRow[matchKey] ?? '')
    const queue = byKey.get(key)
    const candidate = queue && queue.length > 0 ? queue.shift() : undefined

    if (!candidate) {
      toCreate.push(incomingRow)
      continue
    }

    if (shallowEq(candidate, incomingRow, contentKeys)) {
      unchanged++
      continue
    }

    const patch: Record<string, unknown> = {}
    for (const k of contentKeys) {
      if (candidate[k] !== incomingRow[k]) patch[k] = incomingRow[k]
    }
    toUpdate.push({ id: candidate.id, patch })
  }

  // Restantes por matchKey = linhas que sumiram do source
  const toDeleteIds: number[] = []
  for (const queue of byKey.values()) {
    for (const row of queue) toDeleteIds.push(row.id)
  }

  return { toCreate, toUpdate, toDeleteIds, unchanged }
}