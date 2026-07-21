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
# Edite AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD

# 3. Suba tudo
docker compose up -d

# 4. Verifique
curl http://localhost:11006/api/health

# 5. Acesse
open http://localhost:11006
```

### Atualizar

```bash
git pull
docker compose build --no-cache app
docker compose up -d
```

### Logs

```bash
docker compose logs -f app     # App
docker compose logs -f db      # Banco
```

## Variáveis de Ambiente

| Variável | Docker | Manual | Descrição |
|----------|--------|--------|-----------|
| `DATABASE_URL` | `postgresql://admin:admin123@db:5432/medicamentos` | `postgresql://admin:admin123@localhost:5432/medicamentos` | Conexão PostgreSQL |
| `AUTH_SECRET` | `${AUTH_SECRET}` | `openssl rand -base64 32` | Chave JWT |
| `ADMIN_EMAIL` | `${ADMIN_EMAIL}` | — | Email admin |
| `ADMIN_PASSWORD` | `${ADMIN_PASSWORD}` | — | Senha admin |
| `NODE_ENV` | production | production | Ambiente |
| `PORT` | 11006 | 11006 | Porta da app |

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
    listen 443 ssl;
    server_name med-unificando.seudominio.com;

    ssl_certificate /etc/letsencrypt/live/.../fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/.../privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:11006;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:11006;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Sincronização automática (Cron)

Ver `CRON.md` para instruções detalhadas.

```bash
# Editar crontab
crontab -e

# Adicionar (todo domingo 3h)
0 3 * * 0 cd /caminho/para/med-unificando && \
  docker compose exec app npm run seed >> /var/log/anvisa-sync.log 2>&1
```

## Backup

### Backup manual do banco

```bash
docker exec medicamentos-db pg_dump -U admin medicamentos > backup-$(date +%Y%m%d).sql
```

### Backup automático via cron

```bash
# Adicionar ao crontab
0 4 * * 0 docker exec medicamentos-db pg_dump -U admin medicamentos | \
  gzip > /backups/medicamentos-$(date +%Y%m%d).sql.gz
```

### Restaurar

```bash
cat backup.sql | docker exec -i medicamentos-db psql -U admin medicamentos
```

## Performance

| Recurso | Mínimo | Recomendado | Motivo |
|---------|--------|-------------|--------|
| CPU | 1 core | 2 cores | Modelo de IA na inicialização |
| RAM | 512MB (app) + 256MB (db) | 1GB (app) + 512MB (db) | Embeddings ~47MB em memória |
| Disco | 2GB | 10GB | Dados + logs + backups |
| Docker | 24+ | 24+ | Suporte a healthcheck e resource limits |

## Docker Security

A configuração atual do `docker-compose.yml` já inclui:

- **Rede isolada**: bridge `/16` privada
- **Memória limitada**: db 512MB, app 1GB
- **CPU limitada**: db 1 core, app 2 cores
- **read_only**: filesystem root readonly
- **tmpfs**: `/tmp` em RAM
- **no-new-privileges**: impede escalonamento
- **cap_drop ALL**: remove todas as capacidades Linux
- **cap_add seletivo**: apenas o necessário (NET_BIND_SERVICE para app)
- **Non-root user**: UID 1001
- **Healthcheck**: monitoramento contínuo
