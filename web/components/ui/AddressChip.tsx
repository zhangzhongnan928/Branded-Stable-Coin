'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/cn'
import { truncate } from '@/lib/format'
import { explorerAddress } from '@/lib/chain'

export function AddressChip({
  address,
  explorer = true,
  className,
}: {
  address: string
  explorer?: boolean
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface-2 px-2 py-1 font-mono text-xs',
        className,
      )}
    >
      {truncate(address)}
      <button type="button" onClick={copy} aria-label="Copy address" className="text-fg-subtle transition hover:text-fg">
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
      {explorer && (
        <a
          href={explorerAddress(address)}
          target="_blank"
          rel="noreferrer"
          aria-label="View on BaseScan"
          className="text-fg-subtle transition hover:text-fg"
        >
          <ExternalLink size={12} />
        </a>
      )}
    </span>
  )
}
