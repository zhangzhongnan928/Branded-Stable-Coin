import './globals.css'
import type { Metadata } from 'next'
import { Inter, Sora, JetBrains_Mono } from 'next/font/google'
import { Providers } from './providers'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const display = Sora({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-display', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'Minted — your coin, your community, their perks',
  description:
    'Launch a dollar-backed creator coin in minutes. Fans hold it to unlock your perks and can cash out 1:1 anytime.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <Providers>
          <Nav />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
