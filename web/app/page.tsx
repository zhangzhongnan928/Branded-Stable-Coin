'use client'

import { useEffect, useMemo, useState } from 'react'
import { createConfig, http, WagmiProvider } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { baseSepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createPublicClient, formatUnits, parseUnits } from 'viem'
import { Connect } from '@/components/Connect'
import { env } from '@/lib/env'
import { factoryAbi } from '@/lib/abis'
import { BrandCreator } from '@/components/BrandCreator'
import { UserActions } from '@/components/UserActions'
import { Harvest } from '@/components/Harvest'
import { CapForm } from '@/components/CapForm'
import { SetAToken } from '@/components/SetAToken'

const queryClient = new QueryClient()

const config = createConfig({
  chains: [baseSepolia],
  transports: { [baseSepolia.id]: http(env.rpcUrl) },
  connectors: [injected()],
  ssr: true,
  autoConnect: true,
})

export default function Page() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>
    </WagmiProvider>
  )
}

function Home() {
  const [status, setStatus] = useState('ready')
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Branded Stablecoin</h1>
      <p className="text-sm text-gray-600">1:1 mint/redeem backed by USDC. No APY displayed.</p>
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">Chain: Sepolia/Mainnet</div>
        <Connect />
      </div>
      <div className="rounded border p-4">
        <div className="text-sm">Status: {status}</div>
      </div>
      <BrandCreator />
      <Brands />
    </main>
  )
}

function Brands() {
  const [items, setItems] = useState<any[]>([])
  useEffect(() => {
    const f = async () => {
      if (!env.factoryAddress) return
      const client = createPublicClient({ chain: baseSepolia, transport: http(env.rpcUrl) })
      const brands = await client.readContract({ address: env.factoryAddress, abi: factoryAbi, functionName: 'getBrands' })
      setItems(brands as any[])
    }
    f().catch(console.error)
  }, [])
  return (
    <div className="space-y-2">
      <h2 className="font-medium">Brands</h2>
      {items.length === 0 ? <div className="text-sm text-gray-500">No brands yet.</div> : (
        <div className="grid grid-cols-1 gap-2">
          {items.map((b: any, i: number) => {
            const vault = b.vault as `0x${string}`
            return (
              <div key={i} className="border rounded p-3 text-sm space-y-2">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold">{b.name} ({b.symbol})</div>
                    <div className="text-gray-500">Vault: {b.vault}</div>
                    <div className="text-gray-500">Token: {b.token}</div>
                  </div>
                </div>
                <UserActions vault={vault} />
                <SetAToken vault={vault} />
                <CapForm vault={vault} />
                <Harvest vault={vault} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )}


