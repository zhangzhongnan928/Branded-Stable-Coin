'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Rocket, CheckCircle2, ExternalLink } from 'lucide-react'
import { useAccount, useDeployContract, usePublicClient, useSwitchChain, useWriteContract } from 'wagmi'
import { factoryBytecode, factoryConstructorAbi } from '@/lib/factoryArtifact'
import { factoryAbi } from '@/lib/abis'
import { env } from '@/lib/env'
import { CHAIN, explorerAddress } from '@/lib/chain'
import { DEMO_BRANDS } from '@/lib/demo'
import { useTx } from '@/lib/useTx'
import { truncate } from '@/lib/format'
import { Container, Section, Eyebrow } from '@/components/ui/Layout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AddressChip } from '@/components/ui/AddressChip'
import { ConnectButton } from '@/components/ui/ConnectButton'

const AAVE_POOL = '0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27' as `0x${string}`

export default function DeployPage() {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const { deployContractAsync } = useDeployContract()
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()
  const runTx = useTx()

  // Deploy card always deploys a NEW Factory; its "deployed" result only appears after the
  // user signs this session (never pre-filled from env). The seed step targets the freshly
  // deployed factory OR the one configured in env, so it still works after a page refresh.
  const [deployed, setDeployed] = useState<`0x${string}` | ''>('')
  const seedTarget = (deployed || env.factoryAddress) as `0x${string}` | ''
  const [deploying, setDeploying] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [seeded, setSeeded] = useState<string[]>([])

  const wrongChain = isConnected && chainId !== CHAIN.id

  const onDeploy = async () => {
    if (!address) return
    setDeploying(true)
    try {
      const hash = await runTx({ pending: 'Deploying Factory…', success: 'Factory deployed' }, () =>
        deployContractAsync({ abi: factoryConstructorAbi, bytecode: factoryBytecode, args: [env.usdcAddress, AAVE_POOL, address] }),
      )
      if (hash) {
        const receipt = await publicClient!.getTransactionReceipt({ hash })
        if (receipt.contractAddress) setDeployed(receipt.contractAddress)
      }
    } finally {
      setDeploying(false)
    }
  }

  const onSeed = async () => {
    if (!seedTarget || !address) return
    const owner = address
    const factoryAddr = seedTarget
    setSeeding(true)
    try {
      for (const b of DEMO_BRANDS) {
        if (seeded.includes(b.symbol)) continue
        const benefitsURI = JSON.stringify({
          version: 1, brand: b.brand, symbol: b.symbol, description: b.description, accent: b.accent, benefits: b.benefits,
        })
        const ok = await runTx({ pending: `Creating ${b.brand}…`, success: `${b.brand} created` }, () =>
          writeContractAsync({
            address: factoryAddr,
            abi: factoryAbi,
            functionName: 'createBrandWithProfile',
            args: [b.brand, b.symbol, owner, 0n, '', b.description ?? '', benefitsURI],
          }),
        )
        if (ok) setSeeded((s) => [...s, b.symbol])
      }
    } finally {
      setSeeding(false)
    }
  }

  return (
    <Container className="max-w-prose-tight py-12">
      <Eyebrow>One-time setup</Eyebrow>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Deploy Minted</h1>
      <p className="mt-2 text-fg-muted">
        Deploy the Factory and seed demo brands on Base Sepolia — signed with your own wallet. No private keys leave
        your browser.
      </p>

      {/* Step 1 — connect */}
      {!isConnected ? (
        <Card className="mt-8">
          <h2 className="font-display text-lg font-semibold">1. Connect your wallet</h2>
          <p className="mt-1 text-sm text-fg-muted">Use the wallet you want to be the protocol admin + brand owner.</p>
          <div className="mt-4">
            <ConnectButton size="lg" />
          </div>
        </Card>
      ) : wrongChain ? (
        <Card className="mt-8">
          <h2 className="font-display text-lg font-semibold">Switch network</h2>
          <p className="mt-1 text-sm text-fg-muted">This deploys to Base Sepolia.</p>
          <div className="mt-4">
            <Button size="lg" variant="outline" onClick={() => switchChain({ chainId: CHAIN.id })}>
              Switch to Base Sepolia
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Step 2 — deploy factory */}
          <Card className="mt-8" glow>
            <h2 className="font-display text-lg font-semibold">1. Deploy the Factory</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-fg-muted">USDC</dt>
                <dd><AddressChip address={env.usdcAddress} /></dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-fg-muted">Aave V3 Pool</dt>
                <dd><AddressChip address={AAVE_POOL} /></dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-fg-muted">Admin / fee recipient</dt>
                <dd><AddressChip address={address!} explorer={false} /></dd>
              </div>
            </dl>
            <div className="mt-5">
              <Button size="lg" fullWidth loading={deploying} leftIcon={<Rocket className="h-4 w-4" />} onClick={onDeploy}>
                {deployed ? 'Re-deploy Factory' : 'Deploy Factory'}
              </Button>
            </div>
          </Card>

          {/* Result */}
          {deployed && (
            <Card className="mt-6 border-success/40">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                <h2 className="font-display text-lg font-semibold">Factory deployed</h2>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <AddressChip address={deployed} />
                <a
                  href={explorerAddress(deployed)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
                >
                  BaseScan <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="mt-4 text-sm text-fg-muted">
                Set this in <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs">web/.env.local</code>:
              </p>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-surface-2 p-3 font-mono text-xs">
                NEXT_PUBLIC_FACTORY_ADDRESS={deployed}
              </pre>
            </Card>
          )}

          {/* Step 3 — seed */}
          <Card className="mt-6">
            <h2 className="font-display text-lg font-semibold">2. Seed demo brands (optional)</h2>
            <p className="mt-1 text-sm text-fg-muted">
              Creates {DEMO_BRANDS.length} example coins with full perks so the explore page isn&apos;t empty. One signature each.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DEMO_BRANDS.map((b) => (
                <Badge key={b.symbol} tone={seeded.includes(b.symbol) ? 'success' : 'neutral'} dot>
                  {b.brand}
                </Badge>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="secondary" loading={seeding} disabled={!seedTarget} onClick={onSeed}>
                {seeded.length === DEMO_BRANDS.length ? 'Re-seed' : `Create ${DEMO_BRANDS.length} demo brands`}
              </Button>
              {seeded.length > 0 && (
                <Link href="/">
                  <Button variant="ghost">View on Explore →</Button>
                </Link>
              )}
            </div>
            {!seedTarget && <p className="mt-2 text-xs text-fg-subtle">Deploy or configure a Factory first.</p>}
          </Card>

          <Section className="!py-8">
            <p className="text-center text-xs text-fg-subtle">
              Send the Factory address to wire it into the deployed site, or set it locally and restart.
            </p>
          </Section>
        </>
      )}
    </Container>
  )
}
