import Link from 'next/link'

interface Crumb {
  label: string
  href?: string
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase text-slate-500 mb-6">
      <Link href="/" className="hover:text-brutalist-black transition-colors">HOME</Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          <span>/</span>
          {item.href ? (
            <Link href={item.href} className="hover:text-brutalist-black transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-brutalist-black">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
