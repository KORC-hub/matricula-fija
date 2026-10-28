'use client'

import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react'
import { useSemesterStore } from '@/store/semester-store'
import { cn } from './utils'

export function Toast() { const notice = useSemesterStore((state) => state.notice); const setNotice = useSemesterStore((state) => state.setNotice); if (!notice) return null; const Icon = notice.type === 'success' ? CheckCircle2 : notice.type === 'error' ? CircleAlert : Info; return <div role="status" className={cn('pointer-events-none fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-md border bg-white px-4 py-3 shadow-soft', notice.type === 'success' ? 'border-emerald-200' : notice.type === 'error' ? 'border-red-200' : 'border-indigo-200')}><Icon aria-hidden="true" className={cn('mt-0.5 h-5 w-5 shrink-0', notice.type === 'success' ? 'text-status-success' : notice.type === 'error' ? 'text-status-danger' : 'text-brand-indigo')} /><p className="text-sm font-medium leading-5 text-ink-primary">{notice.message}</p><button aria-label="Cerrar aviso" className="pointer-events-auto ml-2 text-slate-400 hover:text-brand-navy" onClick={() => setNotice(null)}><X aria-hidden="true" className="h-4 w-4" /></button></div> }
