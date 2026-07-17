import Link from 'next/link'
import { columns } from '@/components/medicines/medicine-table'
import type { MedicineResult } from '@/types'

interface SemanticResultsTableProps {
  results: { score: number; medicine: MedicineResult }[]
}

export function SemanticResultsTable({ results }: SemanticResultsTableProps) {
  return (
    <div className="overflow-x-auto border-4 border-brutalist-black">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-brutalist-black text-neon-yellow">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left p-4 font-black uppercase tracking-wider text-xs border-r-4 border-neon-yellow last:border-r-0"
              >
                {col.label}
              </th>
            ))}
            <th className="text-left p-4 font-black uppercase tracking-wider text-xs w-24">
              RELEVÂNCIA
            </th>
          </tr>
        </thead>
        <tbody>
          {results.map(({ score, medicine }, index) => (
            <tr
              key={medicine.id}
              className={`border-t-4 border-brutalist-black hover:bg-neon-yellow/20 transition-colors ${
                index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
              }`}
            >
              {columns.map((col) => {
                const value = (medicine as unknown as Record<string, string>)[col.key]
                const display = value ?? ''
                if (col.key === 'tradeName' || col.key === 'reference') {
                  return (
                    <td key={col.key} className="p-4 text-sm font-bold uppercase">
                      <Link
                        href={`/medicamento/${medicine.id}`}
                        className="hover:bg-neon-yellow hover:text-brutalist-black transition-colors"
                      >
                        {display}
                      </Link>
                    </td>
                  )
                }
                return (
                  <td key={col.key} className="p-4 text-sm font-bold uppercase">
                    {display}
                  </td>
                )
              })}
              <td className="p-4 text-sm font-bold text-slate-500">
                {(score * 100).toFixed(0)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
