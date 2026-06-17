import type { CSSProperties } from 'react'

export const DEFAULT_ACCENT = '#6366F1'

/** "#7C5CFF" -> "124 92 255" (the channel format used by our CSS vars). */
export function hexToChannels(hex?: string): string {
  const h = (hex ?? DEFAULT_ACCENT).replace('#', '')
  if (h.length !== 6) return '99 102 241'
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  if ([r, g, b].some((n) => Number.isNaN(n))) return '99 102 241'
  return `${r} ${g} ${b}`
}

function shift(hex: string, amount: number): string {
  const ch = hexToChannels(hex).split(' ').map(Number)
  const adj = ch.map((c) => Math.max(0, Math.min(255, c + amount)))
  return adj.join(' ')
}

/** Accessible foreground ("R G B" channels) for text/icons on top of the accent color. */
export function accentForeground(hex?: string): string {
  const [r, g, b] = hexToChannels(hex)
    .split(' ')
    .map(Number)
    .map((c) => {
      const s = c / 255
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    })
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.42 ? '16 17 24' : '255 255 255'
}

/** Inject a brand accent onto a subtree: every bg-accent / text-accent / shadow-glow re-themes. */
export function brandStyle(hex?: string): CSSProperties {
  const accent = hexToChannels(hex)
  return {
    ['--accent' as any]: accent,
    ['--accent-hover' as any]: shift(hex ?? DEFAULT_ACCENT, -20),
    ['--accent-fg' as any]: accentForeground(hex),
    ['--ring' as any]: accent,
  }
}

/** A soft gradient string for brand marks / hero glows. */
export function brandGradient(hex?: string): string {
  const a = hexToChannels(hex)
  const b = shift(hex ?? DEFAULT_ACCENT, 30)
  return `linear-gradient(135deg, rgb(${a}), rgb(${b}))`
}

export const ACCENT_PRESETS = [
  '#6366F1', '#7C5CFF', '#EC4899', '#F43F5E',
  '#22C55E', '#10B981', '#0EA5E9', '#F59E0B',
  '#D97706', '#8B5CF6', '#14B8A6', '#EF4444',
]
