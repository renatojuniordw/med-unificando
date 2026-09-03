import { buscarMedicamentos, autocompleteCampo } from './medicines'
import { buscarPorDescricao } from './search'
import { detalheMedicamento } from './detail'
import { referenciasMedicamento, similaresReferencia } from './references'
import { arvoreAtc, medicamentosPorAtc } from './atc'
import { medicamentosPorDetentor, resumoDetentor } from './holder'
import { compararMedicamentos } from './compare'
import { estatisticasMedicamentos } from './stats'
import type { McpToolDefinition } from '../types'

/**
 * Composition root das ferramentas MCP.
 *
 * Nova tool = arquivo novo em `tools/` + uma entrada aqui. O núcleo
 * (`server.ts` / `register.ts`) não muda (OCP).
 *
 * `any` confinado ao composition root: cada tool mantém tipo concreto
 * via `McpToolDefinition<typeof schema>` no arquivo de origem.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TOOL_DEFINITIONS: McpToolDefinition<any>[] = [
  buscarMedicamentos,
  buscarPorDescricao,
  autocompleteCampo,
  detalheMedicamento,
  referenciasMedicamento,
  similaresReferencia,
  arvoreAtc,
  medicamentosPorAtc,
  medicamentosPorDetentor,
  resumoDetentor,
  compararMedicamentos,
  estatisticasMedicamentos,
]