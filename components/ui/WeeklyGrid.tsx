'use client'

import type { CSSProperties } from 'react'
import type { CourseGroup, TimeBlock, WorkSchedule } from '@/lib/api/contracts'
import { cn } from './utils'
import { BriefcaseBusiness, BookOpen } from 'lucide-react'

const days: Array<{ id: TimeBlock['day']; short: string; label: string }> = [
  { id: 'mon', short: 'Lun', label: 'Lunes' },
  { id: 'tue', short: 'Mar', label: 'Martes' },
  { id: 'wed', short: 'Mié', label: 'Miércoles' },
  { id: 'thu', short: 'Jue', label: 'Jueves' },
  { id: 'fri', short: 'Vie', label: 'Viernes' },
  { id: 'sat', short: 'Sáb', label: 'Sábado' },
  { id: 'sun', short: 'Dom', label: 'Domingo' },
]

const dayStartMinutes = 6 * 60
const dayEndMinutes = 22 * 60
const dayDurationMinutes = dayEndMinutes - dayStartMinutes
const gridHeight = 640
const hourMarks = [6, 12, 18, 22]
const colors = ['bg-blue-600', 'bg-violet-600', 'bg-teal-700', 'bg-orange-600', 'bg-pink-700']

function toMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function labelTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  const suffix = hours >= 12 ? 'p. m.' : 'a. m.'
  const hour = hours % 12 || 12
  return `${hour}:${String(minutes).padStart(2, '0')} ${suffix}`
}

function blockStyle(block: TimeBlock): CSSProperties {
  const start = Math.max(dayStartMinutes, Math.min(dayEndMinutes, toMinutes(block.start)))
  const end = Math.max(start, Math.min(dayEndMinutes, toMinutes(block.end)))
  const top = ((start - dayStartMinutes) / dayDurationMinutes) * 100
  const height = Math.max(((end - start) / dayDurationMinutes) * 100, 4)
  return { top: `${top}%`, height: `${height}%` }
}

function groupModality(group: CourseGroup) {
  if (group.modality === 'virtual') return 'Virtual'
  if (group.modality === 'mixta') return 'Mixta'
  return 'Presencial'
}

function sortBlocks(left: TimeBlock, right: TimeBlock) {
  return toMinutes(left.start) - toMinutes(right.start) || toMinutes(left.end) - toMinutes(right.end)
}

function Block({ block, kind, label, colorIndex, modality, className, style }: { block: TimeBlock; kind: 'work' | 'class'; label: string; colorIndex?: number; modality?: string; className?: string; style?: CSSProperties }) {
  const classColor = colors[(colorIndex ?? 0) % colors.length]
  return <div className={cn('rounded-md border px-2.5 py-2 text-left text-xs shadow-sm', kind === 'work' ? 'border-slate-400 bg-slate-100 text-status-work' : cn('border-white/20 text-white', classColor), className)} style={style}><div className="flex items-center gap-1.5 font-bold"><span className="shrink-0">{kind === 'work' ? <BriefcaseBusiness aria-hidden="true" className="h-3.5 w-3.5" /> : <BookOpen aria-hidden="true" className="h-3.5 w-3.5" />}</span><span className="truncate">{label}</span></div><div className="mt-1 opacity-90">{modality ? `${modality} · ` : ''}{labelTime(block.start)} – {labelTime(block.end)}</div></div>
}

export function WeeklyGrid({ workSchedule, groups, labels = {}, conflictGroupIds = [], className }: { workSchedule: WorkSchedule; groups: CourseGroup[]; labels?: Record<string, string>; conflictGroupIds?: string[]; className?: string }) {
  const grouped = groups.flatMap((group, index) => group.blocks.map((block) => ({ block, group, index })))
  const gridStyle = { height: `${gridHeight}px` }
  const hourLineStyle = { backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent calc(6.25% - 1px), #e2e8f0 calc(6.25% - 1px), #e2e8f0 6.25%)' }

  return <div className={cn('overflow-hidden rounded-lg border border-slate-200 bg-white', className)}>
    <div className="hidden overflow-x-auto md:block">
      <div className="min-w-[920px]">
        <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-slate-200 bg-slate-50">
          <div className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Hora</div>
          {days.map((day) => <div key={day.id} className="border-l border-slate-200 px-3 py-3 text-xs font-bold text-ink-secondary">{day.short}</div>)}
        </div>
        <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))]">
          <div className="relative text-[11px] font-semibold text-slate-400" style={gridStyle}>{hourMarks.map((hour) => <span key={hour} className="absolute left-3 -translate-y-1/2" style={{ top: `${((hour * 60 - dayStartMinutes) / dayDurationMinutes) * 100}%` }}>{labelTime(`${String(hour).padStart(2, '0')}:00`)}</span>)}</div>
          {days.map((day) => {
            const workBlocks = workSchedule.blocks.filter((block) => block.day === day.id).sort(sortBlocks)
            const classBlocks = grouped.filter(({ block }) => block.day === day.id).sort((left, right) => sortBlocks(left.block, right.block))
            return <div key={day.id} className="relative border-l border-slate-200" style={{ ...gridStyle, ...hourLineStyle }}>
              <div className="absolute inset-0 p-1">
                {workBlocks.map((block) => <Block key={`${block.day}-${block.start}-work`} block={block} kind="work" label="Trabajo" className="absolute left-1 right-1 z-10 overflow-hidden" style={blockStyle(block)} />)}
                {classBlocks.map(({ block, group, index }) => <Block key={`${group.id}-${block.start}`} block={block} kind="class" colorIndex={index} label={labels[group.courseId] ?? group.label} modality={groupModality(group)} className={cn('absolute left-1 right-1 z-20 overflow-hidden', conflictGroupIds.includes(group.id) && 'ring-2 ring-red-400 ring-offset-1')} style={blockStyle(block)} />)}
              </div>
            </div>
          })}
        </div>
      </div>
    </div>
    <div className="divide-y divide-slate-200 md:hidden">
      {days.map((day) => {
        const work = workSchedule.blocks.filter((block) => block.day === day.id).sort(sortBlocks)
        const classes = grouped.filter(({ block }) => block.day === day.id).sort((left, right) => sortBlocks(left.block, right.block))
        if (!work.length && !classes.length) return null
        return <section key={day.id} className="p-4"><h3 className="mb-3 text-sm font-bold text-brand-navy">{day.label}</h3><div className="space-y-2">{work.map((block) => <Block key={`${block.day}-${block.start}-work`} block={block} kind="work" label="Trabajo" />)}{classes.map(({ block, group, index }) => <Block key={`${group.id}-${block.start}`} block={block} kind="class" colorIndex={index} label={labels[group.courseId] ?? group.label} />)}</div></section>
      })}
    </div>
  </div>
}
