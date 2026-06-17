import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  glow?: boolean
  inset?: boolean
}

export function Card({ interactive, glow, inset, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-xl shadow-sm',
        !inset && 'p-5 md:p-6',
        interactive && 'transition hover:shadow-md hover:border-border-strong cursor-pointer',
        glow && 'brand-glow shadow-glow',
        className,
      )}
      {...rest}
    />
  )
}
