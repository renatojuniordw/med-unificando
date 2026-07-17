# Deploy

## Docker Compose (Produção)

### Pré-requisitos
- Docker Engine 24+
- Docker Compose v2

### Passos

```bash
# 1. Clone
git clone https://github.com/seu-usuario/unificando-med.git
cd unificando-med

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
    server_name medicamentos.seudominio.com;

    ssl_certificate /etc/letsencrypt/live/.../fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/.../privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:11006;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Sincronização automática (Cron)

Ver `CRON.md` no projeto para instruções detalhadas.

```bash
# Editar crontab
crontab -e

# Adicionar (todo domingo 3h)
0 3 * * 0 cd /caminho/para/medicamentos && \
  docker compose exec app npm run seed >> /var/log/anvisa-sync.log 2>&1
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

## Performance

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| CPU | 1 core | 2 cores |
| RAM | 512MB (app) + 256MB (db) | 1GB (app) + 512MB (db) |
| Disco | 2GB | 10GB |
| Docker | 24+ | 24+ |
