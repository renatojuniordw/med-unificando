# Sincronização Automática ANVISA (Cron)

## Adicionar ao crontab da VPS

```bash
crontab -e
```

Adicione (executa todo domingo às 3h):

```cron
0 3 * * 0 cd /caminho/para/medicamentos && curl -X POST http://localhost:3000/api/cron/sync >> /var/log/anvisa-cron.log 2>&1
```

## Endpoint de Sincronização

A API REST `/api/medicines` permite consulta programática.

Para sync automático, você pode criar uma API Route em `src/app/api/cron/sync/route.ts` que chame `syncWithAnvisa()` internamente, mas como a action requer autenticação, o método mais prático é:

1. **Cron com token**: Crie um endpoint com `secret` que dispare o sync
2. **Ou manual**: Use o painel admin em `/admin/import` e clique em "Sincronizar"

Para a opção 1, crie `src/app/api/cron/sync/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import https from 'https'

const SECRET = process.env.CRON_SECRET || ''

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // ... lógica de sync (cópia de syncWithAnvisa sem auth check)
}
```

Adicione `CRON_SECRET=sua-chave-aqui` no `.env` e no crontab:

```cron
0 3 * * 0 curl -X POST -H "Authorization: Bearer sua-chave-aqui" http://localhost:3000/api/cron/sync
```

## URLs dos dados abertos ANVISA

- Medicamentos: `https://dados.anvisa.gov.br/dados/CONSULTAS/PRODUTOS/TA_CONSULTA_MEDICAMENTOS.CSV`
- Preços: `https://dados.anvisa.gov.br/dados/TA_PRECOS_MEDICAMENTOS.csv`
- Portal: `https://dados.anvisa.gov.br/dados/`
