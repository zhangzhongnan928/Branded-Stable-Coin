'use client'

import { cn } from '@/lib/cn'

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cn('inline-flex rounded-pill border border-border bg-surface-2 p-1', className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          data-active={value === t.value || undefined}
          className="h-9 rounded-pill px-4 text-sm font-medium text-fg-muted transition data-[active]:bg-surface data-[active]:text-fg data-[active]:shadow-xs"
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
