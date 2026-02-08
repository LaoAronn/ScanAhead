import * as React from 'react'
import { cn } from '../../lib/utils'

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const buttonVariants: Record<ButtonVariant, string> = {
  default: 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-400',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-300',
  outline:
    'border border-slate-200 text-slate-700 hover:border-brand-200 hover:text-brand-700 focus-visible:ring-brand-200',
  ghost: 'text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-200',
  destructive: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-300',
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-9 rounded-full px-4 text-sm',
  md: 'h-11 rounded-full px-5 text-sm',
  lg: 'h-12 rounded-full px-6 text-base',
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-60',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'

export { Button }
