import * as React from 'react'
import { cn } from '../../lib/utils'

type BadgeVariant = 'default' | 'secondary' | 'outline'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-brand-600 text-white',
  secondary: 'bg-slate-100 text-slate-700',
  outline: 'border border-slate-200 text-slate-700',
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', badgeVariants[variant], className)}
      {...props}
    />
  ),
)
Badge.displayName = 'Badge'

export { Badge }
