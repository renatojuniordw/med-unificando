interface BarChartItem {
  name: string
  count: number
}

interface BarChartProps {
  items: BarChartItem[]
  maxCount?: number
  barColor?: string
  label?: string
  className?: string
}

export function BarChart({ items, maxCount, barColor = 'bg-neon-yellow', label, className = '' }: BarChartProps) {
  const max = maxCount ?? items[0]?.count ?? 1

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">{label}</p>}
      {items.map((item) => {
        const width = (item.count / max) * 100
        return (
          <div key={item.name}>
            <div className="flex justify-between text-xs font-bold uppercase mb-1">
              <span className="truncate mr-2">{item.name}</span>
              <span>{item.count}</span>
            </div>
            <div className="h-6 border-2 border-brutalist-black bg-white">
              <div
                className={`h-full ${barColor} border-r-2 border-brutalist-black`}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
