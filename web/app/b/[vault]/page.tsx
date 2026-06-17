'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Share2, Sparkles } from 'lucide-react'
import { useAccount } from 'wagmi'

import { Container, Section } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Stat } from '@/components/ui/Stat'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { BrandMark } from '@/components/ui/BrandMark'
import { CapBar } from '@/components/ui/CapBar'
import { AddressChip } from '@/components/ui/AddressChip'
import { MintRedeemCard } from '@/components/MintRedeemCard'
import { BenefitsList } from '@/components/BenefitsList'

import { useBrand, useErc20Balance } from '@/lib/hooks'
import { parseBenefits } from '@/lib/benefits'
import { brandStyle } from '@/lib/theme'
import { fmtUnits, toWholeTokens } from '@/lib/format'

export default function Page({ params }: { params: { vault: string } }) {
  const vault = params.vault as `0x${string}`

  const { profile, paused, isSolvent, isLoading, isError, refetch } = useBrand(vault)
  const { address } = useAccount()
  const { balance } = useErc20Balance(profile?.token, address)

  const doc = parseBenefits(profile?.benefitsURI)
  const accent = doc.accent
  const balanceWhole = balance !== undefined ? toWholeTokens(balance) : undefined

  const [copied, setCopied] = useState(false)
  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  return (
    <div className="dark min-h-screen bg-bg text-fg" style={brandStyle(accent)}>
      <Container className="py-10">
        {/* Loading skeleton */}
        {isLoading && !profile && (
          <div className="space-y-6">
            <div className="flex items-center gap-5">
              <Skeleton className="h-20 w-20 rounded-2xl" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-80" />
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
              </div>
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          </div>
        )}

        {/* Load error (distinct from genuinely-not-found) */}
        {!profile && !isLoading && isError && (
          <EmptyState
            icon={<Sparkles className="h-6 w-6" />}
            title="Couldn't load this coin"
            description="The network request failed. Check your connection and try again."
            action={<Button variant="primary" onClick={() => refetch()}>Retry</Button>}
          />
        )}

        {/* Not found */}
        {!profile && !isLoading && !isError && (
          <EmptyState
            icon={<Sparkles className="h-6 w-6" />}
            title="Brand not found"
            description="We couldn't find a coin at this address. It may not exist on this network yet."
            action={
              <Link href="/">
                <Button variant="primary">Explore coins</Button>
              </Link>
            }
          />
        )}

        {/* Brand present */}
        {profile && (
          <div className="space-y-10">
            {/* 1) HERO */}
            <section className="relative animate-slide-up">
              <div
                className="pointer-events-none absolute -top-24 left-0 -z-10 h-64 w-2/3 opacity-70 blur-3xl"
                style={{
                  background:
                    'radial-gradient(60% 60% at 30% 30%, rgb(var(--accent) / 0.45), transparent 70%)',
                }}
                aria-hidden
              />

              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-5">
                  <BrandMark
                    size="xl"
                    name={profile.name}
                    symbol={profile.symbol}
                    logoUrl={profile.logoURI || undefined}
                    color={accent}
                  />
                  <div className="space-y-3">
                    <h1 className="font-display text-3xl font-bold tracking-tight text-fg md:text-4xl">
                      {profile.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="neutral" className="font-mono">
                        ${profile.symbol}
                      </Badge>
                      {paused ? (
                        <Badge tone="warning" dot>
                          Paused
                        </Badge>
                      ) : (
                        <Badge tone="success" dot>
                          Live
                        </Badge>
                      )}
                      {!isSolvent && <Badge tone="danger">Backing catching up</Badge>}
                    </div>
                    {profile.description && (
                      <p className="max-w-prose-tight text-fg-muted">{profile.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                    onClick={onShare}
                  >
                    {copied ? 'Copied' : 'Share'}
                  </Button>
                  <AddressChip address={profile.token} />
                </div>
              </div>
            </section>

            {/* 2) Two-column */}
            <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
              {/* LEFT: stats + benefits */}
              <div className="space-y-8">
                <Card inset className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <Stat
                      size="md"
                      label="Total deposited"
                      value={`$${fmtUnits(profile.totalPrincipal)}`}
                    />
                    <Stat
                      size="md"
                      label="Your balance"
                      tone="accent"
                      value={`${fmtUnits(balance)} $${profile.symbol}`}
                    />
                  </div>
                  <p className="text-sm font-medium text-fg">
                    Always redeemable 1:1 for USDC.
                  </p>
                  {profile.cap > 0n && <CapBar value={profile.totalPrincipal} max={profile.cap} />}
                </Card>

                <div className="space-y-4">
                  <h2 className="font-display text-xl font-semibold text-fg">Perks for holders</h2>
                  <BenefitsList
                    benefitsURI={profile.benefitsURI}
                    symbol={profile.symbol}
                    balanceWhole={balanceWhole}
                  />
                </div>
              </div>

              {/* RIGHT: mint / redeem */}
              <div className="lg:sticky lg:top-20 lg:self-start">
                <MintRedeemCard
                  vault={vault}
                  token={profile.token}
                  symbol={profile.symbol}
                  paused={paused}
                  onChanged={refetch}
                />
              </div>
            </div>

            {/* 3) Footer CTA */}
            <Section className="!py-0">
              <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-border bg-surface-2 px-6 py-6 text-center sm:flex-row sm:text-left">
                <div>
                  <p className="font-display text-lg font-semibold text-fg">Want your own?</p>
                  <p className="text-sm text-fg-muted">
                    Your coin. Your community. Their perks.
                  </p>
                </div>
                <Link href="/launch">
                  <Button variant="primary" rightIcon={<Sparkles className="h-4 w-4" />}>
                    Launch a coin
                  </Button>
                </Link>
              </div>
            </Section>
          </div>
        )}
      </Container>
    </div>
  )
}
