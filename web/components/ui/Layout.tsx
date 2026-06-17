import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Container({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto w-full max-w-page px-5 md:px-8', className)} {...rest} />
}

export function Section({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return <section className={cn('py-16 md:py-24', className)} {...rest} />
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-t border-border', className)} />
}

export function Eyebrow({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('text-xs font-medium uppercase tracking-[0.08em] text-fg-subtle', className)}
      {...rest}
    />
  )
}
