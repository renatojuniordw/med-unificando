import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'active' | 'inactive' | 'highlight'
}

export function Card({
  variant = 'active',
  className = '',
  children,
  ...props
}: CardProps) {
  const styles: Record<string, string> = {
    active: 'bg-[var(--color-bg)] border border-[var(--color-border)] shadow-card',
    inactive: 'bg-[var(--color-bg-secondary)] border border-dashed border-[var(--color-border)]',
    highlight: 'bg-brand-yellow/10 border-l-4 border-brand-yellow shadow-card',
  }

  return (
    <div className={`rounded-md p-6 ${styles[variant]} ${className}`} {...props}>
      {children}
    </div>
  )
}
