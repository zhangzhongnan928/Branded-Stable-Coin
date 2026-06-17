// Seed demo brands on Base Sepolia so the live demo isn't empty.
//
// Usage (from repo root):
//   PRIVATE_KEY=0x<deployer_key> FACTORY=0x<factory_addr> node web/scripts/seed.mjs
//
// Requires the web deps installed (viem). Treasury defaults to the deployer address.

import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'

const PRIVATE_KEY = process.env.PRIVATE_KEY
const FACTORY = process.env.FACTORY || process.env.NEXT_PUBLIC_FACTORY_ADDRESS
const RPC = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org'

if (!PRIVATE_KEY || !FACTORY) {
  console.error('Set PRIVATE_KEY and FACTORY (or NEXT_PUBLIC_FACTORY_ADDRESS).')
  process.exit(1)
}

const account = privateKeyToAccount(PRIVATE_KEY)
const wallet = createWalletClient({ account, chain: baseSepolia, transport: http(RPC) })
const pub = createPublicClient({ chain: baseSepolia, transport: http(RPC) })

const abi = [
  {
    type: 'function',
    name: 'createBrandWithProfile',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'treasury', type: 'address' },
      { name: 'cap', type: 'uint256' },
      { name: 'logoURI', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'benefitsURI', type: 'string' },
    ],
    outputs: [
      { name: 'vault', type: 'address' },
      { name: 'token', type: 'address' },
    ],
  },
]

const BRANDS = [
  {
    brand: 'Vibe', symbol: 'VIBE', accent: '#7C5CFF',
    description: 'Music + community by Vibe. Hold $VIBE to get into the inner circle.',
    benefits: [
      { id: 'inner-circle-discord', type: 'token_gate', title: 'Inner Circle Discord', summary: 'Hold 25+ $VIBE to unlock the private Discord with behind-the-scenes drops and direct Q&As.', minHold: 25, channel: 'Discord', badge: 'Members', emoji: '💬' },
      { id: 'merch-15-off', type: 'discount', title: '15% off all merch', summary: 'Get 15% off everything in the Vibe store, just for holding the coin.', minHold: 10, discountValue: { kind: 'percent', amount: 15 }, channel: 'Shopify', emoji: '🛍️' },
      { id: 'vinyl-drop', type: 'drop', title: 'Limited vinyl allowlist', summary: 'Top holders get an allowlist spot for the numbered first-press vinyl. 300 copies only.', minHold: 100, badge: 'Limited', emoji: '💿' },
      { id: 'front-row', type: 'event', title: 'Front-row + soundcheck', summary: 'Holders of 250+ $VIBE get front-row seats and soundcheck entry at 2026 tour stops.', minHold: 250, channel: 'IRL', badge: 'VIP', emoji: '🎟️' },
      { id: 'partner-coffee', type: 'partner_perk', title: 'Free drink at Day One Coffee', summary: 'Show your $VIBE balance for a free drink, once a week.', minHold: 5, channel: 'Partner', emoji: '☕' },
    ],
  },
  {
    brand: 'PixelForge', symbol: 'FORGE', accent: '#22C55E',
    description: 'Indie game studio. Hold $FORGE for playtest access, in-game cosmetics, and dev nights.',
    benefits: [
      { id: 'playtest', type: 'token_gate', title: 'Closed Playtest Access', summary: 'Hold 20+ $FORGE to join closed playtests before public launch.', minHold: 20, channel: 'Discord', emoji: '🎮' },
      { id: 'founder-skin', type: 'drop', title: 'Founder cosmetic skin', summary: 'An exclusive in-game skin airdropped to early holders.', minHold: 50, badge: 'Limited', emoji: '✨' },
      { id: 'dev-night', type: 'event', title: 'Monthly dev night', summary: 'Live monthly call with the dev team — roadmap, demos, AMA.', minHold: 10, channel: 'Discord', emoji: '🎤' },
      { id: 'steam', type: 'discount', title: '30% off Steam keys', summary: 'Member pricing on our catalog.', minHold: 5, discountValue: { kind: 'percent', amount: 30 }, channel: 'Store', emoji: '🏷️' },
    ],
  },
  {
    brand: 'Cloud9 Coffee', symbol: 'CUP', accent: '#D97706',
    description: 'A local roaster going on-chain. Hold $CUP for free drinks, beans, and member pricing.',
    benefits: [
      { id: 'free-drink', type: 'partner_perk', title: 'Free drink weekly', summary: 'Show your $CUP balance in-store for one free drink per week.', minHold: 5, channel: 'IRL', emoji: '☕' },
      { id: 'beans', type: 'discount', title: '20% off beans', summary: 'Member pricing on all whole-bean bags.', minHold: 15, discountValue: { kind: 'percent', amount: 20 }, channel: 'Online', emoji: '🫘' },
      { id: 'cupping', type: 'event', title: 'Cupping + roast tour', summary: 'Quarterly invite to a private cupping session and roastery tour.', minHold: 40, badge: 'VIP', emoji: '🔥' },
    ],
  },
]

for (const b of BRANDS) {
  const benefitsURI = JSON.stringify({ version: 1, brand: b.brand, symbol: b.symbol, description: b.description, accent: b.accent, benefits: b.benefits })
  console.log(`Creating ${b.brand} ($${b.symbol})…`)
  const hash = await wallet.writeContract({
    address: FACTORY,
    abi,
    functionName: 'createBrandWithProfile',
    args: [b.brand, b.symbol, account.address, 0n, '', b.description, benefitsURI],
  })
  const receipt = await pub.waitForTransactionReceipt({ hash })
  console.log(`  ${b.symbol} -> ${receipt.status} (${hash})`)
}
console.log('Seed complete.')
