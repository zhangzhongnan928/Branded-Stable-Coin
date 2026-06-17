'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { brandGradient, accentForeground } from '@/lib/theme'

const sizeMap = {
  sm: 'h-8 w-8 text-xs rounded-lg',
  md: 'h-12 w-12 text-sm rounded-xl',
  lg: 'h-16 w-16 text-lg rounded-xl',
  xl: 'h-20 w-20 text-2xl rounded-2xl',
}

export function BrandMark({
  name,
  symbol,
  logoUrl,
  color,
  size = 'md',
  className,
}: {
  name?: string
  symbol?: string
  logoUrl?: string
  color?: string
  size?: keyof typeof sizeMap
  className?: string
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const initials = (symbol || name || '?').replace(/^\$/, '').slice(0, 2).toUpperCase()
  if (logoUrl && !imgFailed) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={logoUrl}
        alt={name ? `${name} logo` : 'Brand logo'}
        onError={() => setImgFailed(true)}
        className={cn('object-cover', sizeMap[size], className)}
      />
    )
  }
  return (
    <div
      className={cn('flex items-center justify-center font-display font-bold', sizeMap[size], className)}
      style={{ background: brandGradient(color), color: `rgb(${accentForeground(color)})` }}
    >
      {initials}
    </div>
  )
}
