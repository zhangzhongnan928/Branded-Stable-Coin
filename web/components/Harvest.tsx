'use client'
import { useEffect, useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { vaultAbi } from '@/lib/abis'
import { createPublicClient, http, formatUnits } from 'viem'

export function Harvest({ vault }: { vault: `0x${string}` }) {
  const { data: hash, isPending, writeContract } = useWriteContract()
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash })
  const [avail, setAvail] = useState<bigint | null>(null)
  const [principal, setPrincipal] = useState<bigint | null>(null)
  useEffect(() => {
    let alive = true
    const client = createPublicClient({ chain: baseSepolia, transport: http() })
    const poll = async () => {
      try {
        const [v, p] = await Promise.all([
          client.readContract({ address: vault, abi: vaultAbi, functionName: 'availableYield' }) as Promise<bigint>,
          client.readContract({ address: vault, abi: vaultAbi, functionName: 'totalPrincipal' }) as Promise<bigint>,
        ])
        if (alive) { setAvail(v); setPrincipal(p) }
      } catch {}
    }
    poll()
    const id = setInterval(poll, 8000)
    return () => { alive = false; clearInterval(id) }
  }, [vault, isSuccess])
  const run = () => writeContract({ abi: vaultAbi, address: vault, functionName: 'harvestYield', args: [], chainId: baseSepolia.id })
  const disabled = isPending || isLoading || (avail !== null && avail === 0n)
  return (
    <div className="border rounded p-3 text-sm space-y-1">
      <div className="text-xs text-gray-600">Available Yield: {avail === null ? '...' : `${formatUnits(avail, 6)} USDC`}</div>
      <div className="text-xs text-gray-600">Principal: {principal === null ? '...' : `${formatUnits(principal, 6)} USDC`}</div>
      <button className="px-3 py-1.5 border rounded" onClick={run} disabled={disabled}>
        {isPending ? 'Submitting...' : isLoading ? 'Confirming...' : 'Harvest Yield'}
      </button>
      {avail === 0n && <div className="text-xs text-gray-500">No yield yet. Ensure aToken is set and wait</div>}
      {isSuccess && <div className="text-xs text-green-600 mt-1">Harvested.</div>}
    </div>
  )
}


