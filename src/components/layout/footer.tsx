export function Footer() {
  return (
    <footer className="bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)] mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
              © 2025 Unificando Med
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
