import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerTools } from './register'
import { TOOL_DEFINITIONS } from './tools'

export const MCP_SERVER_NAME = 'med-unificando'
export const MCP_SERVER_VERSION = '0.1.0'

/**
 * Fábrica do servidor MCP.
 *
 * Um `McpServer` (camada Protocol) só pode ser conectado a UM transport por
 * vez — por isso criamos uma instância nova por sessão HTTP (`session.ts`).
 * O registro das tools é determinístico e stateless.
 */
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: MCP_SERVER_NAME,
    version: MCP_SERVER_VERSION,
  })
  registerTools(server, TOOL_DEFINITIONS)
  return server
}