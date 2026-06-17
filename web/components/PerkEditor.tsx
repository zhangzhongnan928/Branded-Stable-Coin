'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { Benefit, BenefitType } from '@/lib/types'
import { PERK_TEMPLATES } from '@/lib/demo'
import { Button } from './ui/Button'
import { Input, Field } from './ui/Input'
import { EmptyState } from './ui/EmptyState'

const TYPES: { value: BenefitType; label: string }[] = [
  { value: 'token_gate', label: 'Access' },
  { value: 'discount', label: 'Discount' },
  { value: 'drop', label: 'Drop' },
  { value: 'event', label: 'Event' },
  { value: 'partner_perk', label: 'Partner' },
  { value: 'custom', label: 'Custom' },
]

let counter = 0
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `perk-${++counter}`

export function PerkEditor({ value, onChange }: { value: Benefit[]; onChange: (b: Benefit[]) => void }) {
  const update = (i: number, patch: Partial<Benefit>) => onChange(value.map((b, j) => (j === i ? { ...b, ...patch } : b)))
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i))
  const add = (tpl?: Omit<Benefit, 'id'>) => {
    const base = tpl ?? { type: 'custom' as BenefitType, title: 'New perk', summary: '' }
    onChange([...value, { ...base, id: `${slug(base.title)}-${value.length + 1}` }])
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <EmptyState title="Add your first perk" description="Perks are what fans unlock by holding your coin." />
      )}

      {value.map((b, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-border bg-surface-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <select
              value={b.type}
              onChange={(e) => update(i, { type: e.target.value as BenefitType })}
              className="h-9 rounded-md border border-border bg-surface px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => remove(i)}
              aria-label="Remove perk"
              className="rounded text-fg-subtle transition hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <Input value={b.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="Perk title" />
          <Input value={b.summary} onChange={(e) => update(i, { summary: e.target.value })} placeholder="Short description" />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Min hold">
              <Input
                type="number"
                min={0}
                value={b.minHold ?? ''}
                onChange={(e) => update(i, { minHold: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="0"
              />
            </Field>
            <Field label="Link">
              <Input value={b.url ?? ''} onChange={(e) => update(i, { url: e.target.value || undefined })} placeholder="https://" />
            </Field>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        {PERK_TEMPLATES.map((t) => (
          <Button key={t.key} variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={() => add(t.benefit)}>
            {t.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
