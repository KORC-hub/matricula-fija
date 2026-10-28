'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown, LogOut, RotateCcw } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useSemesterStore } from '@/store/semester-store'
import { cn } from '@/components/ui/utils'

export function StudentAvatar({ size = 40 }: { size?: 32 | 40 | 56 }) {
  const [failed, setFailed] = useState(false)
  const initials = 'CO'
  const dimension = size
  return failed ? (
    <span aria-label="Avatar de Camilo Ospina" className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-brand-navy font-bold text-white', size === 56 ? 'h-14 w-14 text-lg' : size === 40 ? 'h-10 w-10 text-sm' : 'h-8 w-8 text-xs')}>
      {initials}
    </span>
  ) : (
    <Image src="/student_profile_photo.png" alt="Foto de Camilo Ospina" width={dimension} height={dimension} className="shrink-0 rounded-full object-cover" onError={() => setFailed(true)} priority={size === 56} />
  )
}

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const reset = useSemesterStore((state) => state.reset)
  const profile = useSemesterStore((state) => state.profile)
  const [open, setOpen] = useState(false)
  const isPublic = pathname === '/' || pathname === '/login'
  const firstName = profile.name.split(' ')[0] || 'Camilo'

  if (isPublic) {
    return <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8"><Link href="/" className="flex items-center gap-2.5" aria-label="Ir al inicio de MatriculaFija"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-navy text-sm font-black text-white">M</span><span className="text-base font-black tracking-tight text-brand-navy">Matricula<span className="text-brand-turquoise">Fija</span></span></Link><span className="text-xs font-medium text-ink-soft">Planificador personal</span></div></header>
  }

  return <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8"><Link href="/perfil" className="flex items-center gap-2.5" aria-label="Ir al panel de estudiante"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-navy text-sm font-black text-white">M</span><span className="hidden text-base font-black tracking-tight text-brand-navy sm:block">Matricula<span className="text-brand-turquoise">Fija</span></span></Link><div className="relative"><button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu" className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"><StudentAvatar size={32} /><span className="hidden text-sm font-semibold text-brand-navy sm:block">{firstName}</span><ChevronDown aria-hidden="true" className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} /></button>{open ? <div role="menu" className="absolute right-0 top-12 w-56 rounded-md border border-slate-200 bg-white p-1.5 shadow-soft"><div className="border-b border-slate-100 px-3 py-2"><p className="text-sm font-semibold text-brand-navy">{profile.name || 'Sesión activa'}</p><p className="mt-0.5 truncate text-xs text-ink-soft">{profile.email || 'Mi plan'}</p></div><Link role="menuitem" href="/perfil" onClick={() => setOpen(false)} className="mt-1 flex items-center gap-2 rounded px-3 py-2 text-sm text-ink-secondary hover:bg-slate-50"><StudentAvatar size={32} />Ver mi perfil</Link><button role="menuitem" type="button" onClick={() => { setOpen(false); reset(); router.push('/') }} className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-ink-secondary hover:bg-slate-50"><RotateCcw aria-hidden="true" className="h-4 w-4" />Reiniciar plan</button><button role="menuitem" type="button" onClick={() => { setOpen(false); router.push('/login' as never) }} className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-ink-secondary hover:bg-slate-50"><LogOut aria-hidden="true" className="h-4 w-4" />Cambiar sesión</button></div> : null}</div></div></header>
}

export function ScreenPage({ step, title, description, children, footer }: { step?: string; eyebrow?: string; title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return <div className="mx-auto max-w-7xl px-5 py-7 lg:px-8 lg:py-9">{step ? <div className="mb-7"><div className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-ink-soft">Tu recorrido</div><div className="max-w-xl"><div className="h-1 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-brand-turquoise" style={{ width: `${({ '/perfil': 14, '/horario-laboral': 28, '/materias': 42, '/compatibilidad': 57, '/armador': 71, '/plan-listo': 85 } as Record<string, number>)[step] ?? 100}%` }} /></div></div></div> : null}<div className="mb-7 max-w-3xl"><h1 className="text-balance text-3xl font-black tracking-[-.035em] text-brand-navy sm:text-4xl">{title}</h1>{description ? <p className="mt-2.5 max-w-2xl text-base leading-7 text-ink-secondary">{description}</p> : null}</div>{children}{footer ? <div className="mt-7 border-t border-slate-200 pt-5">{footer}</div> : null}</div>
}

