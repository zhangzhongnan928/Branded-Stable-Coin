'use client'

import Link from 'next/link'
import { ArrowRight, Coins, ShieldCheck, Sparkles, Wallet } from 'lucide-react'
import { Container, Section } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { BrandMark } from '@/components/ui/BrandMark'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { BrandCard } from '@/components/BrandCard'
import { useBrands } from '@/lib/hooks'
import { isFactoryConfigured } from '@/lib/env'
import { DEMO_BRANDS } from '@/lib/demo'
import { brandStyle, DEFAULT_ACCENT } from '@/lib/theme'

const STEPS = [
  {
    n: '1',
    title: 'Launch',
    body: 'Name your coin, pick a symbol, set the perks. Live on testnet in minutes — no code.',
  },
  {
    n: '2',
    title: 'Fans hold',
    body: 'Fans swap USDC for your coin 1:1. Holding it unlocks roles, discounts, drops, and IRL access you control.',
  },
  {
    n: '3',
    title: 'Cash out anytime',
    body: "Every coin is backed 1:1 by USDC and redeemable on demand. Fans' money stays theirs — you earn on the pool.",
  },
]

const PERKS = [
  { emoji: '💬', label: 'Token-gated Discord' },
  { emoji: '🎟️', label: 'IRL / VIP access' },
  { emoji: '🏷️', label: 'Partner discounts' },
  { emoji: '🎁', label: 'Drops' },
  { emoji: '🔓', label: 'Early access' },
]

const FAQ = [
  {
    q: 'Is this a stablecoin? Will I lose money?',
    a: 'Your coin is always worth $1 and redeemable 1:1 for USDC, anytime. Your deposit stays yours. This is a testnet demo, so no real money is involved.',
  },
  {
    q: "What do I get for holding a creator's coin?",
    a: 'Perks the creator sets — token-gated Discord/Telegram, discounts, drops, IRL/VIP access, partner deals. Each perk shows how much you need to hold.',
  },
  {
    q: 'How do creators make money if fans can cash out 1:1?',
    a: "While fans hold, the pooled deposits earn yield in the background. That yield goes to the creator — never out of fans' pockets.",
  },
]

export default function Page() {
  const { brands, isLoading, isError, refetch } = useBrands()
  const hasLiveBrands = isFactoryConfigured && brands.length > 0

  return (
    <main>
      {/* 1) HERO */}
      <Section className="relative overflow-hidden">
        <div className="brand-glow pointer-events-none absolute inset-x-0 -top-24 h-[420px]" aria-hidden />
        <Container>
          <div className="grid animate-slide-up items-center gap-12 md:grid-cols-2">
            {/* Left */}
            <div>
              <Badge tone="accent" dot>
                For creators &amp; communities
              </Badge>
              <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
                Launch a coin your fans actually want to hold.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-fg-muted">
                Minted lets creators spin up their own dollar-backed coin in minutes. Fans hold it to unlock your
                perks — and can cash out 1:1 anytime. You keep what the pool earns.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/launch">
                  <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Launch your coin
                  </Button>
                </Link>
                <Link href="#brands">
                  <Button size="lg" variant="ghost">
                    Explore coins
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                <Badge tone="usdc" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
                  Backed 1:1 by USDC
                </Badge>
                <Badge tone="success" icon={<Wallet className="h-3.5 w-3.5" />}>
                  Redeem anytime
                </Badge>
                <Badge tone="neutral" icon={<Sparkles className="h-3.5 w-3.5" />}>
                  Live on Base
                </Badge>
              </div>
            </div>

            {/* Right — decorative mock brand card */}
            <div className="relative" style={brandStyle(DEFAULT_ACCENT)} aria-hidden>
              <Card glow className="shadow-xl md:ml-auto md:max-w-md">
                <div className="flex items-center gap-3">
                  <BrandMark name="Vibe" symbol="VIBE" color={DEFAULT_ACCENT} size="lg" />
                  <div className="min-w-0">
                    <div className="font-display text-lg font-semibold">Vibe</div>
                    <div className="font-mono text-xs text-fg-muted">$VIBE</div>
                  </div>
                  <Badge tone="success" dot className="ml-auto">
                    Live
                  </Badge>
                </div>

                {/* Fake mint preview */}
                <div className="mt-5 rounded-xl border border-border bg-surface-2 p-4">
                  <div className="flex items-center justify-between text-xs text-fg-subtle">
                    <span>You pay</span>
                    <span>Balance 250.00</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-display text-2xl font-bold tnum">100.00</span>
                    <Badge tone="usdc">USDC</Badge>
                  </div>
                  <div className="my-3 flex items-center justify-center text-fg-subtle">
                    <ArrowRight className="h-4 w-4 rotate-90" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-2xl font-bold tnum text-accent">100.00</span>
                    <Badge tone="accent" icon={<Coins className="h-3.5 w-3.5" />}>
                      $VIBE
                    </Badge>
                  </div>
                </div>

                {/* Perk pills */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface-2 px-2.5 py-1 text-xs text-fg-muted">
                    💬 Inner-circle Discord
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface-2 px-2.5 py-1 text-xs text-fg-muted">
                    🎟️ Front-row access
                  </span>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </Section>

      {/* 2) HOW IT WORKS */}
      <Section className="bg-surface-2/40">
        <Container>
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">How it works</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <Card key={s.n} className="relative overflow-hidden">
                <span className="pointer-events-none absolute -right-2 -top-6 select-none font-display text-8xl font-extrabold leading-none text-fg/[0.04]">
                  {s.n}
                </span>
                <div className="relative">
                  <h3 className="font-display text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-fg-muted">{s.body}</p>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* 3) FEATURED BRANDS */}
      <section id="brands" className="py-16 md:py-24">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Communities already building</h2>
            <Link href="/launch">
              <Button variant="ghost" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Start yours
              </Button>
            </Link>
          </div>

          <div className="mt-10">
            {isFactoryConfigured && isError && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-fg-muted">
                <span>Couldn&apos;t load live coins right now — showing previews.</span>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            )}
            {isLoading && isFactoryConfigured ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-52 w-full rounded-xl" />
                ))}
              </div>
            ) : hasLiveBrands ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {brands.map((b) => (
                  <BrandCard key={b.vault} brand={b} />
                ))}
              </div>
            ) : DEMO_BRANDS.length > 0 ? (
              <>
                <p className="mb-6 text-sm text-fg-subtle">
                  A preview of what creator communities look like on Minted.
                </p>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {DEMO_BRANDS.map((d) => (
                    <div key={d.symbol} style={brandStyle(d.accent)}>
                      <Card className="h-full">
                        <div className="flex items-center gap-3">
                          <BrandMark name={d.brand} symbol={d.symbol} color={d.accent} size="md" />
                          <div className="min-w-0">
                            <div className="truncate font-display font-semibold">{d.brand}</div>
                            <div className="font-mono text-xs text-fg-muted">${d.symbol}</div>
                          </div>
                          <Badge tone="neutral" className="ml-auto">
                            Preview
                          </Badge>
                        </div>
                        {d.description && (
                          <p className="mt-3 line-clamp-2 text-sm text-fg-muted">{d.description}</p>
                        )}
                        <div className="mt-4">
                          <Badge tone="accent">{d.benefits.length} perks</Badge>
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <Card inset className="p-2">
                <EmptyState
                  icon={<Sparkles className="h-5 w-5" />}
                  title="No coins yet"
                  description="Be the first community on Minted — launch your coin in minutes."
                  action={
                    <Link href="/launch">
                      <Button rightIcon={<ArrowRight className="h-4 w-4" />}>Launch your coin</Button>
                    </Link>
                  }
                />
              </Card>
            )}
          </div>
        </Container>
      </section>

      {/* 4) PERKS STRIP */}
      <Section className="bg-surface-2/40">
        <Container>
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">More than a stablecoin.</h2>
          <div className="mt-8 -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)] md:mx-0 md:px-0">
            {PERKS.map((p) => (
              <Card key={p.label} className="flex w-44 shrink-0 snap-start flex-col gap-3">
                <span className="text-3xl" aria-hidden>
                  {p.emoji}
                </span>
                <span className="text-sm font-medium text-fg">{p.label}</span>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* 5) FAQ */}
      <Section>
        <Container>
          <div className="mx-auto max-w-prose-tight">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Questions</h2>
            <div className="mt-8 space-y-3">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border border-border bg-surface p-5 shadow-sm [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display font-semibold text-fg">
                    {item.q}
                    <ArrowRight className="h-4 w-4 shrink-0 text-fg-subtle transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-fg-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* 6) CLOSING CTA */}
      <Section className="pt-0">
        <Container>
          <div
            className="brand-glow relative overflow-hidden rounded-2xl border border-border bg-accent-soft px-6 py-14 text-center md:px-12 md:py-20"
            style={brandStyle(DEFAULT_ACCENT)}
          >
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Ready to launch?</h2>
            <p className="mx-auto mt-3 max-w-md text-fg-muted">Your coin. Your community. Their perks.</p>
            <div className="mt-8 flex justify-center">
              <Link href="/launch">
                <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Launch your coin
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  )
}
