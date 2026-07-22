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
- Rotas `/admin/*` protegidas por middleware NextAuth
- Rate limit: 60 req/min por IP nas rotas `/api/*` — implementado via `src/proxy.ts` (middleware in-memory `Map<string, { count, resetAt }>`)
- Middleware previne acesso não autenticado ao admin

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
  - `query` convertida para lowercase e trim
  - `medicineId` validado como número via schema Prisma

### Vulnerabilidades Conhecidas

| Dependência | Severidade | Status |
|-------------|------------|--------|
| `xlsx@0.18.5` | High | **Mitigado** — CSV vem da ANVISA (fonte confiável), sanitização de input |
| `protobufjs@7.x` | Critical | **Mitigado** — `overrides` em `package.json` força versão segura |
| `postcss` | Moderate | **Mitigado** — next@16.2.10 limita exposição |

## Limitações Conhecidas

1. **Rate limit em memória** — Implementado via `Map<string, { count, resetAt }>` em `src/proxy.ts`. Funciona para single-worker. Para múltiplos workers, migrar para Redis.
2. **xlsx@0.18.5** — Sem fix disponível para prototype pollution. Mitigado por ser fonte confiável (ANVISA).
3. **Autenticação simples** — Apenas email/senha com Credentials provider. Sem 2FA. Para produção com dados sensíveis, considerar 2FA.

## Relatório de Auditoria

Última auditoria realizada em 22/07/2026:
- 0 vulnerabilidades críticas abertas
- 0 vulnerabilidades altas abertas
- 8 false positives identificados e documentados

## Como Reportar Vulnerabilidades

Se encontrar uma vulnerabilidade, por favor reporte diretamente ao mantenedor do projeto via email.
