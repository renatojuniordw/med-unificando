import Link from 'next/link'

interface Crumb {
  label: string
  href?: string
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] mb-6" aria-label="Breadcrumb">
      <Link href="/" className="hover:text-[var(--color-text)] transition-colors">Home</Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          <span>/</span>
          {item.href ? (
            <Link href={item.href} className="hover:text-[var(--color-text)] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--color-text)] font-medium" aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
