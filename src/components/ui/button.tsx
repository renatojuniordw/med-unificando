import { ButtonHTMLAttributes, forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-neon-yellow text-brutalist-black border-2 border-brutalist-black shadow-hard-md hover:bg-[#b3ff00]',
  secondary:
    'bg-brutalist-black text-neon-yellow border-4 border-brutalist-black shadow-hard-md hover:bg-neon-yellow hover:text-brutalist-black',
  danger:
    'bg-error-red text-white border-4 border-brutalist-black shadow-hard-md',
  ghost:
    'bg-transparent text-brutalist-black border-2 border-brutalist-black hover:bg-brutalist-black hover:text-white',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-8 py-4 text-sm',
  lg: 'px-10 py-5 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`font-black uppercase tracking-widest transition-colors ${variantStyles[variant]} ${sizeStyles[size]} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
