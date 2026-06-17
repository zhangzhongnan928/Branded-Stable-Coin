export type BenefitType =
  | 'token_gate'
  | 'discount'
  | 'drop'
  | 'event'
  | 'partner_perk'
  | 'custom'

export interface DiscountValue {
  kind: 'percent' | 'fixed'
  amount: number
  currency?: string
}

export interface Benefit {
  id: string
  type: BenefitType
  title: string
  summary: string
  minHold?: number
  discountValue?: DiscountValue
  channel?: string
  url?: string
  validFrom?: string
  validTo?: string
  badge?: string
  emoji?: string
}

export interface BenefitsDoc {
  version: number
  brand: string
  symbol: string
  description?: string
  accent?: string
  updatedAt?: string
  benefits: Benefit[]
}

/** On-chain BrandInfo as returned by Factory.getBrands / getBrandsRange. */
export interface BrandInfo {
  vault: `0x${string}`
  token: `0x${string}`
  name: string
  symbol: string
  owner: `0x${string}`
  treasury: `0x${string}`
  cap: bigint
}
