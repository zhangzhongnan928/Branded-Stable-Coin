'use client'

import Link from 'next/link'
import type { BrandInfo } from '@/lib/types'
import { useBrand } from '@/lib/hooks'
import { parseBenefits } from '@/lib/benefits'
import { brandStyle } from '@/lib/theme'
import { fmtUnits } from '@/lib/format'
import { BrandMark } from './ui/BrandMark'
import { Card } from './ui/Card'
import { Stat } from './ui/Stat'
import { CapBar } from './ui/CapBar'
import { Badge } from './ui/Badge'

export function BrandCard({ brand }: { brand: BrandInfo }) {
  const { profile } = useBrand(brand.vault)
  const doc = parseBenefits(profile?.benefitsURI)
  const accent = doc.accent
  return (
    <Link href={`/b/${brand.vault}`} style={brandStyle(accent)} className="block">
      <Card interactive className="h-full">
        <div className="flex items-center gap-3">
          <BrandMark name={brand.name} symbol={brand.symbol} logoUrl={profile?.logoURI || undefined} color={accent} size="md" />
          <div className="min-w-0">
            <div className="truncate font-display font-semibold">{brand.name}</div>
            <div className="font-mono text-xs text-fg-muted">${brand.symbol}</div>
          </div>
        </div>
        {profile?.description && <p className="mt-3 line-clamp-2 text-sm text-fg-muted">{profile.description}</p>}
        <div className="mt-4 flex items-end justify-between">
          <Stat size="md" label="Total deposited" value={profile ? `$${fmtUnits(profile.totalPrincipal)}` : '—'} />
          {doc.benefits.length > 0 && <Badge tone="accent">{doc.benefits.length} perks</Badge>}
        </div>
        {profile && profile.cap > 0n && (
          <div className="mt-3">
            <CapBar value={profile.totalPrincipal} max={profile.cap} />
          </div>
        )}
      </Card>
    </Link>
  )
}
