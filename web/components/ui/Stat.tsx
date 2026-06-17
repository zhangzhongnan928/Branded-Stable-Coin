import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Skeleton } from './Skeleton'
import { Eyebrow } from './Layout'

export function Stat({
  label,
  value,
  sub,
  tone = 'default',
  size = 'lg',
  loading,
  className,
}: {
  label: ReactNode
  value: ReactNode
  sub?: ReactNode
  tone?: 'default' | 'accent' | 'success'
  size?: 'md' | 'lg'
  loading?: boolean
  className?: string
}) {
  const toneCls = tone === 'accent' ? 'text-accent' : tone === 'success' ? 'text-success' : 'text-fg'
  const sizeCls = size === 'lg' ? 'text-stat' : 'text-2xl'
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <Eyebrow>{label}</Eyebrow>
      {loading ? (
        <Skeleton className="h-9 w-24" />
      ) : (
        <div className={cn('font-display font-bold tnum', sizeCls, toneCls)}>{value}</div>
      )}
      {sub && <div className="text-xs text-fg-subtle">{sub}</div>}
    </div>
  )
}
