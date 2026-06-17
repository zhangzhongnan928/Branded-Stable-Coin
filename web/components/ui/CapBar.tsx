import { cn } from '@/lib/cn'
import { fmtUnits } from '@/lib/format'

export function CapBar({ value, max, className }: { value: bigint; max: bigint; className?: string }) {
  if (max === 0n) {
    return <div className={cn('text-xs text-fg-muted tnum', className)}>${fmtUnits(value)} deposited · no cap</div>
  }
  const pct = max > 0n ? Number((value * 10000n) / max) / 100 : 0
  const fill = Math.min(100, Math.max(0, pct))
  const tone = pct >= 100 ? 'bg-danger' : pct >= 90 ? 'bg-warning' : 'bg-accent'
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="h-2 overflow-hidden rounded-pill bg-surface-2">
        <div className={cn('h-full rounded-pill transition-[width] duration-500', tone)} style={{ width: `${fill}%` }} />
      </div>
      <div className="text-xs text-fg-muted tnum">
        ${fmtUnits(value)} / ${fmtUnits(max)} · {pct >= 100 ? 'Cap reached' : `${pct.toFixed(0)}%`}
      </div>
    </div>
  )
}
