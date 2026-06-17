import { formatUnits, parseUnits } from 'viem'

export const USDC_DECIMALS = 6

/** Format a 6-decimal bigint to a human string with grouping. */
export function fmtUnits(value: bigint | undefined, opts?: { decimals?: number; max?: number }): string {
  if (value === undefined) return '—'
  const decimals = opts?.decimals ?? USDC_DECIMALS
  const max = opts?.max ?? 2
  const n = Number(formatUnits(value, decimals))
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: max })
}

/** Compact format for big stats, e.g. 12.4K, 1.2M. */
export function fmtCompact(value: bigint | undefined, decimals = USDC_DECIMALS): string {
  if (value === undefined) return '—'
  const n = Number(formatUnits(value, decimals))
  return n.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 })
}

/** Parse a human amount string to a 6-decimal bigint. Returns undefined if invalid. */
export function toUnits(human: string, decimals = USDC_DECIMALS): bigint | undefined {
  if (!human || !/^\d*\.?\d*$/.test(human.trim())) return undefined
  try {
    return parseUnits(human.trim() as `${number}`, decimals)
  } catch {
    return undefined
  }
}

/** Whole-token count (drops the 6-decimal fraction) — used for benefit minHold comparisons. */
export function toWholeTokens(value: bigint, decimals = USDC_DECIMALS): number {
  return Number(value / 10n ** BigInt(decimals))
}

export function truncate(addr?: string, lead = 6, tail = 4): string {
  if (!addr) return ''
  return addr.length <= lead + tail ? addr : `${addr.slice(0, lead)}…${addr.slice(-tail)}`
}
