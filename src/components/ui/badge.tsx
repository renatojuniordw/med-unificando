import { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary'
}

export function Badge({
  variant = 'primary',
  className = '',
  children,
  ...props
}: BadgeProps) {
  const styles =
    variant === 'primary'
      ? 'bg-brutalist-black text-neon-yellow shadow-hard-neon'
      : 'bg-neon-yellow text-brutalist-black shadow-hard-sm'

  return (
    <span
      className={`inline-block font-black uppercase tracking-widest text-[10px] px-3 py-1 border-2 border-brutalist-black ${styles} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
