export function PriceStats({ info }: { info: { total: number; withPrice: number } | null }) {
  return (
    <div className="border border-border rounded-sm p-4 bg-[var(--color-bg)] space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-muted">Total de preços</span>
        <span className="text-2xl font-black text-[var(--color-text)]">{info?.total ?? 0}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-muted">Com preço PF0</span>
        <span className="text-sm font-medium text-[var(--color-text)]">{info?.withPrice ?? 0}</span>
      </div>
    </div>
  )
}
