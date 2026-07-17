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

```
referencia,principio_ativo,nome_comercial,detentor,...
106460143,teicoplanina,TEICOPLANINA,LABORATORIO QUIMICO...
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
    "prices": 53422
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

## Rate Limit

Todas as rotas `/api/*` têm limite de **60 requisições por minuto por IP**.

Em caso de excesso, retorna `429 Too Many Requests`.
