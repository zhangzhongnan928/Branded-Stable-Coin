import Link from 'next/link'
import { Container } from './ui/Layout'
import { Badge } from './ui/Badge'

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border">
      <Container className="py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <div className="font-display text-lg font-bold">Minted</div>
            <p className="mt-2 text-sm text-fg-muted">
              Your coin, your community, their perks. Launch a dollar-backed creator coin in minutes.
            </p>
            <Badge tone="warning" dot className="mt-3">
              Testnet — Base Sepolia · play money only
            </Badge>
          </div>
          <div className="flex gap-12 text-sm">
            <div className="flex flex-col gap-2">
              <div className="text-xs uppercase tracking-wide text-fg-subtle">Product</div>
              <Link href="/" className="text-fg-muted transition hover:text-fg">Explore</Link>
              <Link href="/launch" className="text-fg-muted transition hover:text-fg">Launch your coin</Link>
              <Link href="/dashboard" className="text-fg-muted transition hover:text-fg">Creator dashboard</Link>
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-xs uppercase tracking-wide text-fg-subtle">Resources</div>
              <a href="https://app.aave.com/faucet/?marketName=proto_base_sepolia_v3" target="_blank" rel="noreferrer" className="text-fg-muted transition hover:text-fg">Get test USDC</a>
              <a href="https://portal.cdp.coinbase.com/products/faucet" target="_blank" rel="noreferrer" className="text-fg-muted transition hover:text-fg">Get test ETH</a>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-xs text-fg-subtle">
          © 2026 Minted — demo on Base Sepolia. No real funds. For feedback only, not financial advice.
        </div>
      </Container>
    </footer>
  )
}
