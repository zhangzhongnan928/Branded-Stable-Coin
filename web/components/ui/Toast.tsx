'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, XCircle, Loader2, X, ExternalLink } from 'lucide-react'
import { explorerTx } from '@/lib/chain'

type ToastStatus = 'pending' | 'success' | 'error' | 'info'

interface Toast {
  id: number
  status: ToastStatus
  title: string
  description?: string
  txHash?: string
  sticky?: boolean
}

interface ToastCtx {
  push: (t: Omit<Toast, 'id'>) => number
  update: (id: number, patch: Partial<Omit<Toast, 'id'>>) => void
  dismiss: (id: number) => void
}

const Ctx = createContext<ToastCtx | null>(null)

export function useToast(): ToastCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useToast must be used within ToastProvider')
  return c
}

let _id = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const push = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = ++_id
      setToasts((prev) => [...prev, { ...t, id }])
      if (t.status === 'success' && !t.sticky) setTimeout(() => dismiss(id), 6000)
      return id
    },
    [dismiss],
  )
  const update = useCallback(
    (id: number, patch: Partial<Omit<Toast, 'id'>>) => {
      setToasts((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))
      if (patch.status === 'success' && !patch.sticky) setTimeout(() => dismiss(id), 6000)
    },
    [dismiss],
  )
  return (
    <Ctx.Provider value={{ push, update, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </Ctx.Provider>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icon =
    toast.status === 'success' ? (
      <CheckCircle2 className="text-success" size={18} />
    ) : toast.status === 'error' ? (
      <XCircle className="text-danger" size={18} />
    ) : toast.status === 'pending' ? (
      <Loader2 className="animate-spin text-accent" size={18} />
    ) : null
  return (
    <div className="glass w-[360px] max-w-[calc(100vw-2rem)] animate-slide-up rounded-lg border border-border p-3.5 shadow-lg">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5">{icon}</div>}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-fg">{toast.title}</div>
          {toast.description && <div className="mt-0.5 text-xs text-fg-muted">{toast.description}</div>}
          {toast.txHash && (
            <a
              href={explorerTx(toast.txHash)}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              View on BaseScan <ExternalLink size={11} />
            </a>
          )}
        </div>
        <button onClick={onClose} aria-label="Dismiss" className="text-fg-subtle transition hover:text-fg">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
