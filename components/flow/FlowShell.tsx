'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useSemesterStore } from '@/store/semester-store'
import { HydrationGate } from './HydrationGate'
import { Toast } from '@/components/ui/Toast'
import { AppHeader } from './AppChrome'

const previous: Record<string, string> = { '/perfil': '/', '/horario-laboral': '/perfil', '/materias': '/horario-laboral', '/compatibilidad': '/materias', '/armador': '/compatibilidad', '/plan-listo': '/armador', '/mi-semestre': '/plan-listo' }

export function FlowShell({ children }: { children: React.ReactNode }) {
  return <HydrationGate><div className="min-h-screen bg-surface-page"><AppHeader /><main>{children}</main><Toast /></div></HydrationGate>
}

export function BackButton() {
  const pathname = usePathname()
  const router = useRouter()
  return previous[pathname] ? <button type="button" className="inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-ink-secondary transition hover:text-brand-indigo focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100" onClick={() => router.push(previous[pathname] as never)}><ArrowLeft aria-hidden="true" className="h-4 w-4" />Atrás</button> : null
}

export function useResetDemo() {
  const reset = useSemesterStore((state) => state.reset)
  const router = useRouter()
  return () => { reset(); router.push('/') }
}
