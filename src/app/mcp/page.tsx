import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { ClipboardButton } from '@/components/ui/clipboard-button'
import { SITE } from '@/lib/config'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MCP Server — API para agentes de IA',
  description:
    'Use o Med Unificando como MCP Server (Model Context Protocol): agentes como Claude, Cursor e opencode consultam medicamentos ANVISA, preços CMED e buscas semânticas diretamente pela URL /api/mcp.',
  alternates: { canonical: '/mcp' },
  openGraph: {
    title: 'MCP Server — Med Unificando',
    description: 'Endereço de medicamentos ANVISA como ferramentas para agentes de IA via MCP.',
  },
}

const tools = [
  ['buscar_medicamentos', 'Lista com filtros (referência, princípio ativo, nome, situação, Farmácia Popular) e paginação'],
  ['buscar_por_descricao', 'Busca semântica híbrida por linguagem natural (ex.: "queimação e dor no estômago")'],
  ['detalhe_medicamento', 'Detalhe completo por ID: dados ANVISA, preços CMED e similares'],
  ['referencias_medicamento', 'Medicamentos de referência (com busca opcional)'],
  ['similares_referencia', 'Similares de uma referência pelo nome'],
  ['arvore_atc', 'Árvore de classificação ATC com contagens'],
  ['medicamentos_por_atc', 'Medicamentos por código ATC'],
  ['medicamentos_por_detentor', 'Medicamentos de uma empresa, paginados'],
  ['resumo_detentor', 'Resumo de um detentor (total, ativos, categorias)'],
  ['comparar_medicamentos', 'Comparação lado a lado por IDs ou termo de busca'],
  ['autocomplete_campo', 'Sugere valores distintos de um campo da base'],
  ['estatisticas_medicamentos', 'Estatísticas gerais ou filtradas (ano, categoria, situação)'],
] as const

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between gap-2 mb-1">
        {label ? (
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</p>
        ) : (
          <span />
        )}
        <ClipboardButton text={code} />
      </div>
      <pre className="overflow-x-auto rounded-md bg-black text-[13px] leading-relaxed text-[#ccff00] p-4 whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default function McpPage() {
  const endpoint = `${SITE.BASE_URL.replace(/\/$/, '')}/api/mcp`

  return (
    <section className="py-12 md:py-20">
      <div className="max-w-3xl mx-auto px-6 lg:px-12">
        <Breadcrumbs items={[{ label: 'MCP' }]} />

        <div className="mb-12">
          <Badge variant="primary" className="mb-4">Model Context Protocol</Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-[var(--color-text)]">
            MCP Server
          </h1>
          <p className="mt-4 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-2xl">
            Use o Med Unificando como <strong className="text-[var(--color-text)]">ferramenta para agentes de IA</strong>.
            O mesmo domínio de busca do site (dados ANVISA, preços CMED, classificação ATC e busca semântica)
            fica disponível como 12 ferramentas read-only via Model Context Protocol.
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <h2 className="font-semibold text-lg mb-3">Endpoint</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              O servidor MCP roda no próprio site (Streamable HTTP, spec 2025-06-18).
              Apontar o cliente para a URL abaixo é suficiente.
            </p>
            <CodeBlock code={endpoint} label="URL do MCP Server" />
          </Card>

          <Card>
            <h2 className="font-semibold text-lg mb-3">Configuração por cliente</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
              Adicione o servidor no seu agente favorito:
            </p>

            <p className="text-sm font-medium text-[var(--color-text)] mt-4">Claude Desktop / Claude Code</p>
            <CodeBlock code={`{
  "mcpServers": {
    "med-unificando": {
      "url": "${endpoint}"
    }
  }
}`} />

            <p className="text-sm font-medium text-[var(--color-text)] mt-4">Cursor</p>
            <CodeBlock code={`MCP → Add new server:
  Type: HTTP
  URL:  ${endpoint}`} />

            <p className="text-sm font-medium text-[var(--color-text)] mt-4">opencode</p>
            <CodeBlock code={`{
  "mcp": {
    "med-unificando": {
      "type": "http",
      "url": "${endpoint}"
    }
  }
}`} />
          </Card>

          <Card>
            <h2 className="font-semibold text-lg mb-3">Ferramentas disponíveis (12)</h2>
            <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              {tools.map(([name, description]) => (
                <li key={name} className="flex items-start gap-2">
                  <span className="text-brand-yellow mt-0.5">▸</span>
                  <span>
                    <code className="text-xs bg-[var(--color-surface)] px-1.5 py-0.5 rounded text-[var(--color-text)]">{name}</code>{' '}
                    — {description}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="font-semibold text-lg mb-3">Exemplo rápido (curl)</h2>
            <CodeBlock code={`curl -i -X POST ${endpoint} \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"meu-agente","version":"1.0"}}}'`} />
            <p className="text-xs text-[var(--color-text-secondary)] mt-3">
              Guarde o header <code className="text-[var(--color-text)]">mcp-session-id</code> da resposta e use nas
              chamadas seguintes (<code className="text-[var(--color-text)]">tools/list</code>, <code className="text-[var(--color-text)]">tools/call</code>).
            </p>
          </Card>

          <Card>
            <h2 className="font-semibold text-lg mb-3">Segurança</h2>
            <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="text-brand-yellow mt-0.5">▸</span>
                <span><strong className="text-[var(--color-text)]">Somente leitura:</strong> nenhuma ação administrativa é exposta</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-yellow mt-0.5">▸</span>
                <span><strong className="text-[var(--color-text)]">Rate limit:</strong> 120 requisições/minuto por IP</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-yellow mt-0.5">▸</span>
                <span><strong className="text-[var(--color-text)]">Dados abertos:</strong> mesmos dados públicos da ANVISA/CMED do site</span>
              </li>
            </ul>
          </Card>

          <Card variant="inactive">
            <h2 className="font-semibold text-lg mb-3">Documentação técnica</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Detalhes do transporte, handshake, variáveis de ambiente, deploy e troubleshooting estão em{' '}
              <a
                href="https://github.com/renatojuniordw/med-unificando/blob/main/docs/MCP.md"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-brand-yellow transition-colors"
              >
                docs/MCP.md
              </a>{' '}
              no repositório.
            </p>
          </Card>
        </div>
      </div>
    </section>
  )
}