// URLs públicas de medicamento com slug semântico.
// O ID é mantido como âncora estável no sufixo do slug, permitindo redirecionar
// URLs legadas /medicamento/{id} para a forma canônica sem quebrar links,
// sitemap ou comparações (ver item 9 da auditoria de SEO 2026-09-03).

export function slugifyTradeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function medicineUrl(id: number, tradeName: string): string {
  const slug = slugifyTradeName(tradeName) || 'medicamento'
  return `/medicamento/${slug}-${id}`
}

// Aceita tanto o slug canônico (`nome-123`) quanto o ID numérico legado (`123`).
// Retorna o ID do medicamento, ou null quando o slug não possui ID identificável.
export function parseMedicineSlug(slug: string): number | null {
  if (/^\d+$/.test(slug)) return parseInt(slug, 10)
  const match = slug.match(/-(\d+)$/)
  return match ? parseInt(match[1], 10) : null
}