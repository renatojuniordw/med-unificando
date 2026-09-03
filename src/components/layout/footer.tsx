import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)] mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--color-border)]">
          <div className="max-w-xl">
            <span className="inline-block bg-brand-yellow text-brand-black text-xs font-semibold px-2 py-1 rounded-sm mb-3">
              UNIFICANDO · LABORATÓRIO
            </span>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Desenvolvido com foco total em performance e privacidade pelo{' '}
              <a
                href="https://unificando.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--color-text)] hover:text-brand-black dark:hover:text-brand-yellow transition-colors"
              >
                Unificando
              </a>
              , laboratório de projetos autorais e inteligência artificial. Ferramentas rápidas, seguras e fáceis de usar.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1">
            <span className="text-sm font-semibold text-[var(--color-text)]">
              Laboratório de projetos autorais & IA
            </span>
            <a
              href="https://unificando.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            >
              unificando.com.br
            </a>
            <span className="text-xs text-[var(--color-text-secondary)]">
              IA • Utilitários • Sistemas & Web
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
          <span className="text-xs text-[var(--color-text-secondary)]">
            Lista ANVISA — RDC 58/2014
          </span>
          <div className="flex items-center gap-4">
            <a
              href="https://unificando.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            >
              Unificando
            </a>
            <Link
              href="/privacidade"
              data-testid="footer-privacy-link"
              className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            >
              Política de Privacidade
            </Link>
            <span className="text-xs text-[var(--color-text-secondary)]">
              © {new Date().getFullYear()} UNIFICANDO DIGITAL · Med Unificando — Consulta de medicamentos intercambiáveis e referências ANVISA.
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
