'use client'
import { useState } from 'react'
import { baseSepolia } from 'wagmi/chains'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { factoryAbi } from '@/lib/abis'
import { env } from '@/lib/env'

export function BrandCreator({ onCreated }: { onCreated?: () => void }) {
  const { isConnected } = useAccount()
  const [name, setName] = useState('ACMEUSD')
  const [symbol, setSymbol] = useState('ACMEUSD')
  const [treasury, setTreasury] = useState('')
  const [cap, setCap] = useState<string>('0') // human units, e.g. "1000.5"
  const { data: hash, isPending, writeContract } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  const toUnits6 = (v: string): bigint => {
    const s = (v || '').trim()
    if (!s) return 0n
    const neg = s.startsWith('-')
    const [i0, f0 = ''] = (neg ? s.slice(1) : s).split('.')
    const i = i0.replace(/\D/g, '') || '0'
    const fRaw = f0.replace(/\D/g, '')
    const f = (fRaw + '000000').slice(0, 6)
    const val = BigInt(i) * 1_000_000n + BigInt(f || '0')
    return neg ? -val : val
  }

  const submit = async () => {
    if (!env.factoryAddress) return
    const capUnits = toUnits6(cap)
    writeContract({
      abi: factoryAbi,
      address: env.factoryAddress,
      functionName: 'createBrand',
      args: [name, symbol, treasury as `0x${string}`, capUnits],
      chainId: baseSepolia.id,
    })
  }

  return (
    <div className="border rounded p-4 space-y-2">
      <div className="font-medium">Create Brand</div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="flex flex-col">Name<input className="border rounded px-2 py-1" value={name} onChange={e=>setName(e.target.value)} /></label>
        <label className="flex flex-col">Symbol<input className="border rounded px-2 py-1" value={symbol} onChange={e=>setSymbol(e.target.value)} /></label>
        <label className="flex flex-col">Treasury<input className="border rounded px-2 py-1" placeholder="0x..." value={treasury} onChange={e=>setTreasury(e.target.value)} /></label>
        <label className="flex flex-col">Cap (USDC)<input className="border rounded px-2 py-1" value={cap} onChange={e=>setCap(e.target.value)} /></label>
      </div>
      <button className="px-3 py-1.5 border rounded" onClick={submit} disabled={!isConnected || isPending || isConfirming}>
        {isPending ? 'Submitting...' : isConfirming ? 'Confirming...' : 'Create'}
      </button>
      {isConfirmed && <div className="text-xs text-green-600">Brand created.</div>}
    </div>
  )
}


