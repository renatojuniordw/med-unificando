export function Footer() {
  return (
    <footer className="bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)] mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--color-border)]">
          <div className="max-w-xl">
            <span className="inline-block bg-brand-yellow text-brand-black text-xs font-semibold px-2 py-1 rounded-sm mb-3">
              UNIFICANDO · ECOSSISTEMA
            </span>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Desenvolvido com foco total em performance e privacidade pela{' '}
              <a
                href="https://unificando.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--color-text)] hover:text-brand-black dark:hover:text-brand-yellow transition-colors"
              >
                Unificando
              </a>
              . Ferramentas rápidas, seguras e fáceis de usar.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1">
            <span className="text-sm font-semibold text-[var(--color-text)]">
              Pronto para o próximo nível?
            </span>
            <a
              href="https://unificando.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            >
              Consultoria em IA e Desenvolvimento
            </a>
            <span className="text-xs text-[var(--color-text-secondary)]">
              IA • Web • Sistemas
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
            <span className="text-xs text-[var(--color-text-secondary)]">
              © 2026 Med Unificando — Consulta de medicamentos intercambiáveis e referências ANVISA.
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
