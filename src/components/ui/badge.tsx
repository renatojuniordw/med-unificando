import { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'muted'
}

export function Badge({
  variant = 'primary',
  className = '',
  children,
  ...props
}: BadgeProps) {
  const styles =
    variant === 'primary'
      ? 'bg-brand-yellow text-brand-black'
      : variant === 'success'
        ? 'bg-success/20 text-success border border-success/30'
        : variant === 'muted'
          ? 'bg-[var(--color-bg-secondary)] text-muted border border-[var(--color-border)]'
          : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'

  return (
    <span
      className={`inline-block font-semibold text-[11px] px-2.5 py-0.5 rounded-sm ${styles} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
