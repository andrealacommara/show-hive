import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Show Hive',
  description: 'Gestionale turni Show Hive',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
