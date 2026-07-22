# Deploy

## Docker Compose (Produção)

### Pré-requisitos
- Docker Engine 24+
- Docker Compose v2

### Passos

```bash
# 1. Clone
git clone git@github.com:renatojuniordw/med-unificando.git
cd med-unificando

# 2. Configure
cp .env.example .env
# Preencha DB_PASSWORD, AUTH_SECRET, ADMIN_PASSWORD (obrigatórios)

# 3. Build
docker compose build --no-cache

# 4. Suba tudo
docker compose up -d

# 5. Verifique
curl http://localhost:11006/api/health

# 6. Acesse
open http://localhost:11006
```

> O `docker-entrypoint.sh` executa automaticamente na primeira inicialização:
> 1. `prisma migrate deploy` — schema
> 2. `prisma/seed.ts` — ANVISA + admin
> 3. `scripts/sync-farmacia-popular.ts` — Farmácia Popular
> 4. `scripts/backfill-indications.ts` — indicações
> 5. `scripts/generate-search-index.ts` — embeddings (~118MB)
> 6. `scripts/generate-tsvector.ts` — busca textual

### Atualizar

```bash
git pull
npm run docker:build
npm run docker:up
```

### Logs

```bash
docker compose logs -f app     # App
docker compose logs -f db      # Banco
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run docker:build` | Build sem cache |
| `npm run docker:up` | `docker compose up -d` |
| `npm run docker:down` | `docker compose down` |
| `npm run seed` | Seed ANVISA manual |
| `npm run farmacia-popular` | Sincronizar Farmácia Popular |
| `npm run search-index` | Regenerar embeddings |
| `npm run tsvector` | Regenerar índice textual |
| `npm run backfill-indications` | Preencher indicações |

## Variáveis de Ambiente

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `DB_PASSWORD` | Sim | Senha do PostgreSQL (gerar com `openssl rand -base64 18`) |
| `DATABASE_URL` | Sim | Conexão PostgreSQL (docker: `postgresql://admin:{DB_PASSWORD}@db:5432/medicamentos`) |
| `AUTH_SECRET` | Sim | Chave JWT (`openssl rand -base64 32`) |
| `ADMIN_EMAIL` | Sim | Email do admin inicial |
| `ADMIN_PASSWORD` | Sim | Senha do admin inicial |
| `NODE_ENV` | Não | `production` (default) |
| `PORT` | Não | `11006` (default) |
| `BASE_URL` | Não | URL base para sitemap/robots (`https://seudominio.com.br`) |
| `EMBEDDING_MODEL` | Não | Modelo de embedding (`Xenova/multilingual-e5-small`) |
| `ANVISA_THERAPEUTIC_CLASS_URL` | Não | URL do CSV de classes terapêuticas |
| `NEXT_TELEMETRY_DISABLED` | Não | `1` (default no Docker) |

## VPS (Servidor Dedicado)

### Segurança recomendada

```bash
# Firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 11006
ufw enable

# Fail2ban
apt install fail2ban
systemctl enable fail2ban

# Docker non-root
sudo usermod -aG docker $USER
```

### Proxy reverso (Nginx + SSL)

```nginx
server {
    listen 443 ssl http2;
    server_name medicamentos.seudominio.com;

    ssl_certificate /etc/letsencrypt/live/medicamentos.seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/medicamentos.seudominio.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy strict-origin-when-cross-origin;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()";

    # Cache de assets estáticos (Next.js hashes os filenames)
    location /_next/static/ {
        proxy_pass http://127.0.0.1:11006;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location /favicon.ico {
        proxy_pass http://127.0.0.1:11006;
        expires 30d;
    }

    location / {
        proxy_pass http://127.0.0.1:11006;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name medicamentos.seudominio.com;
    return 301 https://$server_name$request_uri;
}
```

### Sincronização automática (Cron)

Ver `CRON.md` para instruções detalhadas.

```bash
# Editar crontab
crontab -e
```

```cron
# Embeddings — toda segunda às 2h
0 2 * * 1 docker exec medicamentos-app npx tsx scripts/generate-search-index.ts >> /var/log/sync.log 2>&1

# ANVISA — todo domingo às 3h
0 3 * * 0 docker exec medicamentos-app sh -c "NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx prisma/seed.ts" >> /var/log/sync.log 2>&1

# Farmácia Popular — todo domingo às 3h30 (após ANVISA)
30 3 * * 0 docker exec medicamentos-app npx tsx scripts/sync-farmacia-popular.ts >> /var/log/sync.log 2>&1

# Backup do banco — todo domingo às 4h
0 4 * * 0 docker exec medicamentos-db pg_dump -U admin medicamentos | gzip > /backups/medicamentos-$(date +\%Y\%m\%d).sql.gz
```

> O container `medicamentos-app` precisa estar rodando para `docker exec` funcionar.

## Backup

### Backup manual

```bash
docker exec medicamentos-db pg_dump -U admin medicamentos > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Backup automático via cron (exemplo acima)

### Restaurar

```bash
cat backup.sql | docker exec -i medicamentos-db psql -U admin medicamentos
```

## Performance

| Recurso | Mínimo | Recomendado | Motivo |
|---------|--------|-------------|--------|
| CPU | 1 core | 2 cores | Modelo de IA na inicialização |
| RAM | 512MB (app) + 256MB (db) | 1GB (app) + 512MB (db) | Embeddings multilingual-e5-small (~118MB em RAM) |
| Disco | 2GB | 10GB | Dados + logs + backups + cache de modelo (~240MB) |
| Docker | 24+ | 24+ | Suporte a healthcheck e resource limits |

## Docker Security

A configuração atual do `docker-compose.yml` já inclui:

- **Rede isolada**: bridge `/16` privada
- **Memória limitada**: db 512M, app 1G (reserva 256M)
- **CPU limitada**: db 1 core, app 2 cores
- **read_only**: filesystem root readonly
- **tmpfs**: `/tmp` em RAM
- **no-new-privileges**: impede escalonamento
- **cap_drop ALL**: remove todas as capacidades Linux
- **cap_add seletivo**: apenas o necessário (NET_BIND_SERVICE para app, CHOWN/DAC_OVERRIDE/SETUID/SETGID para db)
- **Non-root user**: UID 1001 (app)
- **Healthcheck**: monitoramento contínuo (app: curl `/api/health`, db: pg_isready)
- **Volume persistente**: `transformers_cache` para cache do modelo (~240MB)
- **Portas privadas**: `127.0.0.1:` bind, sem exposição pública direta
