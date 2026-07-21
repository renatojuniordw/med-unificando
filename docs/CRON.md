# Sincronização Automática (Cron)

## Na inicialização do Docker (automático)

O `docker-entrypoint.sh` já executa automaticamente ao subir o container:

```bash
1. npx prisma migrate deploy        # Migrations
2. npx tsx prisma/seed.ts           # ANVISA + Admin
3. npx tsx scripts/sync-farmacia-popular.ts  # Farmácia Popular
```

Toda vez que o container for reiniciado (`docker compose restart` ou deploy), as sincronizações rodam automaticamente — sem precisar de Node instalado na VPS.

## Rotina semanal via crontab da VPS

Para manter os dados atualizados sem reiniciar o container, adicione no crontab da VPS:

```bash
crontab -e
```

```cron
# ANVISA — todo domingo às 3h
0 3 * * 0 docker exec medicamentos-app sh -c "NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx prisma/seed.ts" >> /var/log/sync.log 2>&1

# Farmácia Popular — todo domingo às 3h30 (após ANVISA)
30 3 * * 0 docker exec medicamentos-app npx tsx scripts/sync-farmacia-popular.ts >> /var/log/sync.log 2>&1
```

> ⚠️ O container `medicamentos-app` precisa estar rodando para o `docker exec` funcionar.

## URLs dos dados

- Medicamentos ANVISA: `https://dados.anvisa.gov.br/dados/CONSULTAS/PRODUTOS/TA_CONSULTA_MEDICAMENTOS.CSV`
- Preços CMED: `https://dados.anvisa.gov.br/dados/TA_PRECOS_MEDICAMENTOS.csv`
- Farmácia Popular (MS): `https://www.gov.br/saude/pt-br/composicao/sectics/farmacia-popular/arquivos/elenco-de-medicamentos-e-insumos-pfpb.pdf`
- Portal dados abertos: `https://dados.anvisa.gov.br/dados/`
