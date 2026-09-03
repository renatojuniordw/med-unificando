# Test Report — med-unificando

**Date:** 2026-09-03
**Framework:** Vitest 4.1.10 + jsdom + @testing-library/react + Playwright (E2E)
**Escopo:** unit/componente (58 arquivos) + E2E (8 specs Playwright)

## Summary

| Métrica | Valor atual (2026-09-03) |
|---------|--------------------------|
| Test Files (unit) | 58 |
| Tests (unit) | 385 |
| Statements | 89.1% |
| Branches | 81.9% |
| Functions | 88.3% |
| Lines | **91.0%** |
| E2E specs | 8 (Playwright) |
| E2E tests | 18 |

> **Número oficial:** `npm run test:coverage` → Lines 91.0% · Stmts 89.1% · Branch 81.9% · Funcs 88.3%. Hooks incluídos na cobertura; `semantic-search.ts` excluído por design (injeta modelo on-device `@xenova/transformers`). Sempre citar o número do mesmo comando único (a discrepância histórica 74% vs 92% vinha de inclusões diferentes).

## E2E (Playwright)

`npm run test:e2e` — 8 specs / 18 testes, autossuficiente (sobe dev server em 11009 via `scripts/e2e-server.sh`, com warm-up; exige Postgres `medicamentos-db` no ar):

| Spec | Jornadas |
|------|----------|
| `smoke.spec.ts` | sanity da home |
| `busca-semantica.spec.ts` | happy + submit desabilitado + estado vazio |
| `busca-avancada.spec.ts` | happy com filtro + estado vazio |
| `detalhe-medicamento.spec.ts` | navegação até o detalhe + 404 |
| `comparacao.spec.ts` | happy (2 medicamentos) + estado vazio |
| `referencias.spec.ts` | happy + termo inexistente |
| `login-admin.spec.ts` | credenciais válidas/inválidas + **brute-force bloqueado (429)** (rate limit 10/min no callback) |
| `pwa.spec.ts` | manifest com ícones, PNGs válidos, service worker registrado |

Seletores via `data-testid` (76 atributos em 36 arquivos — ver rastreabilidade interna). Zero hard wait; cada jornada tem happy path + ≥1 caminho de falha.

## Cobertura por módulo-alvo

| Módulo | Cobertura (Lines) | Observação |
|--------|-------------------|------------|
| `src/app/api/autocomplete/route.ts` | ~93% | validação/clamp/erro |
| `src/app/api/search-analytics/route.ts` | coberto (401/403/200/500) | auth admin |
| `src/app/api/health/route.ts` | coberto (200/503) | health |
| `src/lib/actions/search.ts` | ~100% | searchAutocomplete/holder/count/clamp |
| `src/lib/actions/atc.ts` | coberto | counts global + levels |
| `src/lib/rate-limit*.ts` | coberto | janela/sweep/429 |
| `src/lib/sync-diff.ts` | coberto | multiplicidade/matchKey (IDs estáveis) |
| `src/lib/hooks/use-medicine-search.ts` | ~83% | sem double-fetch no mount |

## Casos Não Cobertos (justificados)

- `src/lib/actions/semantic-search.ts` — excluído por design (modelo on-device pesado)
- Geração de PDF / interações de browser de baixo valor — mock contraverteria F.I.R.S.T.
- `scripts/` de rede/DB — sem lógica pura; smoke dedicado (`smoke-sync-ids.ts`)

## Gates

| Gate | Resultado |
|------|-----------|
| `npm run lint` | ✅ 0 |
| `npm run typecheck` | ✅ 0 |
| `npm test` | ✅ 58 files / 385 tests |
| `npm run build` | ✅ 0 |
| `npm run test:e2e` | ✅ 18/18 (com Postgres no ar) |