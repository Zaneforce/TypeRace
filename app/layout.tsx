import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '@/lib/fontawesome'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TypeRace - Typing Speed Game',
  description: 'Belajar dan adu kecepatan mengetik dengan teman-teman',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
