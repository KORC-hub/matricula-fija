import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' })

export const metadata: Metadata = {
  title: 'MatriculaFija — arma tu semestre sin choques',
  description: 'Descubre qué grupos caben en tu semana laboral antes de pagar tu matrícula.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body className={inter.variable}>{children}</body></html>
}
