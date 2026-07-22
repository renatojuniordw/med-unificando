# API REST

## GET /api/medicines

Lista medicamentos com paginação, filtros e exportação.

### Parâmetros

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `page` | number | 1 | Número da página |
| `pageSize` | number | 20 | Itens por página (max 100) |
| `reference` | string | — | Filtro por número de registro (LIKE insensitive) |
| `activeIngredient` | string | — | Filtro por princípio ativo (LIKE insensitive) |
| `tradeName` | string | — | Filtro por nome comercial (LIKE insensitive) |
| `category` | string | — | Filtro exato por categoria (Similar, Genérico, etc.) |
| `status` | string | — | Filtro exato por situação (Ativo, Inativo) |
| `pharmaceuticalForm` | string | — | Filtro por forma farmacêutica |
| `prescriptionType` | string | — | Filtro por tipo de prescrição (tarja) |
| `atcCode` | string | — | Filtro por código ATC |
| `farmaciaPopular` | boolean | — | Filtro por Farmácia Popular (true/false) |
| `therapeuticClass` | string | — | Filtro por classe terapêutica |
| `query` | string | — | Busca textual genérica |
| `sortBy` | string | — | Campo para ordenação |
| `sortOrder` | string | asc | asc ou desc |
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

# Filtro por forma farmacêutica e tipo de prescrição
curl "http://localhost:11006/api/medicines?pharmaceuticalForm=Comprimido&prescriptionType=Tarja%20Vermelha"

# Busca textual genérica
curl "http://localhost:11006/api/medicines?query=paracetamol"

# Ordenação por nome comercial
curl "http://localhost:11006/api/medicines?sortBy=tradeName&sortOrder=asc"

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

```
referencia,principio_ativo,nome_comercial,detentor,...
106460143,teicoplanina,TEICOPLANINA,LABORATORIO QUIMICO...
```

## POST /api/search-feedback

Envia feedback sobre resultado de busca.

### Body

```json
{
  "query": "dor de cabeça",
  "medicineId": 123,
  "medicineName": "Paracetamol",
  "feedback": "helpful"
}
```

`feedback` pode ser `"helpful"` ou `"not_helpful"`.

### Resposta (201)

```json
{ "success": true }
```

## GET /api/search-feedback

Retorna estatísticas de feedback (admin).

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
    "prices": 53422,
    "searchFeedback": 150
  }
}
```

### Resposta (falha — 503)

```json
{
  "status": "unhealthy",
  "timestamp": "2026-07-17T20:00:00.000Z",
  "database": "disconnected",
  "error": "ERRO: conexão recusada"
}
```

## GET /sitemap.xml

Sitemap gerado dinamicamente com todas as URLs da aplicação (~32.585+ URLs):

```
/
/dashboard
/referencias
/atc
/sobre
/detentor/[cnpj]
/admin/medicamentos
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

Rotas `/admin/*` são protegidas por NextAuth v5 (Credentials provider, JWT).

```
POST /api/auth/login — Login com email e senha
```

## Rate Limit

Todas as rotas `/api/*` têm limite de **60 requisições por minuto por IP**, implementado via middleware em `src/proxy.ts`.

Em caso de excesso, retorna `429 Too Many Requests`.
