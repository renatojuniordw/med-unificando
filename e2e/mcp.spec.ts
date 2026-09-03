import { test, expect, type APIRequestContext } from '@playwright/test'

// E2E do endpoint MCP (Streamable HTTP): handshake de sessão, listagem de tools
// e chamada real de uma tool contra o banco. Exige Postgres no ar (como os
// demais specs de jornada).
//
// O servidor de E2E roda com MCP_ENABLE_JSON_RESPONSE=true (playwright.config),
// então as respostas chegam como JSON puro, sem SSE.

const ENDPOINT = '/api/mcp'
const PROTOCOL_VERSION = '2025-06-18'
const ACCEPT = 'application/json, text/event-stream'

interface RpcResult {
  status: number
  headers: Record<string, string>
  body: unknown
}

async function rpc(request: APIRequestContext, sessionId: string | null, payload: Record<string, unknown>): Promise<RpcResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: ACCEPT,
  }
  if (sessionId) headers['mcp-session-id'] = sessionId

  const res = await request.post(ENDPOINT, { headers, data: payload })
  const raw = await res.text()
  let body: unknown
  try {
    body = raw ? JSON.parse(raw) : undefined
  } catch {
    body = raw
  }
  return { status: res.status(), headers: res.headers(), body }
}

test('MCP: handshake completo (initialize → tools/list → tools/call → delete)', async ({ request }) => {
  // 1. Inicialização — cria a sessão e devolve Mcp-Session-Id
  const init = await rpc(request, null, {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: 'e2e-playwright', version: '1.0.0' },
    },
  })
  expect(init.status).toBe(200)
  const sessionId = init.headers['mcp-session-id']
  expect(sessionId).toBeTruthy()
  expect(init.body).toMatchObject({
    jsonrpc: '2.0',
    result: {
      serverInfo: { name: 'med-unificando' },
      protocolVersion: PROTOCOL_VERSION,
    },
  })

  // 2. Notificação initialized → 202 Accepted
  const notif = await request.post(ENDPOINT, {
    headers: { 'Content-Type': 'application/json', Accept: ACCEPT, 'mcp-session-id': sessionId },
    data: { jsonrpc: '2.0', method: 'notifications/initialized' },
  })
  expect(notif.status()).toBe(202)

  // 3. tools/list → 12 tools
  const list = await rpc(request, sessionId, { jsonrpc: '2.0', id: 2, method: 'tools/list' })
  expect(list.status).toBe(200)
  const tools = (list.body as { result: { tools: { name: string }[] } }).result.tools
  expect(tools).toHaveLength(12)
  expect(tools.map((t) => t.name)).toEqual(
    expect.arrayContaining([
      'buscar_medicamentos',
      'buscar_por_descricao',
      'autocomplete_campo',
      'detalhe_medicamento',
      'referencias_medicamento',
      'similares_referencia',
      'arvore_atc',
      'medicamentos_por_atc',
      'medicamentos_por_detentor',
      'resumo_detentor',
      'comparar_medicamentos',
      'estatisticas_medicamentos',
    ])
  )

  // 4. tools/call buscar_medicamentos → dados reais do banco
  const call = await rpc(request, sessionId, {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'buscar_medicamentos',
      arguments: { pageSize: 1, status: 'Ativo' },
    },
  })
  expect(call.status).toBe(200)
  const content = (call.body as { result: { content: { type: string; text: string }[] } }).result.content
  const payload = JSON.parse(content[0].text) as { total: number; data: unknown[] }
  expect(payload.total).toBeGreaterThan(0)
  expect(payload.data).toHaveLength(1)

  // 5. DELETE encerra a sessão → uso posterior retorna 404
  const del = await request.delete(ENDPOINT, { headers: { 'mcp-session-id': sessionId } })
  expect(del.status()).toBe(200)

  const afterDelete = await rpc(request, sessionId, { jsonrpc: '2.0', id: 4, method: 'tools/list' })
  expect(afterDelete.status).toBe(404)
})

test('MCP: rejeita tools/call sem sessão válida', async ({ request }) => {
  // Request não-inicialização sem session id cria um transport que exige
  // initialize primeiro → 400 do transporte.
  const res = await rpc(request, null, { jsonrpc: '2.0', id: 9, method: 'tools/list' })
  expect(res.status).toBe(400)
})