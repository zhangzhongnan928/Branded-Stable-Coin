'use client'
import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { vaultAbi } from '@/lib/abis'
import { env } from '@/lib/env'

export function SetAToken({ vault }: { vault: `0x${string}` }) {
  const [addr, setAddr] = useState(env.aUsdcAddress || '')
  const { data: hash, isPending, writeContract } = useWriteContract()
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash })
  const run = () => writeContract({ abi: vaultAbi, address: vault, functionName: 'setAToken', args: [addr as `0x${string}`], chainId: baseSepolia.id })
  return (
    <div className="border rounded p-3 text-sm space-y-2">
      <div className="font-medium">Set aUSDC</div>
      <div className="flex gap-2 items-center">
        <input className="border rounded px-2 py-1 w-[420px]" placeholder="aUSDC address" value={addr} onChange={e=>setAddr(e.target.value)} />
        <button className="px-3 py-1.5 border rounded" onClick={run} disabled={isPending || isLoading}>
          {isPending ? 'Submitting...' : isLoading ? 'Confirming...' : 'Set aToken'}
        </button>
      </div>
      {isSuccess && <div className="text-xs text-green-600">aToken set.</div>}
    </div>
  )
}


