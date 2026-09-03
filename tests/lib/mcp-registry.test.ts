import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerTools } from '@/lib/mcp/register'
import { TOOL_DEFINITIONS } from '@/lib/mcp/tools'

interface Registered {
  name: string
  description: string | undefined
  inputSchema: unknown
  cb: (args: unknown) => unknown
}

function createFakeServer() {
  const registered: Registered[] = []
  const server = {
    registerTool: vi.fn((name: string, config: { description?: string; inputSchema?: unknown }, cb: (args: unknown) => unknown) => {
      registered.push({ name, description: config.description, inputSchema: config.inputSchema, cb })
    }),
  }
  return { server: server as unknown as McpServer, registered }
}

describe('TOOL_DEFINITIONS (composition root)', () => {
  it('registra exatamente as 12 tools planejadas', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(12)
  })

  it('nomes únicos, descrições e schemas presentes', () => {
    const names = TOOL_DEFINITIONS.map((t) => t.name)
    expect(new Set(names).size).toBe(names.length)
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.name).toBeTruthy()
      expect(tool.description).toBeTruthy()
      expect(tool.inputSchema).toBeTruthy()
      expect(typeof tool.handler).toBe('function')
    }
  })
})

describe('registerTools', () => {
  let fake: ReturnType<typeof createFakeServer>

  beforeEach(() => {
    fake = createFakeServer()
  })

  it('registra todas as tools com nome, descrição e schema', () => {
    registerTools(fake.server, TOOL_DEFINITIONS)
    expect(fake.server.registerTool).toHaveBeenCalledTimes(12)
    expect(fake.registered.map((r) => r.name)).toEqual(
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
    for (const r of fake.registered) {
      expect(r.description).toBeTruthy()
      expect(r.inputSchema).toBeTruthy()
    }
  })

  it('serializa o retorno do handler como content block de texto', async () => {
    const stubTool = {
      name: 'stub_tool',
      description: 'tool de teste sem dependências',
      inputSchema: z.object({}),
      handler: async () => ({ level1: [{ code: 'A', count: 5 }] }),
    }
    registerTools(fake.server, [stubTool])
    const result = await fake.registered[0].cb({})
    expect(result).toMatchObject({
      content: [{ type: 'text', text: expect.stringContaining('level1') }],
    })
    expect(JSON.parse((result as { content: { text: string }[] }).content[0].text)).toEqual({
      level1: [{ code: 'A', count: 5 }],
    })
  })

  it('encapsula erros do handler em resultado genérico (não vaza detalhes)', async () => {
    const failingTool = {
      name: 'tool_que_falha',
      description: 'falha de propósito',
      inputSchema: z.object({}),
      handler: async () => {
        throw new Error('segredo interno do prisma')
      },
    }
    registerTools(fake.server, [failingTool])
    const result = await fake.registered[0].cb({}) as { content: { text: string }[] }
    const payload = JSON.parse(result.content[0].text)
    expect(payload.error).toBe('Erro interno ao executar a ferramenta')
    expect(JSON.stringify(payload)).not.toContain('segredo interno')
  })
})