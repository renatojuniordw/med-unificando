import Link from 'next/link'
import { SITE } from '@/lib/config'

interface Crumb {
  label: string
  href?: string
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.BASE_URL },
      ...items.map((item, i) => ({
        '@type': 'ListItem' as const,
        position: i + 2,
        name: item.label,
        ...(item.href ? { item: `${SITE.BASE_URL}${item.href}` } : {}),
      })),
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
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
    </>
  )
}
