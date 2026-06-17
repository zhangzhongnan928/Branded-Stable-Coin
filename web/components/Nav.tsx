'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Container } from './ui/Layout'
import { ConnectButton } from './ui/ConnectButton'
import { ThemeToggle } from './ui/ThemeToggle'
import { Badge } from './ui/Badge'

const links = [
  { href: '/', label: 'Explore' },
  { href: '/launch', label: 'Launch' },
  { href: '/dashboard', label: 'Dashboard' },
]

export function Nav() {
  const [open, setOpen] = useState(false)
  return (
    <header className="glass sticky top-0 z-30 border-b border-border">
      <Container className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-display text-lg font-bold tracking-tight">
            Minted
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md px-3 py-1.5 text-sm text-fg-muted transition hover:bg-surface-2 hover:text-fg"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="warning" dot className="hidden sm:inline-flex">
            Testnet
          </Badge>
          <ThemeToggle />
          <div className="hidden sm:block">
            <ConnectButton />
          </div>
          <button className="text-fg md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </Container>
      {open && (
        <div className="border-t border-border bg-surface md:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-fg-muted hover:bg-surface-2"
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-2">
              <ConnectButton />
            </div>
          </Container>
        </div>
      )}
    </header>
  )
}
