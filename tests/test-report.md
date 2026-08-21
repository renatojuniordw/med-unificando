# Test Report — med-unificando

**Date:** 2026-08-21
**Framework:** Vitest 4.1.10 + jsdom + @testing-library/react

## Summary

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Test Files | 27 | 35 | +8 |
| Tests | 183 | 269 | +86 |
| Statements | — | 73.65% | — |
| Branches | — | 65.26% | — |
| Functions | — | 73.49% | — |
| Lines | — | 75.89% | — |

## New Test Files

| File | Module Tested | Tests |
|------|---------------|-------|
| `tests/lib/format.test.ts` | `src/lib/format.ts` | normalizeText (8), normalizeMedicine (5) |
| `tests/lib/text-utils.test.ts` | `src/lib/text-utils.ts` | stripAccents (4), normalizeQuery (11), PHARMACEUTICAL_FORMS (1), THERAPEUTIC_CLASSES (1) |
| `tests/lib/keyword-utils.test.ts` | `src/lib/keyword-utils.ts` | getSynonymExpansion (7), buildOrTsQuery (7), buildExpandedTsquery (5) |
| `tests/lib/search-preprocessor.test.ts` | `src/lib/search-preprocessor.ts` | classifyQuery (12) |
| `tests/lib/search-relevance.test.ts` | `src/lib/search-relevance.ts` | getRelevanceLabel (3) |
| `tests/lib/score-adjustments.test.ts` | `src/lib/score-adjustments.ts` | applyScoreAdjustments (10) |
| `tests/lib/auth-guard.test.ts` | `src/lib/auth-guard.ts` | withAuth (3), withAuthReturn (3) |
| `tests/lib/constants.test.ts` | `src/lib/constants.ts` | MEDICINE_LIMITS, BATCH, YEARS, STORAGE_KEYS, THEME_COLORS, PDF_COLORS (6) |
| `tests/business-rules.md` | — | Business rules documentation |

## Coverage by Module (New Tests)

| Module | Statements | Branches | Functions | Lines |
|--------|-----------|----------|-----------|-------|
| `keyword-utils.ts` | 97.22% | 95.00% | 100% | 100% |
| `score-adjustments.ts` | 98.71% | 88.13% | 100% | 98.61% |
| `search-preprocessor.ts` | 87.03% | 77.41% | 100% | 95.00% |
| `search-relevance.ts` | 100% | 100% | 100% | 100% |
| `auth-guard.ts` | 100% | 100% | 100% | 100% |
| `constants.ts` | 100% | 100% | 100% | 100% |
| `format.ts` | 100% | 100% | 100% | 100% |
| `text-utils.ts` | 100% | 100% | 100% | 100% |

## Traceability Matrix

| Business Rule | Test File | Test Case |
|---------------|-----------|-----------|
| normalizeText: title-casing | format.test.ts | "capitalizes the first word" |
| normalizeText: stop words | format.test.ts | "lowercases stop words in positions after the first" |
| normalizeText: first word always caps | format.test.ts | "capitalizes first word even if it is a stop word" |
| normalizeText: empty input | format.test.ts | "handles empty string" |
| normalizeMedicine: normalizable fields | format.test.ts | "normalizes normalizable fields" |
| normalizeMedicine: skip empty strings | format.test.ts | "does not normalize empty string fields" |
| stripAccents: diacritics removal | text-utils.test.ts | "removes accents from accented characters" |
| normalizeQuery: filler removal | text-utils.test.ts | "strips "remédio para" prefix" (+ 6 more) |
| getSynonymExpansion: SYNONYM_MAP | keyword-utils.test.ts | "expands via SYNONYM_MAP" |
| getSynonymExpansion: COMPOUND_SUBJECTS | keyword-utils.test.ts | "expands compound subjects" |
| buildOrTsQuery: AND/OR logic | keyword-utils.test.ts | "joins multi-word term with AND" |
| buildOrTsQuery: stop word removal | keyword-utils.test.ts | "removes stop words" |
| classifyQuery: "remédio para" | search-preprocessor.test.ts | "detects "remédio para X" as condition" |
| classifyQuery: medicine name | search-preprocessor.test.ts | "detects medicine name by suffix" |
| classifyQuery: mixed type | search-preprocessor.test.ts | "detects mixed type when 2+ categories present" |
| getRelevanceLabel: thresholds | search-relevance.test.ts | "returns high/medium/low tier" |
| applyScoreAdjustments: manual boost | score-adjustments.test.ts | "applies manual adjustment for "articulação" query" |
| applyScoreAdjustments: DB boost | score-adjustments.test.ts | "applies DB-driven boost for high approval" |
| applyScoreAdjustments: topical penalty | score-adjustments.test.ts | "penalizes topical meds for "dor de cabeça"" |
| applyScoreAdjustments: gastric penalty | score-adjustments.test.ts | "penalizes non-gastric meds for "estômago"" |
| applyScoreAdjustments: filter <= 0.08 | score-adjustments.test.ts | "filters out results with score <= 0.08" |
| withAuth: unauthorized | auth-guard.test.ts | "returns UNAUTHORIZED when no session" |
| withAuthReturn: default value | auth-guard.test.ts | "returns defaultValue when no session" |

## Run Commands

```bash
npx vitest run                    # Run all tests
npx vitest run --coverage         # Run with coverage report
npx vitest run --reporter=verbose # Verbose output
```
