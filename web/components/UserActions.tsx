'use client'
import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { erc20Abi, vaultAbi } from '@/lib/abis'
import { env } from '@/lib/env'

export function UserActions({ vault }: { vault: `0x${string}` }) {
  const { isConnected, address } = useAccount()
  const [amount, setAmount] = useState('')
  const { data: approveHash, isPending: isApproving, writeContract: writeApprove } = useWriteContract()
  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })
  const { data: actHash, isPending: isActPending, writeContract: writeAct } = useWriteContract()
  const { isLoading: isActLoading, isSuccess: isActSuccess } = useWaitForTransactionReceipt({ hash: actHash })

  const deposit = async () => {
    if (!env.usdcAddress) return
    const value = BigInt(amount) * 10n ** 6n
    writeApprove({ abi: erc20Abi, address: env.usdcAddress, functionName: 'approve', args: [vault, value], chainId: baseSepolia.id })
    writeAct({ abi: vaultAbi, address: vault, functionName: 'deposit', args: [value], chainId: baseSepolia.id })
  }
  const redeem = async () => {
    const value = BigInt(amount) * 10n ** 6n
    writeAct({ abi: vaultAbi, address: vault, functionName: 'redeem', args: [value], chainId: baseSepolia.id })
  }

  return (
    <div className="border rounded p-3 space-y-2 text-sm">
      <div className="font-medium">User Actions</div>
      <div className="flex gap-2 items-center">
        <input className="border rounded px-2 py-1 w-40" placeholder="Amount (USDC)" value={amount} onChange={e=>setAmount(e.target.value)} />
        <button className="px-3 py-1.5 border rounded" onClick={deposit} disabled={!isConnected || isApproving || isApproveLoading || isActPending || isActLoading}>Deposit + Mint</button>
        <button className="px-3 py-1.5 border rounded" onClick={redeem} disabled={!isConnected || isActPending || isActLoading}>Redeem</button>
      </div>
      {isApproveSuccess && <div className="text-xs text-green-600">Approved USDC.</div>}
      {isActSuccess && <div className="text-xs text-green-600">Transaction confirmed.</div>}
    </div>
  )
}


