import { ButtonHTMLAttributes, forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-black text-white hover:bg-primary-light focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[var(--color-bg)]',
  secondary:
    'bg-[var(--color-bg)] text-[var(--color-text)] border-2 border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[var(--color-bg)]',
  danger:
    'bg-error text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[var(--color-bg)]',
  ghost:
    'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[var(--color-bg)]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`font-semibold rounded-sm transition-colors ${variantStyles[variant]} ${sizeStyles[size]} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
