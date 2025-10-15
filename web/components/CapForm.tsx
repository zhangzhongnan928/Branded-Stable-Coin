'use client'
import { useState } from 'react'
import { baseSepolia } from 'wagmi/chains'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { vaultAbi } from '@/lib/abis'

function toUnits6(v: string): bigint {
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

export function CapForm({ vault }: { vault: `0x${string}` }) {
  const [cap, setCap] = useState('0')
  const { data: hash, isPending, writeContract } = useWriteContract()
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash })
  const run = () => writeContract({ abi: vaultAbi, address: vault, functionName: 'setCap', args: [toUnits6(cap)], chainId: baseSepolia.id })
  return (
    <div className="border rounded p-3 text-sm space-y-2">
      <div className="font-medium">Set Cap</div>
      <div className="flex gap-2 items-center">
        <input className="border rounded px-2 py-1 w-40" placeholder="Cap (USDC)" value={cap} onChange={e=>setCap(e.target.value)} />
        <button className="px-3 py-1.5 border rounded" onClick={run} disabled={isPending || isLoading}>
          {isPending ? 'Submitting...' : isLoading ? 'Confirming...' : 'Update Cap'}
        </button>
      </div>
      {isSuccess && <div className="text-xs text-green-600">Cap updated.</div>}
    </div>
  )
}


