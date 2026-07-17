# Home Estilo Google com Busca Semântica Única — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the home page (`/`) into a minimal, Google-style single search box (semantic search only), move the existing filter/table browsing experience to a new `/buscar-avancado` route, and let users toggle semantic search results between cards and a read-only table.

**Architecture:** No new dependencies or backend logic. Pure frontend restructuring: extract a reusable `columns` constant, add a new read-only table component fed by already-fetched client state, extend `SemanticSearch` with a view toggle, split the current home content into a static minimal home plus a moved advanced-search route, and add one nav link.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS. No test runner is configured in this repo — verification is manual (dev server) plus `tsc --noEmit` and `next lint`.

## Global Constraints

- Design spec: `docs/superpowers/specs/2026-07-17-busca-google-style-home-design.md` — every task below implements one of its sections.
- No automated UI test suite exists in this repo (confirmed via `package.json` — only `dev`/`build`/`start`/`lint`). Do not invent a test framework; verify via `npx tsc --noEmit`, `npm run lint`, and manual checks on `npm run dev` (port 11006).
- Preserve the brutalist visual language already in use (`border-4`/`border-8 border-brutalist-black`, `shadow-hard-lg`, `bg-neon-yellow`, uppercase black font classes) — match existing class patterns exactly, don't introduce new design tokens.
- Do not modify `semanticSearch` (`src/lib/actions/semantic-search.ts`), `searchMedicines`/`getDistinctValues` (`src/lib/actions/search.ts`), `SearchForm`, or `ExportButton` logic — only relocate where they're rendered.
- No comparar/exportar functionality in the new semantic results table (per spec, confirmed with user).

---

### Task 1: Export shared `columns` constant from `MedicineTable`

**Files:**
- Modify: `src/components/medicines/medicine-table.tsx:12`

**Interfaces:**
- Produces: `export const columns: { key: string; label: string; mobile: boolean }[]` — consumed by Task 2's `SemanticResultsTable`.

- [ ] **Step 1: Export the existing `columns` constant**

In `src/components/medicines/medicine-table.tsx`, change line 12 from:

```ts
const columns = [
```

to:

```ts
export const columns = [
```

No other changes to this file — the array contents (reference, activeIngredient, tradeName, similarHolder, category, status, pharmaceuticalForm, concentration, inclusionDate) stay exactly as they are.

- [ ] **Step 2: Typecheck**

Run: `cd "/Users/renatobezerra/Repositórios/Medicine/medicamentos" && npx tsc --noEmit`
Expected: no new errors related to `medicine-table.tsx`.

- [ ] **Step 3: Commit**

```bash
cd "/Users/renatobezerra/Repositórios/Medicine/medicamentos"
git add src/components/medicines/medicine-table.tsx
git commit -m "refactor: export columns constant from MedicineTable for reuse"
```

---

### Task 2: Create `SemanticResultsTable` (read-only results table)

**Files:**
- Create: `src/components/medicines/semantic-results-table.tsx`

**Interfaces:**
- Consumes: `columns` from `src/components/medicines/medicine-table.tsx` (Task 1); `MedicineResult` type from `@/types`.
- Produces: `export function SemanticResultsTable(props: { results: { score: number; medicine: MedicineResult }[] })` — consumed by Task 3's `SemanticSearch`.

- [ ] **Step 1: Write the component**

Create `src/components/medicines/semantic-results-table.tsx`:

```tsx
import Link from 'next/link'
import { columns } from '@/components/medicines/medicine-table'
import type { MedicineResult } from '@/types'

interface SemanticResultsTableProps {
  results: { score: number; medicine: MedicineResult }[]
}

export function SemanticResultsTable({ results }: SemanticResultsTableProps) {
  return (
    <div className="overflow-x-auto border-4 border-brutalist-black">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-brutalist-black text-neon-yellow">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left p-4 font-black uppercase tracking-wider text-xs border-r-4 border-neon-yellow last:border-r-0"
              >
                {col.label}
              </th>
            ))}
            <th className="text-left p-4 font-black uppercase tracking-wider text-xs w-24">
              RELEVÂNCIA
            </th>
          </tr>
        </thead>
        <tbody>
          {results.map(({ score, medicine }, index) => (
            <tr
              key={medicine.id}
              className={`border-t-4 border-brutalist-black hover:bg-neon-yellow/20 transition-colors ${
                index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
              }`}
            >
              {columns.map((col) => {
                const value = (medicine as unknown as Record<string, string>)[col.key]
                const display = value ?? ''
                if (col.key === 'tradeName' || col.key === 'reference') {
                  return (
                    <td key={col.key} className="p-4 text-sm font-bold uppercase">
                      <Link
                        href={`/medicamento/${medicine.id}`}
                        className="hover:bg-neon-yellow hover:text-brutalist-black transition-colors"
                      >
                        {display}
                      </Link>
                    </td>
                  )
                }
                return (
                  <td key={col.key} className="p-4 text-sm font-bold uppercase">
                    {display}
                  </td>
                )
              })}
              <td className="p-4 text-sm font-bold text-slate-500">
                {(score * 100).toFixed(0)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `cd "/Users/renatobezerra/Repositórios/Medicine/medicamentos" && npx tsc --noEmit`
Expected: no errors in `semantic-results-table.tsx`.

- [ ] **Step 3: Commit**

```bash
cd "/Users/renatobezerra/Repositórios/Medicine/medicamentos"
git add src/components/medicines/semantic-results-table.tsx
git commit -m "feat: add read-only table view for semantic search results"
```

---

### Task 3: Extend `SemanticSearch` with cards/table toggle and outer frame

**Files:**
- Modify: `src/components/medicines/semantic-search.tsx`

**Interfaces:**
- Consumes: `SemanticResultsTable` from Task 2 (`src/components/medicines/semantic-results-table.tsx`).
- Produces: `export function SemanticSearch()` — unchanged export signature, consumed by Task 4's home page.

- [ ] **Step 1: Add the view toggle state and outer frame**

Replace the full contents of `src/components/medicines/semantic-search.tsx` with:

```tsx
'use client'

import { useState } from 'react'
import { semanticSearch } from '@/lib/actions/semantic-search'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SemanticResultsTable } from '@/components/medicines/semantic-results-table'
import Link from 'next/link'
import type { MedicineResult } from '@/types'

export function SemanticSearch() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ score: number; medicine: MedicineResult }[]>([])
  const [searched, setSearched] = useState(false)
  const [view, setView] = useState<'cards' | 'table'>('cards')

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)

    try {
      const data = await semanticSearch(query, 20)
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border-4 md:border-8 border-brutalist-black bg-white shadow-hard-lg p-6 md:p-10">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="secondary">BUSCA SEMÂNTICA</Badge>
        <span className="text-[9px] font-mono text-slate-400">
          IA local — descreva o medicamento
        </span>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            label=""
            placeholder='Ex: "anti-inflamatório para articulação" ou "remédio para pressão"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="self-end"
        >
          {loading ? 'PENSANDO...' : 'BUSCAR'}
        </Button>
      </div>

      {loading && (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="mt-6 border-t-4 border-brutalist-black pt-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-[10px] font-mono font-bold text-slate-500">
              Resultados por relevância semântica
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={view === 'cards' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setView('cards')}
              >
                CARDS
              </Button>
              <Button
                type="button"
                variant={view === 'table' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setView('table')}
              >
                TABELA
              </Button>
            </div>
          </div>

          {view === 'cards' ? (
            <div className="space-y-2">
              {results.map(r => (
                <Link
                  key={r.medicine.id}
                  href={`/medicamento/${r.medicine.id}`}
                  className="block border-2 border-brutalist-black p-3 hover:bg-neon-yellow transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="font-black uppercase text-sm">{r.medicine.tradeName}</span>
                      <p className="text-[10px] font-mono text-slate-600 truncate">{r.medicine.activeIngredient}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.medicine.category && <Badge variant="primary">{r.medicine.category}</Badge>}
                      {r.medicine.status === 'Ativo' && <span className="text-[9px] font-black text-success-green">ATIVO</span>}
                      <span className="text-[9px] font-mono text-slate-400">
                        {(r.score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-[9px] font-mono text-slate-400 mt-1 truncate">{r.medicine.similarHolder}</p>
                </Link>
              ))}
            </div>
          ) : (
            <SemanticResultsTable results={results} />
          )}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="mt-4 text-sm font-mono text-slate-500">
          Nenhum resultado encontrado. Tente descrever de outra forma.
        </p>
      )}
    </div>
  )
}
```

Changes from the original: added `view` state, added the toggle UI (only rendered when `results.length > 0`), added the outer `border-8`/`shadow-hard-lg` frame (previously supplied by the wrapping `<div>` in `page.tsx`), and branched cards vs. `SemanticResultsTable` rendering. The card markup itself, loading skeleton, and empty state are untouched.

- [ ] **Step 2: Check the `Button` component supports `variant="ghost"` and `size="sm"`**

Run: `grep -n "variant\|size" "/Users/renatobezerra/Repositórios/Medicine/medicamentos/src/components/ui/button.tsx"`
Expected: both `ghost` variant and `sm` size already exist (used today by `MedicineTable`'s pagination buttons). If either is missing, stop and report — do not invent new variant/size styling as part of this task.

- [ ] **Step 3: Typecheck**

Run: `cd "/Users/renatobezerra/Repositórios/Medicine/medicamentos" && npx tsc --noEmit`
Expected: no errors in `semantic-search.tsx`.

- [ ] **Step 4: Commit**

```bash
cd "/Users/renatobezerra/Repositórios/Medicine/medicamentos"
git add src/components/medicines/semantic-search.tsx
git commit -m "feat: add cards/table toggle to semantic search results"
```

---

### Task 4: Rewrite home page (`/`) as minimal single search box

**Files:**
- Modify: `src/app/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `SemanticSearch` from `src/components/medicines/semantic-search.tsx` (Task 3, unchanged export).

- [ ] **Step 1: Replace `src/app/page.tsx` contents**

```tsx
import Link from 'next/link'
import { SemanticSearch } from '@/components/medicines/semantic-search'
import { Badge } from '@/components/ui/badge'

export default function HomePage() {
  return (
    <section className="py-16 md:py-28 bg-neon-yellow min-h-screen border-b-8 border-brutalist-black">
      <div className="max-w-3xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-6">
            LISTA ANVISA
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9] text-brutalist-black">
            Medicamentos
            <br />
            Intercambiáveis
          </h1>
          <p className="mt-6 text-sm font-mono font-bold uppercase text-brutalist-black max-w-2xl mx-auto">
            Consulte medicamentos similares e seus respectivos medicamentos de
            referência conforme dados abertos ANVISA
          </p>
        </div>

        <SemanticSearch />

        <p className="mt-6 text-center">
          <Link
            href="/buscar-avancado"
            className="text-xs font-mono font-bold uppercase text-brutalist-black underline hover:text-slate-600 transition-colors"
          >
            Busca avançada e listagem completa →
          </Link>
        </p>
      </div>
    </section>
  )
}
```

This removes the `async` data fetching (`searchMedicines`, `getDistinctValues`), the `Suspense` wrapper, `SearchForm`, and `MedicineTable` imports/usage entirely from this file — they move to Task 5's new route.

- [ ] **Step 2: Typecheck**

Run: `cd "/Users/renatobezerra/Repositórios/Medicine/medicamentos" && npx tsc --noEmit`
Expected: no errors in `page.tsx`. Note: `/buscar-avancado` doesn't exist yet, so the link will 404 until Task 5 — that's expected at this point in the plan.

- [ ] **Step 3: Commit**

```bash
cd "/Users/renatobezerra/Repositórios/Medicine/medicamentos"
git add src/app/page.tsx
git commit -m "feat: simplify home to a single Google-style semantic search box"
```

---

### Task 5: Create `/buscar-avancado` route with the previous home content

**Files:**
- Create: `src/app/buscar-avancado/page.tsx`

**Interfaces:**
- Consumes: `searchMedicines`, `getDistinctValues` from `@/lib/actions/search`; `SearchForm` from `@/components/medicines/search-form`; `MedicineTable` from `@/components/medicines/medicine-table`.

- [ ] **Step 1: Create the route**

Create `src/app/buscar-avancado/page.tsx`:

```tsx
import { Suspense } from 'react'
import { searchMedicines, getDistinctValues } from '@/lib/actions/search'
import { SearchForm } from '@/components/medicines/search-form'
import { MedicineTable } from '@/components/medicines/medicine-table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export default async function BuscaAvancadaPage() {
  const initialData = await searchMedicines(1, 10)
  const [references, activeIngredients, tradeNames, categories] = await Promise.all([
    getDistinctValues('reference'),
    getDistinctValues('activeIngredient'),
    getDistinctValues('tradeName'),
    getDistinctValues('category'),
  ])

  return (
    <section className="py-12 md:py-20 bg-neon-yellow border-b-8 border-brutalist-black">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-6">
            BUSCA AVANÇADA
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-brutalist-black">
            Medicamentos
            <br />
            Intercambiáveis
          </h1>
          <p className="mt-6 text-sm font-mono font-bold uppercase text-brutalist-black max-w-2xl mx-auto">
            Filtre por referência, princípio ativo, nome comercial ou categoria
            e navegue pela base completa
          </p>
        </div>

        <Suspense fallback={<div className="bg-white border-8 border-brutalist-black shadow-hard-lg p-6 md:p-10"><Skeleton className="h-12 w-full mb-4" /><Skeleton className="h-64 w-full" /></div>}>
          <div className="bg-white border-8 border-brutalist-black shadow-hard-lg p-6 md:p-10">
            <SearchForm
              references={references}
              activeIngredients={activeIngredients}
              tradeNames={tradeNames}
              categories={categories}
            />
            <div className="mt-8">
              <MedicineTable initialData={initialData} />
            </div>
          </div>
        </Suspense>
      </div>
    </section>
  )
}
```

This is the previous `src/app/page.tsx` content with `SemanticSearch` removed and the badge/subtitle text adjusted per the spec (badge "BUSCA AVANÇADA" instead of "LISTA ANVISA", subtitle referencing filtering instead of the generic ANVISA blurb). `SearchForm` and `MedicineTable` behavior (filters, pagination, compare, export) is otherwise identical to before.

- [ ] **Step 2: Typecheck**

Run: `cd "/Users/renatobezerra/Repositórios/Medicine/medicamentos" && npx tsc --noEmit`
Expected: no errors in `buscar-avancado/page.tsx`.

- [ ] **Step 3: Commit**

```bash
cd "/Users/renatobezerra/Repositórios/Medicine/medicamentos"
git add src/app/buscar-avancado/page.tsx
git commit -m "feat: move filters and full table browsing to /buscar-avancado"
```

---

### Task 6: Add "BUSCA AVANÇADA" to header navigation

**Files:**
- Modify: `src/components/layout/header.tsx:6-12`

**Interfaces:** None (leaf change, no new exports).

- [ ] **Step 1: Add the nav link**

In `src/components/layout/header.tsx`, change the `navLinks` array from:

```ts
const navLinks = [
  { href: "/", label: "MEDICAMENTOS" },
  { href: "/referencias", label: "REFERÊNCIAS" },
  { href: "/atc", label: "ATC" },
  { href: "/dashboard", label: "DASHBOARD" },
  { href: "/admin/import", label: "ADMIN" },
];
```

to:

```ts
const navLinks = [
  { href: "/", label: "MEDICAMENTOS" },
  { href: "/buscar-avancado", label: "BUSCA AVANÇADA" },
  { href: "/referencias", label: "REFERÊNCIAS" },
  { href: "/atc", label: "ATC" },
  { href: "/dashboard", label: "DASHBOARD" },
  { href: "/admin/import", label: "ADMIN" },
];
```

This single array drives both the desktop nav (`nav.hidden.lg:flex`) and the mobile menu (`nav.lg:hidden`) — no other changes needed in this file.

- [ ] **Step 2: Typecheck and lint**

Run: `cd "/Users/renatobezerra/Repositórios/Medicine/medicamentos" && npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/renatobezerra/Repositórios/Medicine/medicamentos"
git add src/components/layout/header.tsx
git commit -m "feat: add Busca Avançada link to header navigation"
```

---

### Task 7: Manual end-to-end verification

**Files:** None (verification only).

- [ ] **Step 1: Start the dev server**

Run: `cd "/Users/renatobezerra/Repositórios/Medicine/medicamentos" && npm run dev`
Expected: server starts on `http://localhost:11006` without errors.

- [ ] **Step 2: Verify the new home**

Open `http://localhost:11006/`. Expected:
- Only the hero (badge, title, subtitle) and the semantic search box are visible — no filters, no table, no dashboard stats.
- The "Busca avançada e listagem completa →" link is visible below the search box.

- [ ] **Step 3: Verify semantic search + view toggle**

In the search box, type `anti-inflamatório para articulação` and submit. Expected:
- Loading skeletons appear, then result cards render (same as before this change).
- A "CARDS"/"TABELA" toggle appears above the results.
- Clicking "TABELA" swaps to the table view with the same medicines, a relevance % column, and working links to `/medicamento/[id]`.
- Clicking "CARDS" swaps back with no re-fetch (network tab shows no new request).

- [ ] **Step 4: Verify empty state**

Search a nonsense query (e.g. `zzzxxqqq123`). Expected: "Nenhum resultado encontrado. Tente descrever de outra forma." message, no toggle shown.

- [ ] **Step 5: Verify `/buscar-avancado`**

Click "Busca avançada e listagem completa" from the home, or navigate to `http://localhost:11006/buscar-avancado`. Expected:
- Filter fields (Referência, Princípio Ativo, Nome Comercial, Categoria) and the full paginated table render, matching the old home's behavior exactly.
- Filtering, pagination, selecting 2+ rows to compare (redirects to `/compare?ids=...`), and exporting all still work.

- [ ] **Step 6: Verify header navigation**

Expected: "BUSCA AVANÇADA" appears in the desktop nav bar and in the mobile hamburger menu (resize window or use device toolbar), both linking to `/buscar-avancado`.

- [ ] **Step 7: Full build check**

Run: `cd "/Users/renatobezerra/Repositórios/Medicine/medicamentos" && npm run build`
Expected: build completes with no type or lint errors.

No commit for this task — it's verification only. If any step fails, fix the relevant task's file and re-run the affected verification steps before proceeding.
