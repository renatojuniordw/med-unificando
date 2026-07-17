import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[10px] font-black uppercase tracking-widest text-brutalist-black mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full border-4 border-brutalist-black p-4 font-medium text-base bg-white focus:ring-4 focus:ring-brutalist-black focus:ring-offset-2 focus:ring-offset-neon-yellow focus:outline-none ${className}`}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = 'Input'
