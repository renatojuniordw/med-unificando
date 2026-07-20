import { HTMLAttributes } from 'react'

export function Skeleton({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-[var(--color-border)] animate-pulse rounded-sm ${className}`}
      {...props}
    />
  )
}
