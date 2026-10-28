import { AlertTriangle, CheckCircle2, CircleAlert, CircleX, BriefcaseBusiness, Ban } from 'lucide-react'
import { cn } from './utils'

type Status = 'compatible' | 'risk' | 'conflict' | 'no_viable' | 'no_seats' | 'work'
const statusConfig = {
  compatible: { label: 'Compatible', icon: CheckCircle2, className: 'bg-emerald-50 text-status-success ring-emerald-200' },
  risk: { label: 'Riesgo por desplazamiento', icon: AlertTriangle, className: 'bg-amber-50 text-status-warning ring-amber-200' },
  conflict: { label: 'Choque', icon: CircleX, className: 'bg-red-50 text-status-danger ring-red-200' },
  no_viable: { label: 'No viable este semestre', icon: CircleAlert, className: 'bg-red-50 text-status-danger ring-red-200' },
  no_seats: { label: 'Sin cupos', icon: Ban, className: 'bg-slate-100 text-ink-secondary ring-slate-200' },
  work: { label: 'Trabajo', icon: BriefcaseBusiness, className: 'bg-slate-100 text-status-work ring-slate-200' },
} satisfies Record<Status, { label: string; icon: typeof CheckCircle2; className: string }>

export function StatusBadge({ status, label }: { status: Status; label?: string }) { const item = statusConfig[status]; const Icon = item.icon; return <span className={cn('inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-bold ring-1 ring-inset', item.className)}><Icon aria-hidden="true" className="h-3.5 w-3.5" /><span>{label ?? item.label}</span></span> }
