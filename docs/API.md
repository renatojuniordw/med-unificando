# API REST

> Porta padrão: `11006`. Rate limit por IP implementado em `src/lib/rate-limit.ts` (in-memory, janela de 60s).

## GET /api/medicines

Lista medicamentos com paginação, filtros e exportação. Rate limit: **60 req/min/IP**.

### Parâmetros

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `page` | number | 1 | Número da página |
| `pageSize` | number | 20 | Itens por página (max 100) |
| `reference` | string | — | Filtro por número de registro (contains) |
| `activeIngredient` | string | — | Filtro por princípio ativo (contains) |
| `tradeName` | string | — | Filtro por nome comercial (contains) |
| `category` | string | — | Filtro exato por categoria (Similar, Genérico, etc.) |
| `status` | string | — | Filtro exato por situação (Ativo, Inativo) |
| `format` | string | — | Se `csv`, retorna CSV ao invés de JSON |

### Exemplos

```bash
# Paginação básica
curl "http://localhost:11006/api/medicines?page=1&pageSize=10"

# Filtro por categoria
curl "http://localhost:11006/api/medicines?category=Similar"

# Filtro por princípio ativo (case insensitive)
curl "http://localhost:11006/api/medicines?activeIngredient=ibuprofeno"

# Múltiplos filtros
curl "http://localhost:11006/api/medicines?category=Genérico&status=Ativo"

# Exportar como CSV
curl "http://localhost:11006/api/medicines?format=csv" -o medicamentos.csv
```

### Resposta (JSON)

```json
{
  "data": [
    {
      "id": 1,
      "reference": "106460143",
      "activeIngredient": "teicoplanina",
      "tradeName": "TEICOPLANINA",
      "similarHolder": "LABORATORIO QUIMICO FARMACEUTICO BERGAMO LTDA",
      "pharmaceuticalForm": "",
      "concentration": "",
      "inclusionDate": "",
      "category": "Similar",
      "referenceMedicine": null,
      "atcCode": null,
      "prescriptionType": null,
      "status": "Inativo",
      "authorization": null,
      "presentationCount": 0,
      "synonyms": null,
      "indications": null
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 32585,
    "totalPages": 1630
  }
}
```

### Resposta (CSV)

Colunas: `referencia,principio_ativo,nome_comercial,detentor,forma_farmaceutica,concentracao,categoria,codigo_atc,tarja,situacao`. Nome do arquivo: `medicamentos-{page}.csv`.

```
referencia,principio_ativo,nome_comercial,detentor,...
106460143,teicoplanina,TEICOPLANINA,LABORATORIO QUIMICO...
```

Erros: 400/500 com `{ "error": "..." }`; 429 com `{ "error": "Muitas requisições..." }` + header `Retry-After`.

## GET /api/autocomplete

Sugestões de medicamentos enquanto o usuário digita. Rate limit: **120 req/min/IP**.

### Parâmetros

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `q` | string | — | Termo de busca (mínimo 2 caracteres) |
| `limit` | number | 8 | Máximo de sugestões (max 20) |

### Exemplo

```bash
curl "http://localhost:11006/api/autocomplete?q=dipirona&limit=5"
```

### Resposta

```json
{
  "suggestions": [
    { "label": "ANFEBRIL", "sublabel": "dipirona" },
    { "label": "ANADOR", "sublabel": "dipirona" }
  ]
}
```

Implementação: busca por trigram (`pg_trgm`, operador `%`) em `tradeName`/`activeIngredient`, `GROUP BY` + `ORDER BY GREATEST(similarity(...)) DESC`, usa o índice GIN `idx_medicines_search_fields`. Com `q` < 2 caracteres retorna lista vazia; erros internos retornam `{ suggestions: [] }` com 500 (logado via `console.error`).

## POST /api/search-feedback

Envia feedback sobre resultado de busca. Rate limit: **20 req/min/IP**.

### Body

```json
{
  "query": "dor de cabeça",
  "medicineId": 123,
  "medicineName": "Paracetamol",
  "feedback": "helpful"
}
```

`feedback` pode ser `"helpful"` ou `"not_helpful"`. Validações: campos obrigatórios, `query` ≤ 200 chars, `medicineName` ≤ 300 chars, `medicineId` inteiro > 0, enum de feedback. `query` é normalizada (lowercase/trim).

### Resposta (201)

```json
{ "success": true }
```

Erros de validação: `{ "success": false, "error": "..." }`.

## GET /api/search-feedback

Retorna estatísticas de feedback (**admin apenas** — retorna 401 sem sessão com role `ADMIN`).

### Parâmetros

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `stats` | boolean | Se true, retorna estatísticas agregadas |
| `lowQuality` | boolean | Se true, retorna queries de baixa qualidade |

### Resposta (stats=true)

```json
{
  "total": 150,
  "helpful": 120,
  "notHelpful": 30,
  "helpfulRate": 0.8
}
```

## GET /api/search-analytics

Estatísticas das buscas registradas em `search_logs` (**admin apenas** — retorna 401 sem role `ADMIN`). Sem rate limit.

### Resposta

```json
{
  "topQueries": [{ "query": "dor de cabeça", "count": 45, "avg_score": 0.912 }],
  "noResultsQueries": [{ "query": "xyz", "count": 12 }],
  "performance": { "avg_ms": 210, "p95_ms": 480 },
  "totalSearchesLast7Days": 1024,
  "byType": [{ "query_type": "medicine-name", "count": 700 }]
}
```

Janelas: 30 dias para top queries / sem resultados / performance / tipo; 7 dias para total de buscas.

## GET /api/health

Health check da aplicação.

```bash
curl "http://localhost:11006/api/health"
```

### Resposta (sucesso — 200)

```json
{
  "status": "healthy",
  "timestamp": "2026-07-17T20:00:00.000Z",
  "database": "connected",
  "stats": {
    "medicines": 32585,
    "prices": 53422
  }
}
```

### Resposta (falha — 503)

```json
{
  "status": "unhealthy",
  "timestamp": "2026-07-17T20:00:00.000Z",
  "database": "disconnected"
}
```

## GET /api/auth/[...nextauth]

Endpoints do NextAuth v5 (Credentials provider, JWT). Handlers delegados de `src/auth.ts` (GET/POST).

## GET /sitemap.xml

Sitemap gerado dinamicamente com todas as URLs da aplicação (~32.585+ URLs):

```
/
/dashboard
/referencias
/atc
/sobre
/detentor/[cnpj]
/medicamento/1
/medicamento/2
...
/medicamento/32585
```

## GET /robots.txt

```txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://medicamentos.unificando.com.br/sitemap.xml
```

## Autenticação

- **Páginas admin**: `/admin/(protected)/*` exigem sessão (layout redireciona para `/admin/login`); `/admin/import` tem callback `authorized` no NextAuth.
- **Server actions admin**: usam `withAdmin` / `withAdminReturn` de `src/lib/auth-guard.ts` (role `ADMIN`).
- **APIs admin**: `/api/search-analytics` e GET `/api/search-feedback` verificam `session.user.role === 'ADMIN'` (401 se não).
- **Login**: POST `/admin/login` tem rate limit de **10 tentativas/min** via `src/proxy.ts` (429 + `Retry-After`).
- Sessão: JWT, expira em 24h, cookies `secure` em produção.

## Rate Limit

| Rota | Limite (por IP, janela 60s) |
|------|-----------------------------|
| `/api/medicines` | 60 req/min |
| `/api/autocomplete` | 120 req/min |
| `POST /api/search-feedback` | 20 req/min |
| `POST /admin/login` | 10 req/min (middleware) |

Implementação: `src/lib/rate-limit.ts` — `Map<string, { count, resetAt }>` em memória (janela fixa de 60s), adequado para instância única; para multi-instância, migrar para Redis. Em excesso, retorna `429 Too Many Requests` com header `Retry-After`.

> Atenção: `getClientIp` usa o primeiro valor de `x-forwarded-for` (ou `x-real-ip`). Em produção atrás de proxy, garanta que o proxy **sobrescreva** esses headers para evitar contornar o limite.