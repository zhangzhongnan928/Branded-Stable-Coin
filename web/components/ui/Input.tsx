'use client'

import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { error?: boolean }>(
  function Input({ className, error, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'h-11 w-full rounded-md border bg-surface-2 px-3.5 text-fg placeholder:text-fg-subtle outline-none transition',
          'focus:bg-surface focus:ring-2 focus:ring-ring/30',
          error ? 'border-danger focus:border-danger focus:ring-danger/30' : 'border-border focus:border-accent',
          className,
        )}
        {...rest}
      />
    )
  },
)

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }>(
  function Textarea({ className, error, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-md border bg-surface-2 px-3.5 py-2.5 text-fg placeholder:text-fg-subtle outline-none transition',
          'focus:bg-surface focus:ring-2 focus:ring-ring/30',
          error ? 'border-danger focus:border-danger focus:ring-danger/30' : 'border-border focus:border-accent',
          className,
        )}
        {...rest}
      />
    )
  },
)

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <label className="text-xs font-medium uppercase tracking-[0.08em] text-fg-subtle">{label}</label>}
      {children}
      {error ? <p className="text-xs text-danger">{error}</p> : hint ? <p className="text-xs text-fg-subtle">{hint}</p> : null}
    </div>
  )
}

export function AmountInput({
  value,
  onValueChange,
  suffix,
  balanceLabel,
  onMax,
  disabled,
  className,
}: {
  value: string
  onValueChange: (v: string) => void
  suffix?: ReactNode
  balanceLabel?: ReactNode
  onMax?: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-surface-2 transition focus-within:border-accent focus-within:ring-2 focus-within:ring-ring/30',
        disabled && 'opacity-60',
        className,
      )}
    >
      <div className="flex items-center">
        <input
          inputMode="decimal"
          placeholder="0.0"
          value={value}
          disabled={disabled}
          onChange={(e) => onValueChange(e.target.value)}
          className="h-16 w-full bg-transparent px-4 font-display text-2xl tnum outline-none placeholder:text-fg-subtle"
        />
        <div className="flex items-center gap-2 pr-3">
          {onMax && (
            <button
              type="button"
              onClick={onMax}
              className="rounded text-xs font-semibold text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              MAX
            </button>
          )}
          {suffix && (
            <span className="rounded-pill border border-border bg-surface px-2.5 py-1 text-xs font-medium text-fg-muted">
              {suffix}
            </span>
          )}
        </div>
      </div>
      {balanceLabel && <div className="px-4 pb-2 text-xs text-fg-subtle">{balanceLabel}</div>}
    </div>
  )
}
