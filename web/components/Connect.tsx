'use client'
import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

export function Connect() {
  const { address, isConnected } = useAccount()
  const { connectors, connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm">{address}</span>
        <button className="px-2 py-1 border rounded" onClick={() => disconnect()}>Disconnect</button>
      </div>
    )
  }
  return (
    <div className="flex gap-2 flex-wrap">
      {connectors.map((c) => (
        <button key={c.uid} className="px-2 py-1 border rounded" onClick={() => connect({ connector: c })} disabled={isPending}>
          Connect {c.name}
        </button>
      ))}
    </div>
  )
}


