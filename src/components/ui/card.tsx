import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'active' | 'inactive'
}

export function Card({
  variant = 'active',
  className = '',
  children,
  ...props
}: CardProps) {
  const base = 'p-8 border-4 border-brutalist-black'
  const styles =
    variant === 'active'
      ? 'bg-neon-yellow shadow-hard-lg hover:-translate-y-1 transition-transform'
      : 'bg-white border-dashed opacity-90'

  return (
    <div className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </div>
  )
}
