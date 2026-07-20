import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sobre',
  description: 'Informações sobre o Unificando Med, fontes de dados e metodologia.',
}

export default function AboutPage() {
  return (
    <section className="py-12 md:py-20">
      <div className="max-w-3xl mx-auto px-6 lg:px-12">
        <Breadcrumbs items={[{ label: 'Sobre' }]} />

        <div className="mb-12">
          <Badge variant="primary" className="mb-4">Sobre</Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-[var(--color-text)]">
            Unificando Med
          </h1>
        </div>

        <div className="space-y-8">
          <Card>
            <h2 className="font-semibold text-lg mb-3">O que é</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              O Unificando Med é uma plataforma de consulta de medicamentos intercambiáveis
              baseada na lista oficial da ANVISA (Agência Nacional de Vigilância Sanitária),
              conforme a RDC 58/2014.
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mt-3">
              A plataforma permite que profissionais de saúde, farmacêuticos e pacientes
              consultem medicamentos similares, seus medicamentos de referência,
              preços CMED, classificação ATC e muito mais.
            </p>
          </Card>

          <Card>
            <h2 className="font-semibold text-lg mb-3">Fontes de Dados</h2>
            <div className="space-y-3">
              <div className="border-b border-[var(--color-border)] pb-3">
                <p className="font-medium text-sm">Medicamentos</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Dados abertos da ANVISA — Consulta de Medicamentos
                  (<span className="text-xs break-all">dados.anvisa.gov.br/dados/CONSULTAS/PRODUTOS/TA_CONSULTA_MEDICAMENTOS.CSV</span>)
                </p>
              </div>
              <div className="border-b border-[var(--color-border)] pb-3">
                <p className="font-medium text-sm">Preços</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Tabela de preços CMED (Câmara de Regulação do Mercado de Medicamentos)
                </p>
              </div>
              <div>
                <p className="font-medium text-sm">Classificação ATC</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Anatomical Therapeutic Chemical Classification System
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold text-lg mb-3">Funcionalidades</h2>
            <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="text-brand-yellow mt-0.5">▸</span>
                <span><strong className="text-[var(--color-text)]">Busca Semântica:</strong> encontre medicamentos descrevendo sintomas ou usos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-yellow mt-0.5">▸</span>
                <span><strong className="text-[var(--color-text)]">Busca Avançada:</strong> filtre por referência, princípio ativo, nome comercial e categoria</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-yellow mt-0.5">▸</span>
                <span><strong className="text-[var(--color-text)]">Comparação:</strong> compare medicamentos lado a lado</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-yellow mt-0.5">▸</span>
                <span><strong className="text-[var(--color-text)]">Classificação ATC:</strong> navegue por código anatômico, terapêutico e químico</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-yellow mt-0.5">▸</span>
                <span><strong className="text-[var(--color-text)]">Dashboard:</strong> estatísticas consolidadas da base ANVISA</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-yellow mt-0.5">▸</span>
                <span><strong className="text-[var(--color-text)]">Exportação:</strong> baixe dados em Excel ou CSV</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-yellow mt-0.5">▸</span>
                <span><strong className="text-[var(--color-text)]">Relatório PDF:</strong> gere PDF completo de cada medicamento</span>
              </li>
            </ul>
          </Card>

          <Card>
            <h2 className="font-semibold text-lg mb-3">Um projeto Unificando</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              O Unificando Med faz parte do ecossistema Unificando, um laboratório
              de projetos autorais e inteligência artificial. Conheça mais em
              {' '}<a href="https://unificando.com.br" target="_blank" rel="noopener noreferrer"
                className="text-[var(--color-text)] underline hover:text-brand-yellow transition-colors">
                unificando.com.br
              </a>.
            </p>
          </Card>

          <Card variant="inactive">
            <h2 className="font-semibold text-lg mb-3">Aviso Legal</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              As informações disponíveis nesta plataforma têm caráter informativo e
              são baseadas em dados públicos da ANVISA. Sempre consulte a bula oficial
              e um profissional de saúde para decisões sobre medicamentos.
            </p>
          </Card>
        </div>
      </div>
    </section>
  )
}
