interface StatusPillProps {
  status: string | null | undefined
}

const styles: Record<string, string> = {
  Ativo: 'text-success-green bg-white border-2 border-brutalist-black',
  Inativo: 'text-error-red bg-white border-2 border-brutalist-black',
}

export function StatusPill({ status }: StatusPillProps) {
  const style = styles[status ?? ''] ?? 'text-slate-500 bg-white border-2 border-brutalist-black'

  return (
    <span className={`inline-block text-[10px] font-black uppercase px-2 py-1 ${style}`}>
      {status || '-'}
    </span>
  )
}
