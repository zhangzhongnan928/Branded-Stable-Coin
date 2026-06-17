'use client'

import { useEffect, useState } from 'react'
import { Gift } from 'lucide-react'
import { loadBenefits } from '@/lib/benefits'
import type { BenefitsDoc } from '@/lib/types'
import { BenefitCard } from './BenefitCard'
import { EmptyState } from './ui/EmptyState'
import { Skeleton } from './ui/Skeleton'

export function BenefitsList({
  benefitsURI,
  symbol,
  balanceWhole,
}: {
  benefitsURI?: string
  symbol?: string
  balanceWhole?: number
}) {
  const [doc, setDoc] = useState<BenefitsDoc | null>(null)
  useEffect(() => {
    let on = true
    loadBenefits(benefitsURI).then((d) => {
      if (on) setDoc(d)
    })
    return () => {
      on = false
    }
  }, [benefitsURI])

  if (!doc) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    )
  }
  if (doc.benefits.length === 0) {
    return <EmptyState icon={<Gift size={20} />} title="No perks yet" description="Check back soon — the creator is setting these up." />
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {doc.benefits.map((b) => (
        <BenefitCard key={b.id} benefit={b} symbol={symbol || doc.symbol} balanceWhole={balanceWhole} />
      ))}
    </div>
  )
}
