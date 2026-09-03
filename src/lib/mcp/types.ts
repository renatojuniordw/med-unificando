import type { z } from 'zod'

/**
 * Definição declarativa de uma ferramenta MCP.
 *
 * A tool declara apenas nome, descrição, schema de entrada (zod) e o handler
 * que devolve dados puros — com `input` tipado a partir do schema. A integração
 * com o SDK MCP (serialização JSON-RPC, tratamento de erro, registro no server)
 * é responsabilidade de `register.ts`, mantendo as tools independentes do
 * protocolo (DIP) e com responsabilidade única (SRP).
 */
export interface McpToolDefinition<S extends z.ZodType = z.ZodType> {
  name: string
  description: string
  inputSchema: S
  handler: (input: z.infer<S>) => Promise<unknown> | unknown
}

/** Resultado de tool no formato esperado pelo protocolo MCP (content blocks). */
export type McpToolResult = {
  content: { type: 'text'; text: string }[]
}