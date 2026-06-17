import { baseSepolia } from 'wagmi/chains'

export const CHAIN = baseSepolia
export const EXPLORER = 'https://sepolia.basescan.org'

export const explorerAddress = (addr: string) => `${EXPLORER}/address/${addr}`
export const explorerTx = (hash: string) => `${EXPLORER}/tx/${hash}`
