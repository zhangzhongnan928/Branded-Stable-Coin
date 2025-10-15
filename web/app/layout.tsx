import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Branded Stablecoin',
  description: 'Issue brand stablecoins 1:1 backed by USDC',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-black">{children}</body>
    </html>
  )
}


