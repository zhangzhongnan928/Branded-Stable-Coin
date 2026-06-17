/** Public runtime config. All values are NEXT_PUBLIC_* (safe to expose). */

const ZERO = '0x0000000000000000000000000000000000000000' as const

export const env = {
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 84532),
  // Factory is set after deploy. Empty => the app shows a "not configured" state.
  factoryAddress: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? '') as `0x${string}` | '',
  // Verified Base Sepolia test USDC (Aave market). Override via env if needed.
  usdcAddress: (process.env.NEXT_PUBLIC_USDC_ADDRESS ??
    '0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f') as `0x${string}`,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? 'https://sepolia.base.org',
} as const

export const isFactoryConfigured = !!env.factoryAddress && env.factoryAddress !== ZERO

/** Aave faucet for the exact test USDC this market accepts. */
export const FAUCET_URL = 'https://app.aave.com/faucet/?marketName=proto_base_sepolia_v3'
export const GAS_FAUCET_URL = 'https://portal.cdp.coinbase.com/products/faucet'
