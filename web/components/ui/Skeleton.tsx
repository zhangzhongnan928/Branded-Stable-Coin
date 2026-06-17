import { cn } from '@/lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return (
    <span className={cn('relative block overflow-hidden rounded-md bg-surface-2', className)}>
      <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-fg/[0.07] to-transparent" />
    </span>
  )
}
