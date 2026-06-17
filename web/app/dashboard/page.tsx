'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAccount, useSwitchChain, useWriteContract } from 'wagmi'
import {
  Coins,
  Gift,
  Plus,
  Sparkles,
  Sprout,
  Wallet,
  ShieldAlert,
  ShieldCheck,
  Building2,
  ArrowUpRight,
} from 'lucide-react'

import { Container, Section, Divider, Eyebrow } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Stat } from '@/components/ui/Stat'
import { AmountInput, Input, Field } from '@/components/ui/Input'
import { CapBar } from '@/components/ui/CapBar'
import { AddressChip } from '@/components/ui/AddressChip'
import { ConnectButton } from '@/components/ui/ConnectButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { BrandMark } from '@/components/ui/BrandMark'
import { PerkEditor } from '@/components/PerkEditor'

import { useBrands, useBrand, useAvailableYield } from '@/lib/hooks'
import type { Benefit, BenefitsDoc } from '@/lib/types'
import { fmtUnits, toUnits, truncate } from '@/lib/format'
import { loadBenefits, parseBenefits } from '@/lib/benefits'
import { DEFAULT_ACCENT } from '@/lib/theme'
import { vaultAbi } from '@/lib/abis'
import { CHAIN } from '@/lib/chain'
import { useTx } from '@/lib/useTx'
import { cn } from '@/lib/cn'

export default function DashboardPage() {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const { brands, isLoading, isError, refetch } = useBrands()

  const owned = useMemo(
    () => brands.filter((b) => address && b.owner.toLowerCase() === address.toLowerCase()),
    [brands, address],
  )

  const [selectedVault, setSelectedVault] = useState<`0x${string}` | undefined>(undefined)

  // Keep selection valid as the owned list resolves / changes.
  useEffect(() => {
    if (owned.length === 0) {
      if (selectedVault !== undefined) setSelectedVault(undefined)
      return
    }
    if (!selectedVault || !owned.some((b) => b.vault === selectedVault)) {
      setSelectedVault(owned[0].vault)
    }
  }, [owned, selectedVault])

  // ---- Connection gates -----------------------------------------------------
  if (!isConnected) {
    return (
      <Container className="py-10">
        <Card className="mx-auto max-w-md text-center">
          <EmptyState
            icon={<Wallet size={22} />}
            title="Connect to manage your coins"
            description="Sign in with the wallet that launched your coin to view earnings, edit perks, and manage controls."
            action={<ConnectButton size="lg" />}
          />
        </Card>
      </Container>
    )
  }

  if (chainId !== CHAIN.id) {
    return (
      <Container className="py-10">
        <Card className="mx-auto max-w-md text-center">
          <EmptyState
            icon={<ShieldAlert size={22} />}
            title={`Switch to ${CHAIN.name}`}
            description="Your dashboard lives on the testnet. Switch networks to continue."
            action={
              <Button variant="primary" size="lg" onClick={() => switchChain({ chainId: CHAIN.id })}>
                Switch to {CHAIN.name}
              </Button>
            }
          />
        </Card>
      </Container>
    )
  }

  if (isLoading) {
    return (
      <Container className="py-10">
        <div className="space-y-6">
          <Skeleton className="h-9 w-48" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      </Container>
    )
  }

  if (isError) {
    return (
      <Container className="py-10">
        <Card className="mx-auto max-w-lg text-center">
          <EmptyState
            icon={<Coins size={22} />}
            title="Couldn't load your coins"
            description="The network request failed. Check your connection and try again."
            action={
              <Button variant="primary" onClick={() => refetch()}>
                Retry
              </Button>
            }
          />
        </Card>
      </Container>
    )
  }

  if (owned.length === 0) {
    return (
      <Container className="py-10">
        <Card className="mx-auto max-w-lg text-center">
          <EmptyState
            icon={<Coins size={22} />}
            title="You haven't launched a coin yet"
            description="Spin up your own stablecoin in minutes. Fans deposit USDC, get your coin 1:1, and unlock perks."
            action={
              <Link
                href="/launch"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-md bg-accent px-6 text-base font-medium text-accent-fg shadow-glow transition hover:bg-accent-hover"
              >
                <Plus size={16} />
                Launch your coin
              </Link>
            }
          />
        </Card>
      </Container>
    )
  }

  return (
    <Container className="py-10">
      <DashboardHeader
        owned={owned}
        selectedVault={selectedVault}
        onSelect={setSelectedVault}
      />
      {selectedVault && (
        <DashboardBody key={selectedVault} vault={selectedVault} onBrandsChanged={refetch} />
      )}
    </Container>
  )
}

/* ----------------------------------------------------------------------------
 * Header: title + brand switcher + "New coin"
 * ------------------------------------------------------------------------- */
function DashboardHeader({
  owned,
  selectedVault,
  onSelect,
}: {
  owned: ReturnType<typeof useBrands>['brands']
  selectedVault?: `0x${string}`
  onSelect: (v: `0x${string}`) => void
}) {
  const router = useRouter()
  return (
    <div className="animate-slide-up space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <Eyebrow>Creator dashboard</Eyebrow>
          <h1 className="font-display text-3xl font-bold tracking-tight text-fg">Manage your coin</h1>
        </div>
        <Button variant="outline" size="md" leftIcon={<Plus size={16} />} onClick={() => router.push('/launch')}>
          New coin
        </Button>
      </div>

      {owned.length > 1 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {owned.map((b) => {
            const active = b.vault === selectedVault
            return (
              <button
                key={b.vault}
                type="button"
                onClick={() => onSelect(b.vault)}
                className={cn(
                  'flex shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition',
                  active
                    ? 'border-accent bg-accent-soft'
                    : 'border-border bg-surface hover:border-border-strong',
                )}
              >
                <BrandMark name={b.name} symbol={b.symbol} size="sm" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-fg">{b.name}</div>
                  <div className="text-xs text-fg-subtle">${b.symbol.replace(/^\$/, '')}</div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <Divider />
    </div>
  )
}

/* ----------------------------------------------------------------------------
 * Body: all per-brand sections for the selected vault
 * ------------------------------------------------------------------------- */
function DashboardBody({
  vault,
  onBrandsChanged,
}: {
  vault: `0x${string}`
  onBrandsChanged: () => void
}) {
  const { profile, paused, refetch: refetchBrand } = useBrand(vault)
  const { yield: avail, refetch: refetchYield } = useAvailableYield(vault)
  const { writeContractAsync } = useWriteContract()
  const runTx = useTx()

  const symbol = profile ? `$${profile.symbol.replace(/^\$/, '')}` : ''

  if (!profile) {
    return (
      <div className="mt-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Brand identity strip */}
      <div className="flex flex-wrap items-center gap-3">
        <BrandMark name={profile.name} symbol={profile.symbol} logoUrl={profile.logoURI || undefined} size="md" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-semibold text-fg">{profile.name}</h2>
            <Badge tone="accent">{symbol}</Badge>
            {paused ? (
              <Badge tone="warning" dot>
                Mints paused
              </Badge>
            ) : (
              <Badge tone="success" dot>
                Live
              </Badge>
            )}
          </div>
          {profile.description && (
            <p className="mt-0.5 max-w-xl truncate text-sm text-fg-muted">{profile.description}</p>
          )}
        </div>
      </div>

      {/* 1) Hero stat row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <Stat label="Total deposited" value={`$${fmtUnits(profile.totalPrincipal)}`} />
        </Card>
        <Card>
          <Stat
            label="Creator earnings (available)"
            tone="success"
            value={`$${fmtUnits(avail)}`}
            sub="Earned on fans' deposits via Aave"
          />
        </Card>
        <Card>
          <Stat label="Treasury" size="md" value={<AddressChip address={profile.treasury} />} />
        </Card>
      </div>

      {/* 2) Harvest */}
      <HarvestCard
        avail={avail}
        symbol={symbol}
        onHarvest={async () => {
          const hash = await runTx(
            { pending: 'Harvesting…', success: 'Harvested to treasury' },
            () => writeContractAsync({ address: vault, abi: vaultAbi, functionName: 'harvestYield' }),
          )
          if (hash) {
            refetchYield()
            refetchBrand()
          }
        }}
      />

      {/* 3) Perks */}
      <PerksCard
        vault={vault}
        benefitsURI={profile.benefitsURI}
        brandName={profile.name}
        brandSymbol={profile.symbol}
        description={profile.description}
        runTx={runTx}
        writeContractAsync={writeContractAsync}
        onSaved={refetchBrand}
      />

      {/* 4) Controls */}
      <div className="grid gap-6 md:grid-cols-2">
        <CapCard
          vault={vault}
          totalPrincipal={profile.totalPrincipal}
          cap={profile.cap}
          runTx={runTx}
          writeContractAsync={writeContractAsync}
          onUpdated={() => {
            refetchBrand()
            onBrandsChanged()
          }}
        />
        <div className="space-y-6">
          <PauseCard
            vault={vault}
            paused={!!paused}
            runTx={runTx}
            writeContractAsync={writeContractAsync}
            onUpdated={refetchBrand}
          />
          <TreasuryCard
            vault={vault}
            treasury={profile.treasury}
            runTx={runTx}
            writeContractAsync={writeContractAsync}
            onUpdated={() => {
              refetchBrand()
              onBrandsChanged()
            }}
          />
        </div>
      </div>

      {/* 5) Advanced note */}
      <Card inset className="flex items-start gap-3 bg-surface-2 p-4 text-sm text-fg-muted">
        <Sparkles size={16} className="mt-0.5 shrink-0 text-fg-subtle" />
        <p>
          Principal is always your fans&apos; money — they can redeem 1:1 anytime. You only ever withdraw the{' '}
          <span className="font-medium text-fg">creator earnings</span> generated on top.
        </p>
      </Card>
    </div>
  )
}

type RunTx = ReturnType<typeof useTx>
type WriteAsync = ReturnType<typeof useWriteContract>['writeContractAsync']

/* ----------------------------------------------------------------------------
 * Harvest
 * ------------------------------------------------------------------------- */
function HarvestCard({
  avail,
  symbol,
  onHarvest,
}: {
  avail?: bigint
  symbol: string
  onHarvest: () => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const nothing = !avail || avail === 0n

  return (
    <Card glow className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Sprout size={16} className="text-success" />
          <Eyebrow>Creator earnings (available)</Eyebrow>
        </div>
        <div className="font-display text-stat font-bold tnum text-success">${fmtUnits(avail)}</div>
        <p className="text-sm text-fg-subtle">
          {nothing
            ? 'No yield yet — it grows as deposits sit in Aave.'
            : `Withdraw to your treasury. Fan principal for ${symbol} stays untouched.`}
        </p>
      </div>
      <Button
        variant="success"
        size="lg"
        loading={busy}
        disabled={nothing}
        onClick={async () => {
          setBusy(true)
          try {
            await onHarvest()
          } finally {
            setBusy(false)
          }
        }}
      >
        Harvest to treasury
      </Button>
    </Card>
  )
}

/* ----------------------------------------------------------------------------
 * Perks
 * ------------------------------------------------------------------------- */
function PerksCard({
  vault,
  benefitsURI,
  brandName,
  brandSymbol,
  description,
  runTx,
  writeContractAsync,
  onSaved,
}: {
  vault: `0x${string}`
  benefitsURI: string
  brandName: string
  brandSymbol: string
  description: string
  runTx: RunTx
  writeContractAsync: WriteAsync
  onSaved: () => void
}) {
  const [perks, setPerks] = useState<Benefit[]>([])
  const [loadingPerks, setLoadingPerks] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let live = true
    setLoadingPerks(true)
    loadBenefits(benefitsURI)
      .then((d) => {
        if (live) setPerks(d.benefits)
      })
      .finally(() => {
        if (live) setLoadingPerks(false)
      })
    return () => {
      live = false
    }
  }, [benefitsURI])

  const save = async () => {
    setBusy(true)
    try {
      const accent = parseBenefits(benefitsURI).accent ?? DEFAULT_ACCENT
      const doc: BenefitsDoc = {
        version: 1,
        brand: brandName,
        symbol: brandSymbol,
        description,
        accent,
        benefits: perks,
      }
      const hash = await runTx(
        { pending: 'Saving perks…', success: 'Perks saved' },
        () =>
          writeContractAsync({
            address: vault,
            abi: vaultAbi,
            functionName: 'setBenefitsURI',
            args: [JSON.stringify(doc)],
          }),
      )
      if (hash) onSaved()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gift size={16} className="text-accent" />
          <div>
            <h3 className="font-display text-lg font-semibold text-fg">Perks</h3>
            <p className="text-sm text-fg-muted">What fans unlock by holding your coin.</p>
          </div>
        </div>
        <Button variant="primary" loading={busy} onClick={save}>
          Save perks
        </Button>
      </div>

      {loadingPerks ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <PerkEditor value={perks} onChange={setPerks} />
      )}
    </Card>
  )
}

/* ----------------------------------------------------------------------------
 * Cap
 * ------------------------------------------------------------------------- */
function CapCard({
  vault,
  totalPrincipal,
  cap,
  runTx,
  writeContractAsync,
  onUpdated,
}: {
  vault: `0x${string}`
  totalPrincipal: bigint
  cap: bigint
  runTx: RunTx
  writeContractAsync: WriteAsync
  onUpdated: () => void
}) {
  const [capInput, setCapInput] = useState('')
  const [busy, setBusy] = useState(false)

  const update = async () => {
    const next = capInput.trim() ? toUnits(capInput) : 0n
    if (next === undefined) return
    setBusy(true)
    try {
      const hash = await runTx(
        { pending: 'Updating cap…', success: 'Cap updated' },
        () => writeContractAsync({ address: vault, abi: vaultAbi, functionName: 'setCap', args: [next] }),
      )
      if (hash) {
        setCapInput('')
        onUpdated()
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="space-y-5">
      <div className="flex items-center gap-2">
        <Coins size={16} className="text-accent" />
        <div>
          <h3 className="font-display text-lg font-semibold text-fg">Deposit cap</h3>
          <p className="text-sm text-fg-muted">Limit total fan deposits. Leave at 0 for no cap.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-2 p-4">
        <CapBar value={totalPrincipal} max={cap} />
      </div>

      <Field label="New cap" hint="Set 0 to remove the cap entirely.">
        <AmountInput value={capInput} onValueChange={setCapInput} suffix="USDC" />
      </Field>

      <Button variant="secondary" fullWidth loading={busy} onClick={update}>
        Update cap
      </Button>
    </Card>
  )
}

/* ----------------------------------------------------------------------------
 * Pause / Unpause
 * ------------------------------------------------------------------------- */
function PauseCard({
  vault,
  paused,
  runTx,
  writeContractAsync,
  onUpdated,
}: {
  vault: `0x${string}`
  paused: boolean
  runTx: RunTx
  writeContractAsync: WriteAsync
  onUpdated: () => void
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
      const hash = await runTx(
        paused
          ? { pending: 'Resuming mints…', success: 'Mints resumed' }
          : { pending: 'Pausing mints…', success: 'Mints paused' },
        () =>
          writeContractAsync({
            address: vault,
            abi: vaultAbi,
            functionName: paused ? 'unpause' : 'pause',
          }),
      )
      if (hash) {
        setOpen(false)
        onUpdated()
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        {paused ? <ShieldAlert size={16} className="text-warning" /> : <ShieldCheck size={16} className="text-success" />}
        <div>
          <h3 className="font-display text-lg font-semibold text-fg">Minting</h3>
          <p className="text-sm text-fg-muted">
            {paused ? 'New mints are paused. Fans can still redeem.' : 'Fans can mint your coin right now.'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        {paused ? (
          <Badge tone="warning" dot>
            Paused
          </Badge>
        ) : (
          <Badge tone="success" dot>
            Active
          </Badge>
        )}
        <Button variant={paused ? 'secondary' : 'danger'} onClick={() => setOpen(true)}>
          {paused ? 'Resume mints' : 'Pause mints'}
        </Button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={paused ? 'Resume minting?' : 'Pause minting?'}>
        <p className="text-sm text-fg-muted">Pausing stops new mints. Redemptions stay open.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant={paused ? 'success' : 'danger'} loading={busy} onClick={confirm}>
            {paused ? 'Resume mints' : 'Pause mints'}
          </Button>
        </div>
      </Modal>
    </Card>
  )
}

/* ----------------------------------------------------------------------------
 * Treasury
 * ------------------------------------------------------------------------- */
function TreasuryCard({
  vault,
  treasury,
  runTx,
  writeContractAsync,
  onUpdated,
}: {
  vault: `0x${string}`
  treasury: `0x${string}`
  runTx: RunTx
  writeContractAsync: WriteAsync
  onUpdated: () => void
}) {
  const [open, setOpen] = useState(false)
  const [next, setNext] = useState('')
  const [busy, setBusy] = useState(false)

  const valid = /^0x[a-fA-F0-9]{40}$/.test(next.trim())

  const confirm = async () => {
    if (!valid) return
    setBusy(true)
    try {
      const hash = await runTx(
        { pending: 'Updating treasury…', success: 'Treasury updated' },
        () =>
          writeContractAsync({
            address: vault,
            abi: vaultAbi,
            functionName: 'setTreasury',
            args: [next.trim() as `0x${string}`],
          }),
      )
      if (hash) {
        setOpen(false)
        setNext('')
        onUpdated()
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 size={16} className="text-accent" />
        <div>
          <h3 className="font-display text-lg font-semibold text-fg">Treasury</h3>
          <p className="text-sm text-fg-muted">Where harvested creator earnings are sent.</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <AddressChip address={treasury} />
        <Button variant="outline" rightIcon={<ArrowUpRight size={14} />} onClick={() => setOpen(true)}>
          Change
        </Button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Change treasury">
        <div className="space-y-4">
          <p className="text-sm text-fg-muted">
            Set the wallet that receives harvested earnings. This does not affect fan principal.
          </p>
          <Field
            label="New treasury address"
            error={next.trim() && !valid ? 'Enter a valid 0x address' : undefined}
          >
            <Input
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="0x…"
              error={!!next.trim() && !valid}
              spellCheck={false}
            />
          </Field>
          {valid && next.trim().toLowerCase() === treasury.toLowerCase() && (
            <p className="text-xs text-fg-subtle">That&apos;s already your current treasury — {truncate(treasury)}.</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={!valid} loading={busy} onClick={confirm}>
              Update treasury
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}
