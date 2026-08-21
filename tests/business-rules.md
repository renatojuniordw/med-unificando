# Mapped Business Rules

## format.ts — normalizeText

### Expected Behavior
**Input → Output:**
- When input is a string, should lowercase it, then title-case each word (capitalize first letter)
- When word is a stop word (de, da, do, das, dos, e, em, com, para, por, sem, sob, a, o, as, os, no, na, nos, nas, um, uma) and NOT the first word, should keep it lowercase
- When input is empty string, should return empty string
- When input is a single word, should capitalize it

### Validations and Rules
1. First word is ALWAYS capitalized, even if it's a stop word
2. Stop words in positions 2+ remain lowercase
3. Non-stop words are always capitalized

### Mapped Edge Cases
- Empty string → empty string
- Single word → capitalized
- All stop words → first capitalized, rest lowercase
- Mixed case input → normalized to title case

### Expected Error Scenarios
- None (pure function, no errors)

---

## format.ts — normalizeMedicine

### Expected Behavior
**Input → Output:**
- When input has fields in NORMALIZABLE_FIELDS, should normalize each with normalizeText
- When input has empty string in a normalizable field, should leave it unchanged
- When input has non-string fields, should leave them unchanged
- When input has fields NOT in NORMALIZABLE_FIELDS, should leave them unchanged

### Validations and Rules
1. NORMALIZABLE_FIELDS = activeIngredient, tradeName, similarHolder, pharmaceuticalForm, category, referenceMedicine, synonyms, indications, therapeuticClass, prescriptionType
2. Empty string fields are NOT normalized (length > 0 check)

### Mapped Edge Cases
- Object with no normalizable fields → returned unchanged
- Object with all normalizable fields empty → returned unchanged
- Object with mixed empty/non-empty fields → only non-empty normalized

---

## text-utils.ts — stripAccents

### Expected Behavior
**Input → Output:**
- When input has accented characters, should remove diacritics (NFD normalization + regex)
- When input has no accents, should return unchanged
- When input is empty string, should return empty string

### Validations and Rules
1. Uses Unicode NFD normalization then strips combining marks

---

## text-utils.ts — normalizeQuery

### Expected Behavior
**Input → Output:**
- Should lowercase and trim
- Should strip filler phrases: "remédio para ", "remedio para ", "medicamento para ", "tomar ", "preciso de ", "quero ", "buscar ", "procurar "
- Should collapse multiple spaces to single space

### Mapped Edge Cases
- "Remédio para dor" → "dor"
- "QUERO tomar ibuprofeno" → "ibuprofeno"
- "  múltiplos   espaços  " → "múltiplos espaços"
- Empty string → empty string

---

## keyword-utils.ts — getSynonymExpansion

### Expected Behavior
**Input → Output:**
- Should always include the stripped query (without "remédio para")
- Should expand via SYNONYM_MAP when query matches a key
- Should expand via COMPOUND_SUBJECTS when query contains a compound subject
- Should expand individual words if they match SYNONYM_MAP keys

### Validations and Rules
1. Strips "remédio para" prefix
2. Checks COMPOUND_SUBJECTS for substring match
3. Checks SYNONYM_MAP for exact key match (after accent stripping)
4. Checks individual words against SYNONYM_MAP

---

## keyword-utils.ts — buildOrTsQuery

### Expected Behavior
**Input → Output:**
- Single term → returns the term (sanitized)
- Multi-word term → joins with & (AND)
- Multiple terms → joins with | (OR)
- Stop words removed from each term
- Special chars sanitized: ' & | ! ( ) < > : * replaced with space

### Mapped Edge Cases
- Empty terms list → empty string
- All stop words → empty string
- Special characters → sanitized

---

## keyword-utils.ts — buildExpandedTsquery

### Expected Behavior
**Input → Output:**
- Strips "remédio para" and "medicamento para"
- Returns null if clean query < 2 chars
- Expands via getSynonymExpansion
- Builds OR tsquery via buildOrTsQuery

---

## search-preprocessor.ts — classifyQuery

### Expected Behavior
**Input → Output:**
- Empty query → { type: 'condition', confidence: 0 }
- "remédio para X" → { type: 'condition', confidence: 0.9 }
- Pharmaceutical form only → { type: 'condition', confidence: 0.6 }
- Therapeutic class only → { type: 'therapeutic-class', confidence: 0.8 }
- Condition keyword → { type: 'condition', confidence: 0.85 }
- 2+ categories → { type: 'mixed', confidence: 0.7 }
- Medicine name (suffix match or short query) → { type: 'medicine-name', confidence: 0.75 }
- Fallback → { type: 'condition', confidence: 0.4 }

### Validations and Rules
1. Medicine name detection: suffixes (lina, zepam, prazol, etc.), short query (<=2 words) without condition/form/class markers
2. Known condition synonyms in SYNONYM_MAP values are NOT medicine names

---

## search-relevance.ts — getRelevanceLabel

### Expected Behavior
**Input → Output:**
- score >= 0.50 → { tier: 'high', label: 'Alta correspondência' }
- score >= 0.25 → { tier: 'medium', label: 'Correspondência parcial' }
- score < 0.25 → { tier: 'low', label: 'Baixa correspondência' }

---

## score-adjustments.ts — applyScoreAdjustments

### Expected Behavior
- Empty results → returns empty
- Applies manual boosts (MANUAL_ADJUSTMENTS)
- Applies DB-driven boosts from searchFeedback table (requires >= 3 feedbacks)
- High approval (>= 0.8) → positive boost
- Low approval (<= 0.3) → negative boost
- Penalizes topical meds for "dor de cabeça" queries (-0.3)
- Penalizes non-gastric meds for "estômago" queries (-0.45)
- Extra penalty for ophthalmic meds in gastric queries (-0.6)
- Score clamped to [0, 1]
- Results with score <= 0.08 filtered out
- Results re-sorted by adjusted score

---

## auth-guard.ts — withAuth

### Expected Behavior
- When session exists with user → calls fn(session) and returns result
- When no session or no user → returns { success: false, error: 'Não autorizado' }

---

## auth-guard.ts — withAuthReturn

### Expected Behavior
- When session exists with user → calls fn(session) and returns result
- When no session or no user → returns defaultValue

---

## constants.ts

### Expected Behavior
- MEDICINE_LIMITS: object with numeric limits (MAX_SIMILARES: 10, SEARCH_LIMIT: 20, etc.)
- BATCH: { MEDICINE_IMPORT: 500, PRICE_IMPORT: 500 }
- YEARS: { MIN: '2000', MAX: '2030' }
- STORAGE_KEYS: string keys for localStorage
- THEME_COLORS: hex color strings
- PDF_COLORS: hex color strings
