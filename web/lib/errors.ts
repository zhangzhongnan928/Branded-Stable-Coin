/** Map raw contract/wallet errors to warm, human messages. */
export function humanizeError(e: unknown): string {
  const anyE = e as any
  const msg = (anyE?.shortMessage || anyE?.details || anyE?.message || String(e)).toString()

  if (/User rejected|rejected the request|denied|User denied/i.test(msg)) return 'Looks like you cancelled — no harm done.'
  if (/\bCAP\b/.test(msg)) return 'This brand has hit its deposit cap — try a smaller amount.'
  if (/NO_YIELD/.test(msg)) return 'No yield to harvest yet — it grows as deposits sit in Aave.'
  if (/REDEEM_LT_PRINCIPAL/.test(msg)) return 'Redemption fell short by rounding — try again in a moment.'
  if (/NO_SHARES|ZERO_AMOUNT/.test(msg)) return 'Enter an amount greater than zero.'
  if (/PAUSED/.test(msg)) return 'New mints are paused for this brand. Redemptions stay open.'
  if (/NOT_BRAND_OWNER|NOT_ADMIN/.test(msg)) return 'Only the brand owner can do this.'
  if (/insufficient funds|exceeds balance|transfer amount exceeds|ERC20: transfer/i.test(msg))
    return 'Insufficient balance for this transaction.'
  if (/allowance|approve/i.test(msg)) return 'Approval is required first — try again.'
  if (/chain mismatch|wrong network|does not match the target chain/i.test(msg)) return 'Switch to Base Sepolia to continue.'
  if (/NotEnoughAvailableUserBalance/i.test(msg)) return 'Not enough backing available right now — try a slightly smaller amount.'

  return msg.length > 140 ? `${msg.slice(0, 140)}…` : msg
}
