'use client'

import { useReadContract } from 'wagmi'
import { env, isFactoryConfigured } from './env'
import { factoryAbi, vaultAbi, erc20Abi } from './abis'
import type { BrandInfo } from './types'

const FACTORY = env.factoryAddress as `0x${string}`

/** All brands from the factory. */
export function useBrands() {
  const q = useReadContract({
    address: isFactoryConfigured ? FACTORY : undefined,
    abi: factoryAbi,
    functionName: 'getBrands',
    query: { enabled: isFactoryConfigured },
  })
  return {
    brands: ((q.data as readonly BrandInfo[] | undefined) ?? []) as BrandInfo[],
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: q.refetch,
  }
}

/** Live TVL (totalPrincipal) for one vault. */
export function useTvl(vault?: `0x${string}`) {
  const q = useReadContract({ address: vault, abi: vaultAbi, functionName: 'totalPrincipal', query: { enabled: !!vault } })
  return { tvl: q.data as bigint | undefined, isLoading: q.isLoading, refetch: q.refetch }
}

export interface BrandProfile {
  name: string
  symbol: string
  token: `0x${string}`
  treasury: `0x${string}`
  cap: bigint
  totalPrincipal: bigint
  logoURI: string
  description: string
  benefitsURI: string
  metadataURI: string
}

/** Full profile + status for a brand vault. */
export function useBrand(vault?: `0x${string}`) {
  const profile = useReadContract({ address: vault, abi: vaultAbi, functionName: 'profile', query: { enabled: !!vault } })
  const paused = useReadContract({ address: vault, abi: vaultAbi, functionName: 'paused', query: { enabled: !!vault } })
  const owner = useReadContract({ address: vault, abi: vaultAbi, functionName: 'brandOwner', query: { enabled: !!vault } })
  const solvent = useReadContract({ address: vault, abi: vaultAbi, functionName: 'isSolvent', query: { enabled: !!vault } })

  const raw = profile.data as
    | readonly [string, string, `0x${string}`, `0x${string}`, bigint, bigint, string, string, string, string]
    | undefined

  const parsed: BrandProfile | undefined = raw
    ? {
        name: raw[0],
        symbol: raw[1],
        token: raw[2],
        treasury: raw[3],
        cap: raw[4],
        totalPrincipal: raw[5],
        logoURI: raw[6],
        description: raw[7],
        benefitsURI: raw[8],
        metadataURI: raw[9],
      }
    : undefined

  return {
    profile: parsed,
    paused: paused.data as boolean | undefined,
    owner: owner.data as `0x${string}` | undefined,
    isSolvent: (solvent.data as boolean | undefined) ?? true,
    isLoading: profile.isLoading,
    isError: profile.isError,
    refetch: () => {
      profile.refetch()
      paused.refetch()
      solvent.refetch()
    },
  }
}

/** Creator-only: yield available to harvest. */
export function useAvailableYield(vault?: `0x${string}`) {
  const q = useReadContract({ address: vault, abi: vaultAbi, functionName: 'availableYield', query: { enabled: !!vault } })
  return { yield: q.data as bigint | undefined, isLoading: q.isLoading, refetch: q.refetch }
}

/** ERC-20 balanceOf for an account (token or USDC). */
export function useErc20Balance(token?: `0x${string}`, account?: `0x${string}`) {
  const q = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: account ? [account] : undefined,
    query: { enabled: !!token && !!account },
  })
  return { balance: q.data as bigint | undefined, isLoading: q.isLoading, refetch: q.refetch }
}

/** ERC-20 allowance(owner -> spender). */
export function useAllowance(token?: `0x${string}`, owner?: `0x${string}`, spender?: `0x${string}`) {
  const q = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: { enabled: !!token && !!owner && !!spender },
  })
  return { allowance: (q.data as bigint | undefined) ?? 0n, refetch: q.refetch }
}

export const USDC = env.usdcAddress as `0x${string}`
