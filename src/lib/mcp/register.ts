import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { z } from 'zod'
import { jsonResult, toolError } from './result'
import type { McpToolDefinition } from './types'

/**
 * Registra uma lista declarativa de tools no servidor MCP.
 *
 * Composition root: cada nova tool é um arquivo novo + uma entrada no array
 * em `tools/index.ts`, sem tocar no núcleo (OCP). O wrapping de serialização
 * e erro é centralizado aqui (DRY).
 *
 * `McpToolDefinition<any>[]` permite um array heterogêneo de schemas; o `any`
 * fica confinado a esta fronteira de protocolo — cada tool mantém tipagem
 * concreta via `McpToolDefinition<typeof schema>` no arquivo de origem.
 */
export function registerTools(
  server: McpServer,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- array heterogêneo de schemas (fronteira de protocolo)
  defs: readonly McpToolDefinition<any>[]
): void {
  for (const tool of defs) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async (args: unknown) => {
        try {
          return jsonResult(await tool.handler(args as z.infer<typeof tool.inputSchema>))
        } catch (error) {
          return toolError(error)
        }
      }
    )
  }
}