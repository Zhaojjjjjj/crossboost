import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CrossBoost - AI Cross-Border E-Commerce Content Platform',
  description: 'AI-powered content creation, multi-platform distribution, and analytics for cross-border sellers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
