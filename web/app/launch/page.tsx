'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAccount, useWriteContract, usePublicClient } from 'wagmi'
import { decodeEventLog } from 'viem'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Rocket,
  Sparkles,
  Wallet,
  AlertTriangle,
  Settings2,
  Gift,
  IdCard,
} from 'lucide-react'

import { Container } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input, Textarea, Field, AmountInput } from '@/components/ui/Input'
import { BrandMark } from '@/components/ui/BrandMark'
import { AddressChip } from '@/components/ui/AddressChip'
import { ConnectButton } from '@/components/ui/ConnectButton'
import { PerkEditor } from '@/components/PerkEditor'

import type { Benefit, BenefitsDoc } from '@/lib/types'
import { toUnits, fmtUnits } from '@/lib/format'
import { brandStyle, DEFAULT_ACCENT, ACCENT_PRESETS } from '@/lib/theme'
import { env, isFactoryConfigured } from '@/lib/env'
import { factoryAbi } from '@/lib/abis'
import { CHAIN } from '@/lib/chain'
import { useTx } from '@/lib/useTx'
import { cn } from '@/lib/cn'

const STEPS = [
  { label: 'Identity', icon: IdCard },
  { label: 'Treasury & cap', icon: Settings2 },
  { label: 'Perks', icon: Gift },
  { label: 'Review', icon: Rocket },
] as const

const CAP_CHIPS = [
  { label: '10K', value: '10000' },
  { label: '50K', value: '50000' },
  { label: '250K', value: '250000' },
]

const cleanSymbol = (raw: string) =>
  raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 11)

export default function LaunchPage() {
  const { address, isConnected, chainId } = useAccount()
  const router = useRouter()
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()
  const runTx = useTx()

  const [step, setStep] = useState(0)
  const [deploying, setDeploying] = useState(false)

  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [description, setDescription] = useState('')
  const [accent, setAccent] = useState<string>(DEFAULT_ACCENT)
  const [logoURI, setLogoURI] = useState('')
  const [treasury, setTreasury] = useState('')
  const [capStr, setCapStr] = useState('')
  const [noCap, setNoCap] = useState(true)
  const [perks, setPerks] = useState<Benefit[]>([])

  const wrongChain = isConnected && chainId !== CHAIN.id
  const treasuryValue = treasury || address || ''

  const stepValid = (i: number): boolean => {
    if (i === 0) return name.trim().length > 0 && symbol.trim().length > 0
    return true
  }

  const canDeploy =
    !!name.trim() &&
    !!symbol.trim() &&
    isConnected &&
    isFactoryConfigured &&
    chainId === CHAIN.id

  const deployBlockReason = (): string | null => {
    if (!name.trim() || !symbol.trim()) return 'Add a name and symbol first.'
    if (!isConnected) return 'Connect your wallet to deploy.'
    if (!isFactoryConfigured) return 'Factory is not configured yet.'
    if (chainId !== CHAIN.id) return `Switch to ${CHAIN.name} to deploy.`
    return null
  }

  const next = () => {
    if (!stepValid(step)) return
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }
  const back = () => setStep((s) => Math.max(0, s - 1))

  const handleDeploy = async () => {
    if (!canDeploy || deploying) return
    setDeploying(true)
    try {
      const doc: BenefitsDoc = {
        version: 1,
        brand: name,
        symbol,
        description,
        accent,
        benefits: perks,
      }
      const cap = noCap ? 0n : toUnits(capStr) ?? 0n
      const treasuryAddr = (treasury || address) as `0x${string}`

      const hash = await runTx(
        { pending: 'Deploying your coin…', success: 'Your coin is live!' },
        () =>
          writeContractAsync({
            address: env.factoryAddress as `0x${string}`,
            abi: factoryAbi,
            functionName: 'createBrandWithProfile',
            args: [
              name,
              symbol,
              treasuryAddr,
              cap,
              logoURI,
              description,
              JSON.stringify(doc),
            ],
          }),
      )

      if (hash) {
        try {
          const receipt = await publicClient!.waitForTransactionReceipt({ hash })
          let vault: string | undefined
          for (const log of receipt.logs) {
            try {
              const ev = decodeEventLog({
                abi: factoryAbi,
                data: log.data,
                topics: log.topics,
              })
              if (ev.eventName === 'BrandCreated') {
                vault = (ev.args as any).vault
                break
              }
            } catch {
              /* not our event */
            }
          }
          if (vault) router.push(`/b/${vault}`)
          else router.push('/dashboard')
        } catch {
          router.push('/dashboard')
        }
      }
    } finally {
      setDeploying(false)
    }
  }

  return (
    <Container className="py-10">
      {/* Header */}
      <div className="mb-8 max-w-2xl animate-slide-up">
        <div className="mb-3 flex items-center gap-2">
          <Badge tone="accent" icon={<Sparkles size={12} />}>
            Launch
          </Badge>
          <Badge tone="warning" dot>
            {CHAIN.name} testnet
          </Badge>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-fg md:text-4xl">
          Launch your coin
        </h1>
        <p className="mt-2 text-fg-muted">
          Your coin. Your community. Their perks. 1 USDC = 1 coin, and fans can
          redeem 1:1 anytime — their principal is always theirs.
        </p>
      </div>

      {/* Gating notices */}
      <div className="mb-6 flex flex-col gap-3">
        {!isFactoryConfigured && (
          <Notice tone="warning" icon={<AlertTriangle size={16} />}>
            <span className="font-medium text-fg">Factory not configured yet</span>{' '}
            — deploy the contracts and set{' '}
            <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs">
              NEXT_PUBLIC_FACTORY_ADDRESS
            </code>
            . You can still fill out the form below.
          </Notice>
        )}
        {!isConnected && (
          <Notice tone="info" icon={<Wallet size={16} />}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>Connect your wallet to deploy. You can fill the form now.</span>
              <ConnectButton size="sm" />
            </div>
          </Notice>
        )}
        {wrongChain && (
          <Notice tone="warning" icon={<AlertTriangle size={16} />}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>Wrong network — switch to {CHAIN.name} to deploy.</span>
              <ConnectButton size="sm" />
            </div>
          </Notice>
        )}
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Wizard column */}
        <div className="w-full max-w-[560px]">
          <Stepper step={step} onJump={(i) => i <= step && setStep(i)} />

          <div className="mt-8">
            {step === 0 && (
              <StepIdentity
                name={name}
                setName={setName}
                symbol={symbol}
                setSymbol={(v) => setSymbol(cleanSymbol(v))}
                description={description}
                setDescription={setDescription}
                accent={accent}
                setAccent={setAccent}
                logoURI={logoURI}
                setLogoURI={setLogoURI}
              />
            )}
            {step === 1 && (
              <StepTreasury
                treasury={treasury}
                setTreasury={setTreasury}
                placeholder={address}
                noCap={noCap}
                setNoCap={setNoCap}
                capStr={capStr}
                setCapStr={setCapStr}
              />
            )}
            {step === 2 && (
              <section className="space-y-4">
                <StepHeading
                  title="Perks"
                  hint="What fans unlock by holding your coin. Add as many as you like — you can edit them anytime."
                />
                <PerkEditor value={perks} onChange={setPerks} />
              </section>
            )}
            {step === 3 && (
              <StepReview
                name={name}
                symbol={symbol}
                description={description}
                accent={accent}
                logoURI={logoURI}
                treasury={treasuryValue}
                noCap={noCap}
                capStr={capStr}
                perksCount={perks.length}
              />
            )}
          </div>

          {/* Footer nav */}
          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 0 ? (
              <Button variant="ghost" leftIcon={<ChevronLeft size={16} />} onClick={back}>
                Back
              </Button>
            ) : (
              <span />
            )}

            {step < STEPS.length - 1 ? (
              <Button
                variant="primary"
                rightIcon={<ChevronRight size={16} />}
                onClick={next}
                disabled={!stepValid(step)}
              >
                Continue
              </Button>
            ) : (
              <div className="flex flex-col items-end gap-1.5">
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<Rocket size={16} />}
                  onClick={handleDeploy}
                  loading={deploying}
                  disabled={!canDeploy || deploying}
                >
                  Deploy your coin
                </Button>
                {deployBlockReason() && (
                  <span className="text-xs text-fg-subtle">{deployBlockReason()}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Live preview column */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <LivePreview
            name={name}
            symbol={symbol}
            description={description}
            accent={accent}
            logoURI={logoURI}
            perks={perks}
          />
        </div>
      </div>
    </Container>
  )
}

/* ---------------- Stepper ---------------- */

function Stepper({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const done = i < step
        const current = i === step
        const Icon = s.icon
        return (
          <div key={s.label} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              onClick={() => onJump(i)}
              className="group flex min-w-0 flex-col items-start gap-1.5 text-left"
            >
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition',
                  done && 'border-accent bg-accent text-accent-fg',
                  current && 'border-accent text-accent ring-4 ring-accent-soft',
                  !done && !current && 'border-border bg-surface-2 text-fg-subtle',
                )}
              >
                {done ? <Check size={14} /> : <Icon size={14} />}
              </span>
              <span
                className={cn(
                  'truncate text-xs font-medium transition',
                  current ? 'text-fg' : 'text-fg-subtle',
                )}
              >
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  'mx-2 mb-5 h-px flex-1 transition',
                  i < step ? 'bg-accent' : 'bg-border',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ---------------- Step 0: Identity ---------------- */

function StepIdentity({
  name,
  setName,
  symbol,
  setSymbol,
  description,
  setDescription,
  accent,
  setAccent,
  logoURI,
  setLogoURI,
}: {
  name: string
  setName: (v: string) => void
  symbol: string
  setSymbol: (v: string) => void
  description: string
  setDescription: (v: string) => void
  accent: string
  setAccent: (v: string) => void
  logoURI: string
  setLogoURI: (v: string) => void
}) {
  return (
    <section className="space-y-5">
      <StepHeading title="Identity" hint="The name, ticker, and look of your coin." />

      <Field label="Name">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Vibe"
          maxLength={48}
        />
      </Field>

      <Field
        label="Symbol"
        hint="Letters and numbers only, up to 11 characters."
      >
        <div className="flex items-center gap-3">
          <Input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="VIBE"
            className="uppercase"
          />
          <span className="shrink-0 font-mono text-sm font-semibold text-fg-muted">
            ${symbol || 'SYMBOL'}
          </span>
        </div>
      </Field>

      <Field label="Description" hint="One line your fans will see on your coin page.">
        <Textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Music + community. Hold the coin to get into the inner circle."
        />
      </Field>

      <Field label="Accent color">
        <div className="flex flex-wrap gap-2">
          {ACCENT_PRESETS.map((hex) => {
            const selected = hex.toLowerCase() === accent.toLowerCase()
            return (
              <button
                key={hex}
                type="button"
                aria-label={`Accent ${hex}`}
                aria-pressed={selected}
                onClick={() => setAccent(hex)}
                className={cn(
                  'h-8 w-8 rounded-full border border-black/10 transition',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                  selected ? 'ring-2 ring-fg ring-offset-2 ring-offset-bg' : 'hover:scale-110',
                )}
                style={{ background: hex }}
              />
            )
          })}
        </div>
      </Field>

      <Field label="Logo URL" hint="Optional. A square image works best.">
        <Input
          value={logoURI}
          onChange={(e) => setLogoURI(e.target.value)}
          placeholder="https://…/logo.png"
        />
      </Field>
    </section>
  )
}

/* ---------------- Step 1: Treasury & cap ---------------- */

function StepTreasury({
  treasury,
  setTreasury,
  placeholder,
  noCap,
  setNoCap,
  capStr,
  setCapStr,
}: {
  treasury: string
  setTreasury: (v: string) => void
  placeholder?: string
  noCap: boolean
  setNoCap: (v: boolean) => void
  capStr: string
  setCapStr: (v: string) => void
}) {
  return (
    <section className="space-y-5">
      <StepHeading
        title="Treasury & cap"
        hint="Where your earnings go, and how much fans can deposit."
      />

      <Field
        label="Treasury address"
        hint="Where your harvested yield goes. Defaults to your wallet."
      >
        <Input
          value={treasury}
          onChange={(e) => setTreasury(e.target.value)}
          placeholder={placeholder ?? '0x…'}
          spellCheck={false}
          className="font-mono text-sm"
        />
      </Field>

      <Field label="Deposit cap">
        <Card inset className="overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div>
              <div className="text-sm font-medium text-fg">No cap</div>
              <div className="text-xs text-fg-subtle">
                Let fans deposit any amount.
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={noCap}
              onClick={() => setNoCap(!noCap)}
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                noCap ? 'bg-accent' : 'bg-surface-3',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-fg-inverted shadow transition',
                  noCap ? 'left-[22px]' : 'left-0.5',
                )}
              />
            </button>
          </div>

          {!noCap && (
            <div className="space-y-3 border-t border-border p-4">
              <AmountInput
                value={capStr}
                onValueChange={setCapStr}
                suffix="USDC"
                balanceLabel="Max total USDC fans can deposit. Raise anytime."
              />
              <div className="flex flex-wrap gap-2">
                {CAP_CHIPS.map((c) => (
                  <Button
                    key={c.value}
                    variant="secondary"
                    size="sm"
                    onClick={() => setCapStr(c.value)}
                  >
                    {c.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </Card>
      </Field>
    </section>
  )
}

/* ---------------- Step 3: Review ---------------- */

function StepReview({
  name,
  symbol,
  description,
  accent,
  logoURI,
  treasury,
  noCap,
  capStr,
  perksCount,
}: {
  name: string
  symbol: string
  description: string
  accent: string
  logoURI: string
  treasury: string
  noCap: boolean
  capStr: string
  perksCount: number
}) {
  const capText = noCap
    ? 'No cap'
    : capStr && toUnits(capStr)
      ? `${fmtUnits(toUnits(capStr)!, { max: 0 })} USDC`
      : 'Not set'

  const deploys = [
    'Vault + coin contract',
    'Auto-wired to aUSDC so deposits start working',
    'Brand profile, accent, and perks',
  ]

  return (
    <section className="space-y-5">
      <StepHeading
        title="Review & deploy"
        hint="One transaction creates everything. You can edit perks and the cap later."
      />

      <Card className="space-y-4">
        <div className="flex items-center gap-4">
          <BrandMark
            name={name}
            symbol={symbol}
            logoUrl={logoURI || undefined}
            color={accent}
            size="lg"
          />
          <div className="min-w-0">
            <div className="truncate font-display text-lg font-bold text-fg">
              {name || 'Your coin'}
            </div>
            <div className="font-mono text-sm text-fg-muted">
              ${symbol || 'SYMBOL'}
            </div>
          </div>
        </div>

        {description && (
          <p className="text-sm text-fg-muted">{description}</p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <ReviewRow label="Treasury">
            {treasury ? (
              <AddressChip address={treasury} explorer={false} />
            ) : (
              <span className="text-fg-subtle">Your wallet</span>
            )}
          </ReviewRow>
          <ReviewRow label="Deposit cap">
            <span className="tnum text-fg">{capText}</span>
          </ReviewRow>
          <ReviewRow label="Perks">
            <span className="text-fg">
              {perksCount} {perksCount === 1 ? 'perk' : 'perks'}
            </span>
          </ReviewRow>
          <ReviewRow label="Peg">
            <Badge tone="usdc">1 USDC = 1 ${symbol || 'coin'}</Badge>
          </ReviewRow>
        </div>
      </Card>

      <Card inset className="p-4">
        <div className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-fg-subtle">
          What gets deployed
        </div>
        <ul className="space-y-2">
          {deploys.map((d) => (
            <li key={d} className="flex items-start gap-2 text-sm text-fg-muted">
              <Check size={16} className="mt-0.5 shrink-0 text-success" />
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  )
}

function ReviewRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3">
      <div className="mb-1.5 text-xs font-medium uppercase tracking-[0.08em] text-fg-subtle">
        {label}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  )
}

/* ---------------- Live preview ---------------- */

function LivePreview({
  name,
  symbol,
  description,
  accent,
  logoURI,
  perks,
}: {
  name: string
  symbol: string
  description: string
  accent: string
  logoURI: string
  perks: Benefit[]
}) {
  const ticker = `$${symbol || 'SYMBOL'}`
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-fg-subtle">
          Live preview
        </span>
        <Badge tone="neutral">Fan view</Badge>
      </div>

      <div className="dark" style={brandStyle(accent)}>
        <Card glow className="space-y-5 bg-surface text-fg">
          <div className="flex items-center gap-3">
            <BrandMark
              name={name}
              symbol={symbol}
              logoUrl={logoURI || undefined}
              color={accent}
              size="lg"
            />
            <div className="min-w-0">
              <div className="truncate font-display text-lg font-bold text-fg">
                {name || 'Your coin'}
              </div>
              <div className="font-mono text-sm text-accent">{ticker}</div>
            </div>
          </div>

          <p className="min-h-[2.5rem] text-sm text-fg-muted">
            {description || 'Your one-line pitch shows up here for fans.'}
          </p>

          <Button variant="primary" fullWidth disabled>
            Mint {ticker}
          </Button>

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-fg-subtle">
              {perks.length} {perks.length === 1 ? 'perk' : 'perks'}
            </div>
            {perks.length === 0 ? (
              <p className="text-sm text-fg-subtle">
                Add perks to show what holders unlock.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {perks.map((p, i) => (
                  <span
                    key={i}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-pill border border-border bg-surface-2 px-2.5 py-1 text-xs text-fg-muted"
                  >
                    {p.emoji && <span>{p.emoji}</span>}
                    <span className="truncate">{p.title || 'Untitled perk'}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      <p className="px-1 text-center text-xs text-fg-subtle">
        This is how your coin page will look.{' '}
        <Link href="/#brands" className="text-accent hover:underline">
          See live coins
        </Link>
      </p>
    </div>
  )
}

/* ---------------- Shared bits ---------------- */

function StepHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="space-y-1">
      <h2 className="font-display text-xl font-bold text-fg">{title}</h2>
      <p className="text-sm text-fg-muted">{hint}</p>
    </div>
  )
}

function Notice({
  tone,
  icon,
  children,
}: {
  tone: 'warning' | 'info'
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border p-3 text-sm',
        tone === 'warning'
          ? 'border-warning/30 bg-warning-soft text-fg-muted'
          : 'border-border bg-surface-2 text-fg-muted',
      )}
    >
      <span
        className={cn(
          'mt-0.5 shrink-0',
          tone === 'warning' ? 'text-warning' : 'text-info',
        )}
      >
        {icon}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  )
}
