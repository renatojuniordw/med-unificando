import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full border border-[var(--color-border)] rounded-sm px-3 py-2.5 min-h-[44px] text-sm bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-slate-400
            focus:outline-none focus:ring-2 focus:ring-brand-black focus:ring-offset-1 dark:focus:ring-offset-[var(--color-bg)]
            transition-shadow ${className}`}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = 'Input'
