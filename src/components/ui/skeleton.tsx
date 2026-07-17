import { HTMLAttributes } from 'react'

export function Skeleton({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-slate-200 animate-pulse border-4 border-brutalist-black shadow-hard-md ${className}`}
      {...props}
    />
  )
}
