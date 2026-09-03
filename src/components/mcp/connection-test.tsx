'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type Status = 'idle' | 'testing' | 'online' | 'offline'

interface McpConnectionTestProps {
  endpoint: string
}

interface JsonRpcResponse {
  result?: { tools?: unknown[]; serverInfo?: { name?: string } }
  error?: { message?: string }
}

async function parseJsonRpc(response: Response): Promise<JsonRpcResponse> {
  const text = await response.text()
  if (!text) return {}

  const isStream = (response.headers.get('content-type') ?? '').includes('text/event-stream')
  const lines = text.split('\n')

  if (isStream || lines.some((line) => line.startsWith('data:'))) {
    for (const line of lines) {
      if (line.startsWith('data:')) {
        try {
          return JSON.parse(line.slice(5).trim()) as JsonRpcResponse
        } catch {
          // ignora eventos não-JSON (ex.: ping)
        }
      }
    }
    return {}
  }

  try {
    return JSON.parse(text) as JsonRpcResponse
  } catch {
    return {}
  }
}

export function McpConnectionTest({ endpoint }: McpConnectionTestProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [toolsCount, setToolsCount] = useState<number | null>(null)

  async function test() {
    setStatus('testing')

    try {
      const initial = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2025-06-18',
            capabilities: {},
            clientInfo: { name: 'med-unificando-web', version: '1.0' },
          },
        }),
      })
      if (!initial.ok) throw new Error(`initialize falhou (HTTP ${initial.status})`)
      const sessionId = initial.headers.get('mcp-session-id')
      await parseJsonRpc(initial)

      const list = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          ...(sessionId ? { 'mcp-session-id': sessionId } : {}),
        },
        body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
      })
      if (!list.ok) throw new Error(`tools/list falhou (HTTP ${list.status})`)

      const body = await parseJsonRpc(list)
      const tools = body.result?.tools
      if (!Array.isArray(tools)) {
        throw new Error(body.error?.message ?? 'tools/list sem resultado')
      }

      setToolsCount(tools.length)
      setStatus('online')
    } catch (error) {
      setToolsCount(null)
      setStatus('offline')
      console.error('MCP connection test failed:', error)
    }
  }

  return (
    <div className="flex items-center gap-3 mt-4">
      <Button
        variant="secondary"
        size="sm"
        onClick={test}
        disabled={status === 'testing'}
        data-testid="mcp-connection-test"
      >
        {status === 'testing' ? 'Testando…' : 'Testar conexão'}
      </Button>

      {status === 'online' && (
        <Badge variant="success" data-testid="mcp-status-online">
          Online — {toolsCount} ferramentas
        </Badge>
      )}
      {status === 'offline' && (
        <Badge variant="muted" data-testid="mcp-status-offline">
          Offline — verifique o endpoint
        </Badge>
      )}
    </div>
  )
}