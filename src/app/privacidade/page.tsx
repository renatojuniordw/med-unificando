import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Política de privacidade do Med Unificando: dados coletados, finalidade, base legal, retenção e direitos do titular conforme a LGPD (Lei 13.709/2018).',
  alternates: { canonical: '/privacidade' },
  openGraph: {
    title: 'Política de Privacidade — Med Unificando',
    description: 'Como o Med Unificando trata dados pessoais, em conformidade com a LGPD.',
  },
}

export default function PrivacyPage() {
  return (
    <section className="py-12 md:py-20">
      <div className="max-w-3xl mx-auto px-6 lg:px-12">
        <Breadcrumbs items={[{ label: 'Política de Privacidade' }]} />

        <div className="mb-12">
          <Badge variant="primary" className="mb-4">Privacidade</Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-[var(--color-text)]">
            Política de Privacidade
          </h1>
          <p className="mt-4 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-2xl">
            Esta política descreve como o <strong>Med Unificando</strong> trata dados
            pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018 — LGPD).
            Última atualização: <strong>3 de setembro de 2026</strong>.
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <h2 className="font-semibold text-lg mb-3">1. Controlador e Canal de Contato</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              O Med Unificando é um projeto do{' '}
              <strong className="text-[var(--color-text)]">Unificando</strong>, laboratório de
              projetos autorais e inteligência artificial. Dúvidas ou solicitações sobre
              privacidade podem ser enviadas através do{' '}
              <a
                href="https://unificando.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-brand-yellow transition-colors"
              >
                site do Unificando
              </a>{' '}
              ou pelo repositório oficial do projeto no{' '}
              <a
                href="https://github.com/renatojuniordw/med-unificando"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-brand-yellow transition-colors"
              >
                GitHub
              </a>.
            </p>
          </Card>

          <Card>
            <h2 className="font-semibold text-lg mb-3">2. Dados Coletados</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              O serviço é de consulta pública de medicamentos (dados abertos da ANVISA e CMED).
              Não existe cadastro público, compra ou coleta de dados de pagamento. O tratamento é
              mínimo e se limita a:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="text-brand-yellow mt-0.5">▸</span>
                <span><strong className="text-[var(--color-text)]">Logs anônimos de busca:</strong> termos pesquisados, número de resultados e tempo de resposta, <em>sem IP, sem navegador/agente e sem cookies de rastreamento</em>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-yellow mt-0.5">▸</span>
                <span><strong className="text-[var(--color-text)]">Feedback de busca:</strong> quando você vota se um resultado foi útil, registramos o termo pesquisado, o medicamento e o voto (sem identificação pessoal).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-yellow mt-0.5">▸</span>
                <span><strong className="text-[var(--color-text)]">Preferências locais:</strong> favoritos, buscas recentes e tema ficam apenas no seu navegador (localStorage) e nunca são enviados ao servidor.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-yellow mt-0.5">▸</span>
                <span><strong className="text-[var(--color-text)]">Dados administrativos:</strong> apenas e-mail e nome do administrador, usados exclusivamente para acessar a área restrita.</span>
              </li>
            </ul>
          </Card>

          <Card>
            <h2 className="font-semibold text-lg mb-3">3. Finalidade e Base Legal</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Os logs anônimos e o feedback são utilizados exclusivamente para <strong>melhoria
              da qualidade da busca</strong> (relevância, detecção de consultas sem resultado e
              medição de desempenho). A base legal é o <strong>legítimo interesse</strong> do
              controlador (Art. 7º, IX e Art. 10 da LGPD), limitado ao que é necessário e
              proporcional; os dados de acesso administrativo são tratados com base na execução
              de medidas administrativas internas (Art. 7º, I).
            </p>
          </Card>

          <Card>
            <h2 className="font-semibold text-lg mb-3">4. Cookies e Tecnologias</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Não utilizamos cookies de publicidade ou rastreamento. O único cookie empregado é o
              de <strong>sessão administrativa</strong> (estritamente necessário, somente na área
              restrita). As preferências de tema, favoritos e buscas recentes são armazenadas
              localmente no seu navegador.
            </p>
          </Card>

          <Card>
            <h2 className="font-semibold text-lg mb-3">5. Compartilhamento</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Os dados não são vendidos, cedidos ou compartilhados com terceiros, exceto o
              processamento de infraestrutura estritamente necessário à operação do serviço
              (hospedagem própria) — sem transferência para fins de publicidade ou perfilamento.
            </p>
          </Card>

          <Card>
            <h2 className="font-semibold text-lg mb-3">6. Segurança</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Adotamos medidas técnicas e organizacionais adequadas (Art. 46 da LGPD): conexão
              criptografada (TLS), área administrativa protegida por autenticação com senha
              hashada, limitação de taxa de requisições, ausência de coleta de identificadores
              nos logs analíticos e proteção contra injeção SQL.
            </p>
          </Card>

          <Card>
            <h2 className="font-semibold text-lg mb-3">7. Retenção e Eliminação</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Os logs de busca e os feedbacks são mantidos por até <strong>12 (doze) meses</strong>,
              sendo removidos automaticamente após esse período (purge agendado). Ao fim do prazo
              ou da finalidade, os dados são eliminados de forma segura.
            </p>
          </Card>

          <Card>
            <h2 className="font-semibold text-lg mb-3">8. Seus Direitos (Art. 18 da LGPD)</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Você pode solicitar a qualquer momento: confirmação do tratamento, acesso, correção,
              anonimização ou eliminação de dados desnecessários, portabilidade e revogação de
              consentimento. Como os logs analíticos são anônimos (não permitem identificação
              individual), a maioria das solicitações não encontrará dados pessoais vinculados a
              você — mas toda solicitação será respondida pelo canal de contato da seção 1.
            </p>
          </Card>

          <Card variant="inactive">
            <h2 className="font-semibold text-lg mb-3">Aviso Legal</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              As informações desta plataforma têm caráter informativo e são baseadas em dados
              públicos da ANVISA. Sempre consulte a bula oficial e um profissional de saúde para
              decisões sobre medicamentos.
            </p>
          </Card>
        </div>
      </div>
    </section>
  )
}