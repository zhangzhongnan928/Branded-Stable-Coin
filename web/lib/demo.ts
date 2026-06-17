import type { Benefit, BenefitsDoc } from './types'

/** One-click perk templates for the launch wizard + dashboard editor. */
export const PERK_TEMPLATES: { key: string; label: string; benefit: Omit<Benefit, 'id'> }[] = [
  {
    key: 'discord',
    label: 'Token-gated Discord',
    benefit: { type: 'token_gate', title: 'Inner Circle Discord', summary: 'Hold the coin to unlock a private Discord role.', channel: 'Discord', minHold: 10, emoji: '💬' },
  },
  {
    key: 'discount',
    label: '% discount',
    benefit: { type: 'discount', title: '15% off', summary: 'A standing discount for holders.', discountValue: { kind: 'percent', amount: 15 }, minHold: 5, emoji: '🏷️' },
  },
  {
    key: 'drop',
    label: 'Early drop',
    benefit: { type: 'drop', title: 'Early drop access', summary: 'Allowlist spot for the next drop.', minHold: 50, badge: 'Limited', emoji: '🎁' },
  },
  {
    key: 'event',
    label: 'IRL / VIP',
    benefit: { type: 'event', title: 'VIP access', summary: 'Holders get in. Front of the line.', channel: 'IRL', minHold: 100, badge: 'VIP', emoji: '🎟️' },
  },
  {
    key: 'partner',
    label: 'Partner perk',
    benefit: { type: 'partner_perk', title: 'Partner perk', summary: 'A perk from a partner brand.', channel: 'Partner', minHold: 5, emoji: '🤝' },
  },
]

/** Seed brands to pre-create on the live demo (and a local preview when no factory is set). */
export const DEMO_BRANDS: (BenefitsDoc & { cap: string })[] = [
  {
    version: 1,
    brand: 'Vibe',
    symbol: 'VIBE',
    description: 'Music + community by Vibe. Hold $VIBE to get into the inner circle.',
    accent: '#7C5CFF',
    cap: '0',
    benefits: [
      { id: 'inner-circle-discord', type: 'token_gate', title: 'Inner Circle Discord', summary: 'Hold 25+ $VIBE to unlock the private Discord with behind-the-scenes drops and direct Q&As.', minHold: 25, channel: 'Discord', url: 'https://discord.gg/vibe-inner-circle', badge: 'Members', emoji: '💬' },
      { id: 'merch-15-off', type: 'discount', title: '15% off all merch', summary: 'Get 15% off everything in the Vibe store, just for holding the coin.', minHold: 10, discountValue: { kind: 'percent', amount: 15, currency: 'USD' }, channel: 'Shopify', url: 'https://shop.vibe.xyz', emoji: '🛍️' },
      { id: 'vinyl-drop-2026', type: 'drop', title: 'Limited vinyl allowlist', summary: 'Top holders get an allowlist spot for the numbered first-press vinyl. 300 copies only.', minHold: 100, channel: 'Allowlist', url: 'https://vibe.xyz/drops/vinyl', validFrom: '2026-07-01T00:00:00Z', validTo: '2026-07-15T00:00:00Z', badge: 'Limited', emoji: '💿' },
      { id: 'front-row-tour', type: 'event', title: 'Front-row + soundcheck access', summary: 'Holders of 250+ $VIBE get front-row seats and soundcheck entry at any 2026 tour stop.', minHold: 250, channel: 'IRL', url: 'https://vibe.xyz/tour', validTo: '2026-12-31T00:00:00Z', badge: 'VIP', emoji: '🎟️' },
      { id: 'partner-coffee', type: 'partner_perk', title: 'Free drink at Day One Coffee', summary: 'Show your $VIBE balance at any Day One Coffee location for a free drink, once a week.', minHold: 5, channel: 'Partner', url: 'https://dayonecoffee.com/vibe', emoji: '☕' },
    ],
  },
  {
    version: 1,
    brand: 'PixelForge',
    symbol: 'FORGE',
    description: 'Indie game studio. Hold $FORGE for playtest access, in-game cosmetics, and dev nights.',
    accent: '#22C55E',
    cap: '0',
    benefits: [
      { id: 'closed-playtest', type: 'token_gate', title: 'Closed Playtest Access', summary: 'Hold 20+ $FORGE to join closed playtests before public launch.', minHold: 20, channel: 'Discord', emoji: '🎮' },
      { id: 'founder-skin', type: 'drop', title: 'Founder cosmetic skin', summary: 'An exclusive in-game skin airdropped to early holders.', minHold: 50, badge: 'Limited', emoji: '✨' },
      { id: 'dev-night', type: 'event', title: 'Monthly dev night', summary: 'Live monthly call with the dev team — roadmap, demos, AMA.', minHold: 10, channel: 'Discord', emoji: '🎤' },
      { id: 'steam-discount', type: 'discount', title: '30% off Steam keys', summary: 'Member pricing on our catalog.', minHold: 5, discountValue: { kind: 'percent', amount: 30 }, channel: 'Store', emoji: '🏷️' },
    ],
  },
  {
    version: 1,
    brand: 'Cloud9 Coffee',
    symbol: 'CUP',
    description: 'A local roaster going on-chain. Hold $CUP for free drinks, beans, and member pricing.',
    accent: '#D97706',
    cap: '0',
    benefits: [
      { id: 'free-drink', type: 'partner_perk', title: 'Free drink weekly', summary: 'Show your $CUP balance in-store for one free drink per week.', minHold: 5, channel: 'IRL', emoji: '☕' },
      { id: 'beans-discount', type: 'discount', title: '20% off beans', summary: 'Member pricing on all whole-bean bags.', minHold: 15, discountValue: { kind: 'percent', amount: 20 }, channel: 'Online', emoji: '🫘' },
      { id: 'cupping-tour', type: 'event', title: 'Cupping + roast tour', summary: 'Quarterly invite to a private cupping session and roastery tour.', minHold: 40, badge: 'VIP', validTo: '2026-12-31T00:00:00Z', emoji: '🔥' },
    ],
  },
]
