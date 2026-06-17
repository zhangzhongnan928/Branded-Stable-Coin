'use client'

import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { Button } from './Button'
import { AddressChip } from './AddressChip'
import { CHAIN } from '@/lib/chain'

export function ConnectButton({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { address, isConnected, chainId } = useAccount()
  const { connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()

  if (!mounted) {
    return (
      <Button variant="primary" size={size} disabled>
        Connect wallet
      </Button>
    )
  }

  if (!isConnected) {
    return (
      <Button variant="primary" size={size} loading={isPending} onClick={() => connect({ connector: injected() })}>
        Connect wallet
      </Button>
    )
  }

  if (chainId !== CHAIN.id) {
    return (
      <Button variant="outline" size={size} onClick={() => switchChain({ chainId: CHAIN.id })}>
        Switch to Base Sepolia
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <AddressChip address={address!} explorer={false} />
      <Button variant="ghost" size={size} onClick={() => disconnect()}>
        Disconnect
      </Button>
    </div>
  )
}
