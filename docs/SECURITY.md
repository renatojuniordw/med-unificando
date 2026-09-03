# Segurança

## Visão Geral

Esta aplicação implementa múltiplas camadas de segurança seguindo princípios OWASP.

## Medidas Implementadas

### Autenticação
- **NextAuth v5** com Credentials provider e estratégia JWT
- Sessão expira em 24 horas (`maxAge: 86400`)
- Cookies `secure` em produção
- Senhas com hash bcrypt (salt + hash)
- JWT com `maxAge: 86400` e role/id no token

### Controle de Acesso
- **Páginas admin**: `/admin/(protected)/*` exigem sessão — o layout redireciona para `/admin/login`; `/admin/import` tem callback `authorized` no NextAuth
- **Server actions admin**: `withAdmin` / `withAdminReturn` em `src/lib/auth-guard.ts` (role `ADMIN`)
- **APIs admin**: `/api/search-analytics` e GET `/api/search-feedback` retornam 401 sem role `ADMIN`
- **Rate limit por rota** (`src/lib/rate-limit.ts` — `Map<string, { count, resetAt }>` em memória, janela 60s):
  - `/api/medicines`: 60 req/min/IP
  - `/api/autocomplete`: 120 req/min/IP
  - `POST /api/search-feedback`: 20 req/min/IP
  - `POST /admin/login`: 10 req/min/IP (via `src/middleware.ts`)
- Em excesso: `429` com header `Retry-After`

### Headers de Segurança
- `Content-Security-Policy`:
  ```
  default-src 'self'
  img-src 'self' https: data:
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
  font-src 'self' https://fonts.gstatic.com
  script-src 'self' 'unsafe-inline' 'unsafe-eval'
  connect-src 'self' https://dados.anvisa.gov.br
  frame-ancestors 'none'
  ```
- As fontes da aplicação são **self-hosted** via `next/font` (`/_next/static/media/...`, permitidas por `'self'`) — não há dependência de CDN de fontes no bundle
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` via Nginx
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Docker Security
- Containers rodando como não-root (UID 1001)
- `no-new-privileges: true`
- `cap_drop: ALL` + capabilities mínimas necessárias
- `read_only: true` no filesystem
- Portas internas (5432) não expostas externamente
- Rede isolada (`172.28.0.0/16`)
- Limites de memória e CPU

### Infraestrutura
- Nginx como reverse proxy com TLS 1.2/1.3
- Certificados Let's Encrypt com auto-renovação
- Rate limiting no Nginx (30 req/s API, 100 req/s geral)
- Cache de estáticos (assets: 30 dias, embeddings: 1 dia)
- Gzip para texto, CSS, JS, JSON

### Dados
- `.env` não commitado (`.gitignore`)
- Senhas não armazenadas em texto puro
- CSV sanitizado antes de parsing (remove chars de controle)
- `escapeCsv()` para prevenir injection em exports

### Sanitização de Input
- Feedback de busca validado em `src/lib/actions/search-feedback.ts`:
  - Verificação de campos obrigatórios (`query`, `medicineId`, `medicineName`, `feedback`)
  - Validação de enum (`helpful` | `not_helpful`)
  - `query` convertida para lowercase e trim (via `normalizeQuery`)
  - `query` limitada a 200 chars, `medicineName` a 300 chars
  - `medicineId` validado como inteiro positivo

### Vulnerabilidades Conhecidas

| Dependência | Severidade | Status |
|-------------|------------|--------|
| `xlsx@0.18.5` | High | **Mitigado** — CSV vem da ANVISA (fonte confiável), sanitização de input |
| `protobufjs@7.x` | Critical | **Mitigado** — `overrides` em `package.json` força versão segura |
| `postcss` | Moderate | **Mitigado** — next@16.2.10 limita exposição |

## Limitações Conhecidas

1. **Rate limit em memória** — Implementado via `Map<string, { count, resetAt }>` em `src/lib/rate-limit.ts`. Funciona para single-instância. Para múltiplas instâncias/workers, migrar para Redis.
2. **Spoofing de IP** — `getClientIp` usa o primeiro valor de `x-forwarded-for`. Em produção atrás de proxy, garantir que o proxy sobrescreva o header para não permitir burlar o limite por IP.
3. **xlsx@0.18.5** — Sem fix disponível para prototype pollution. Mitigado por ser fonte confiável (ANVISA).
4. **Autenticação simples** — Apenas email/senha com Credentials provider. Sem 2FA. Para produção com dados sensíveis, considerar 2FA.

## Relatório de Auditoria

Última auditoria realizada em 22/07/2026:
- 0 vulnerabilidades críticas abertas
- 0 vulnerabilidades altas abertas
- 8 false positives identificados e documentados

## Como Reportar Vulnerabilidades

Se encontrar uma vulnerabilidade, por favor reporte diretamente ao mantenedor do projeto via email.
