'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useSwitchChain } from 'wagmi'
import { maxUint256, formatUnits } from 'viem'
import { vaultAbi, erc20Abi } from '@/lib/abis'
import { USDC, useErc20Balance, useAllowance } from '@/lib/hooks'
import { toUnits, fmtUnits } from '@/lib/format'
import { useTx } from '@/lib/useTx'
import { CHAIN } from '@/lib/chain'
import { Card } from './ui/Card'
import { Tabs } from './ui/Tabs'
import { AmountInput } from './ui/Input'
import { Button } from './ui/Button'
import { ConnectButton } from './ui/ConnectButton'

export function MintRedeemCard({
  vault,
  token,
  symbol,
  paused,
  onChanged,
}: {
  vault: `0x${string}`
  token: `0x${string}`
  symbol: string
  paused?: boolean
  onChanged?: () => void
}) {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const { writeContractAsync } = useWriteContract()
  const runTx = useTx()

  const [tab, setTab] = useState<'mint' | 'redeem'>('mint')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)

  const { balance: usdcBal, refetch: refetchUsdc } = useErc20Balance(USDC, address)
  const { balance: tokenBal, refetch: refetchToken } = useErc20Balance(token, address)
  const { allowance, refetch: refetchAllowance } = useAllowance(USDC, address, vault)

  const isMint = tab === 'mint'
  const units = toUnits(amount)
  const max = isMint ? usdcBal : tokenBal
  const overBalance = units !== undefined && max !== undefined && units > max
  const valid = units !== undefined && units > 0n && !overBalance
  const wrongChain = isConnected && chainId !== CHAIN.id

  const refetchAll = () => {
    refetchUsdc()
    refetchToken()
    refetchAllowance()
    onChanged?.()
  }

  const onMint = async () => {
    if (!units) return
    setBusy(true)
    try {
      if (allowance < units) {
        const ok = await runTx({ pending: 'Approving USDC…', success: 'USDC approved' }, () =>
          writeContractAsync({ address: USDC, abi: erc20Abi, functionName: 'approve', args: [vault, maxUint256] }),
        )
        if (!ok) return
        await refetchAllowance()
      }
      const ok = await runTx({ pending: `Minting $${symbol}…`, success: `You minted $${symbol}` }, () =>
        writeContractAsync({ address: vault, abi: vaultAbi, functionName: 'deposit', args: [units] }),
      )
      if (ok) {
        setAmount('')
        refetchAll()
      }
    } finally {
      setBusy(false)
    }
  }

  const onRedeem = async () => {
    if (!units) return
    setBusy(true)
    try {
      const ok = await runTx({ pending: 'Redeeming…', success: 'Redeemed for USDC' }, () =>
        writeContractAsync({ address: vault, abi: vaultAbi, functionName: 'redeem', args: [units] }),
      )
      if (ok) {
        setAmount('')
        refetchAll()
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card glow className="shadow-lg">
      <Tabs
        className="w-full"
        tabs={[
          { value: 'mint', label: 'Mint' },
          { value: 'redeem', label: 'Redeem' },
        ]}
        value={tab}
        onChange={(v) => {
          setTab(v)
          setAmount('')
        }}
      />
      <div className="mt-4 space-y-3">
        <AmountInput
          value={amount}
          onValueChange={setAmount}
          suffix={isMint ? 'USDC' : `$${symbol}`}
          onMax={max !== undefined ? () => setAmount(formatUnits(max, 6)) : undefined}
          balanceLabel={`Balance: ${fmtUnits(max)} ${isMint ? 'USDC' : `$${symbol}`}`}
        />
        <div className="text-sm text-fg-muted">
          You&apos;ll receive{' '}
          <span className="font-semibold text-fg">
            {amount || '0'} {isMint ? `$${symbol}` : 'USDC'}
          </span>{' '}
          · 1 USDC = 1 ${symbol}
        </div>

        {!isConnected ? (
          <ConnectButton size="lg" />
        ) : wrongChain ? (
          <Button size="lg" fullWidth variant="outline" onClick={() => switchChain({ chainId: CHAIN.id })}>
            Switch to Base Sepolia
          </Button>
        ) : isMint ? (
          <Button size="lg" fullWidth loading={busy} disabled={!valid || paused} onClick={onMint}>
            {paused ? 'Minting paused' : overBalance ? 'Insufficient USDC' : `Mint $${symbol}`}
          </Button>
        ) : (
          <Button size="lg" fullWidth variant="secondary" loading={busy} disabled={!valid} onClick={onRedeem}>
            {overBalance ? `Not enough $${symbol}` : 'Redeem for USDC'}
          </Button>
        )}

        <p className="text-center text-xs text-fg-subtle">
          Redeem 1:1 for USDC anytime. Your principal is always yours.
        </p>
      </div>
    </Card>
  )
}
