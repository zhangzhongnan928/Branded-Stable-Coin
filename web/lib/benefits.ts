import type { Benefit, BenefitsDoc } from './types'

const EMPTY: BenefitsDoc = { version: 1, brand: '', symbol: '', benefits: [] }

function normalize(obj: any): BenefitsDoc {
  const benefits: Benefit[] = Array.isArray(obj?.benefits)
    ? obj.benefits.filter((b: any) => b && b.id && b.type && b.title && b.summary)
    : []
  return { ...EMPTY, ...obj, benefits }
}

/** Parse inline JSON or a data: URI synchronously. URLs return EMPTY (use loadBenefits). */
export function parseBenefits(raw?: string): BenefitsDoc {
  try {
    if (!raw || !raw.trim()) return EMPTY
    const s = raw.trim()
    if (s.startsWith('data:')) {
      const comma = s.indexOf(',')
      const meta = s.slice(5, comma)
      const body = s.slice(comma + 1)
      const json = meta.includes('base64') ? atob(body) : decodeURIComponent(body)
      return normalize(JSON.parse(json))
    }
    if (s.startsWith('{')) return normalize(JSON.parse(s))
    return EMPTY
  } catch {
    return EMPTY
  }
}

/** Full loader: inline JSON, data: URI, or remote http(s)/ipfs URL. Never throws. */
export async function loadBenefits(raw?: string): Promise<BenefitsDoc> {
  try {
    if (!raw || !raw.trim()) return EMPTY
    const s = raw.trim()
    if (/^(https?:|ipfs:)/i.test(s)) {
      const url = s.startsWith('ipfs:') ? `https://ipfs.io/ipfs/${s.replace(/^ipfs:\/\//, '')}` : s
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) return EMPTY
      return normalize(await res.json())
    }
    return parseBenefits(s)
  } catch {
    return EMPTY
  }
}

export function isEnded(b: Benefit, now = Date.now()): boolean {
  return !!b.validTo && new Date(b.validTo).getTime() < now
}

export function isUpcoming(b: Benefit, now = Date.now()): boolean {
  return !!b.validFrom && new Date(b.validFrom).getTime() > now
}

export function isActive(b: Benefit, now = Date.now()): boolean {
  return !isEnded(b, now) && !isUpcoming(b, now)
}

/** Eligibility: does a holder with `balanceWhole` whole tokens unlock this perk? */
export function isUnlocked(b: Benefit, balanceWhole: number): boolean {
  return !b.minHold || balanceWhole >= b.minHold
}

export const BENEFIT_LABEL: Record<Benefit['type'], string> = {
  token_gate: 'Access',
  discount: 'Discount',
  drop: 'Drop',
  event: 'Event',
  partner_perk: 'Partner',
  custom: 'Perk',
}

export const BENEFIT_FALLBACK_EMOJI: Record<Benefit['type'], string> = {
  token_gate: '🔓',
  discount: '🏷️',
  drop: '🎁',
  event: '🎟️',
  partner_perk: '🤝',
  custom: '✨',
}
