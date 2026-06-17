'use client'

import { useCallback } from 'react'
import { usePublicClient } from 'wagmi'
import { useToast } from '@/components/ui/Toast'
import { humanizeError } from './errors'

/**
 * Drives a write transaction through the trust-building toast lifecycle:
 * confirm-in-wallet -> pending (with explorer link) -> success / error.
 * `send` should submit the tx and resolve to its hash (e.g. writeContractAsync).
 */
export function useTx() {
  const toast = useToast()
  const publicClient = usePublicClient()

  return useCallback(
    async (
      labels: { pending: string; success: string },
      send: () => Promise<`0x${string}`>,
    ): Promise<`0x${string}` | undefined> => {
      const id = toast.push({ status: 'pending', title: 'Confirm in your wallet', description: labels.pending })
      try {
        const hash = await send()
        toast.update(id, { status: 'pending', title: labels.pending, description: 'Waiting for confirmation…', txHash: hash })
        const receipt = await publicClient!.waitForTransactionReceipt({ hash })
        if (receipt.status === 'reverted') throw new Error('Transaction reverted on-chain')
        toast.update(id, { status: 'success', title: labels.success, txHash: hash, description: undefined })
        return hash
      } catch (e) {
        toast.update(id, { status: 'error', title: 'Transaction failed', description: humanizeError(e), txHash: undefined, sticky: true })
        return undefined
      }
    },
    [toast, publicClient],
  )
}
