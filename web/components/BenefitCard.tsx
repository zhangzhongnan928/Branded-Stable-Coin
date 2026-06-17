import { Lock, Check } from 'lucide-react'
import type { Benefit } from '@/lib/types'
import { BENEFIT_LABEL, BENEFIT_FALLBACK_EMOJI, isEnded, isUpcoming, isUnlocked } from '@/lib/benefits'
import { Badge } from './ui/Badge'
import { cn } from '@/lib/cn'

export function BenefitCard({
  benefit,
  symbol,
  balanceWhole,
}: {
  benefit: Benefit
  symbol?: string
  balanceWhole?: number
}) {
  const ended = isEnded(benefit)
  const upcoming = isUpcoming(benefit)
  const unlocked = balanceWhole !== undefined ? isUnlocked(benefit, balanceWhole) : undefined
  const emoji = benefit.emoji || BENEFIT_FALLBACK_EMOJI[benefit.type]
  const discount = benefit.discountValue
  const sym = symbol ? `$${symbol}` : 'the coin'

  return (
    <div className={cn('rounded-xl border border-border bg-surface p-4 transition', ended && 'opacity-60')}>
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-2 text-xl">{emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-display text-sm font-semibold">{benefit.title}</h4>
            <Badge tone="neutral">{BENEFIT_LABEL[benefit.type]}</Badge>
            {benefit.badge && <Badge tone="accent">{benefit.badge}</Badge>}
            {discount?.kind === 'percent' && <Badge tone="success">{discount.amount}% off</Badge>}
          </div>
          <p className="mt-1 text-sm text-fg-muted">{benefit.summary}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {benefit.minHold ? (
              unlocked === undefined ? (
                <Badge tone="neutral" icon={<Lock size={11} />}>
                  Hold {benefit.minHold}+ {sym}
                </Badge>
              ) : unlocked ? (
                <Badge tone="success" icon={<Check size={11} />}>Unlocked</Badge>
              ) : (
                <Badge tone="neutral" icon={<Lock size={11} />}>
                  Hold {benefit.minHold}+ {sym} to unlock
                </Badge>
              )
            ) : (
              <Badge tone="success" icon={<Check size={11} />}>Open to all holders</Badge>
            )}
            {ended && <Badge tone="danger">Ended</Badge>}
            {upcoming && <Badge tone="warning">Coming soon</Badge>}
            {benefit.url && !ended && (
              <a href={benefit.url} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">
                Details ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
