'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2, Circle, Clock3, Info, LockKeyhole, MapPin, Sparkles, Users, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormField, inputClass } from '@/components/ui/FormField'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { BackButton } from './FlowShell'
import { ScreenPage as Page } from './AppChrome'
import { useSemesterStore } from '@/store/semester-store'
import type { Course, CourseGroup, IndividualRecommendation, RecommendationResponse, TimeBlock, WorkDayPreference, WorkMode, WorkSchedule } from '@/lib/api/contracts'

type Day = TimeBlock['day']

const days: Array<{ id: Day; label: string; short: string }> = [
  { id: 'mon', label: 'Lunes', short: 'Lun' },
  { id: 'tue', label: 'Martes', short: 'Mar' },
  { id: 'wed', label: 'Miércoles', short: 'Mié' },
  { id: 'thu', label: 'Jueves', short: 'Jue' },
  { id: 'fri', label: 'Viernes', short: 'Vie' },
  { id: 'sat', label: 'Sábado', short: 'Sáb' },
  { id: 'sun', label: 'Domingo', short: 'Dom' },
]

const modeLabels: Record<WorkMode, string> = { office: 'Office', remote: 'Remoto', off: 'Libre' }
const modeClasses: Record<WorkMode, string> = {
  office: 'border-indigo-200 bg-indigo-50 text-brand-indigo',
  remote: 'border-teal-200 bg-teal-50 text-teal-800',
  off: 'border-slate-200 bg-slate-50 text-ink-soft',
}
const offHours = { start: '00:00' as TimeBlock['start'], end: '00:01' as TimeBlock['end'] }

function preferenceList(schedule: WorkSchedule): WorkDayPreference[] {
  const saved = new Map((schedule.dayPreferences ?? []).map((item) => [item.day, item]))
  const blocks = new Map(schedule.blocks.map((block) => [block.day, block]))
  return days.map(({ id }) => {
    const preferred = saved.get(id)
    if (preferred) return preferred
    const block = blocks.get(id)
    return block ? { ...block, workMode: 'office' } : { day: id, ...offHours, workMode: 'off' }
  })
}

function buildSchedule(preferences: WorkDayPreference[], commuteMinutes: number, anchorDay?: Day): WorkSchedule {
  return {
    blocks: preferences.filter((item) => item.workMode !== 'off').map(({ day, start, end }) => ({ day, start, end })),
    commuteMinutes,
    dayPreferences: preferences,
    anchorDay,
  }
}

function formatTime(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'p. m.' : 'a. m.'}`
}

export function WorkSchedulePreferencesScreen() {
  const schedule = useSemesterStore((state) => state.workSchedule)
  const setSchedule = useSemesterStore((state) => state.setWorkSchedule)
  const setNotice = useSemesterStore((state) => state.setNotice)
  const router = useRouter()
  const [preferences, setPreferences] = useState(() => preferenceList(schedule))
  const [commuteMinutes, setCommuteMinutes] = useState(schedule.commuteMinutes)
  const [anchorDay, setAnchorDay] = useState<Day | undefined>(schedule.anchorDay)
  const [error, setError] = useState('')

  useEffect(() => {
    const next = preferenceList(schedule)
    setPreferences(next)
    setCommuteMinutes(schedule.commuteMinutes)
    setAnchorDay(schedule.anchorDay)
  }, [schedule])

  const commit = (nextPreferences: WorkDayPreference[], nextCommute = commuteMinutes, nextAnchor = anchorDay) => {
    setPreferences(nextPreferences)
    setSchedule(buildSchedule(nextPreferences, nextCommute, nextAnchor))
  }

  const updateDay = (day: Day, patch: Partial<WorkDayPreference>) => {
    const next = preferences.map((item) => item.day === day ? { ...item, ...patch } : item)
    commit(next)
    setError('')
  }

  const updateMode = (day: Day, workMode: WorkMode) => {
    const current = preferences.find((item) => item.day === day)
    const nextHours = workMode === 'off'
      ? offHours
      : current?.workMode === 'off'
        ? { start: '09:00' as TimeBlock['start'], end: '17:00' as TimeBlock['end'] }
        : {}
    updateDay(day, { workMode, ...nextHours })
  }

  const applyDemo = () => {
    const next: WorkDayPreference[] = preferences.map((item) => ({ ...item, workMode: (item.day === 'sat' || item.day === 'sun' ? 'off' : 'office') as WorkMode, start: '06:00' as TimeBlock['start'], end: '14:00' as TimeBlock['end'] }))
    commit(next, 45)
    setAnchorDay('sat')
    setSchedule(buildSchedule(next, 45, 'sat'))
    setNotice({ type: 'success', message: 'Horario cargado. El sábado queda como día ancla opcional.' })
  }

  const submit = () => {
    const invalid = preferences.some((item) => item.workMode !== 'off' && item.start >= item.end)
    if (invalid) {
      setError('Revisa las horas: la salida debe ser después del inicio en cada día laboral.')
      return
    }
    setError('')
    setSchedule(buildSchedule(preferences, commuteMinutes, anchorDay))
    router.push('/materias')
  }

  return <Page step="/horario-laboral" eyebrow="Momento 3 · Tu semana" title="Configura tu semana laboral" description="Dinos qué días trabajas desde la oficina, remoto o tienes libres. Así priorizamos opciones que sí puedas cumplir.">
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <section className="space-y-5">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div><p className="text-sm font-bold text-brand-navy">Una configuración flexible</p><p className="mt-1 text-sm leading-6 text-ink-secondary">Puedes combinar oficina y remoto. Los cambios se guardan en este navegador.</p></div>
          
        </div>
        <div className="space-y-3">
          {preferences.map((item) => <div key={item.day} className="border-b border-slate-200 pb-4 last:border-0">
            <div className="grid gap-3 sm:grid-cols-[110px_1fr] sm:items-center">
              <div><p className="text-sm font-bold text-brand-navy">{days.find((day) => day.id === item.day)?.label}</p><p className="text-xs text-ink-soft">{item.workMode === 'off' ? 'Sin jornada' : `${formatTime(item.start)} – ${formatTime(item.end)}`}</p></div>
              <div className="flex flex-wrap gap-2" role="group" aria-label={`Modalidad del ${days.find((day) => day.id === item.day)?.label}`}>
                {(['office', 'remote', 'off'] as WorkMode[]).map((mode) => <button key={mode} type="button" aria-pressed={item.workMode === mode} onClick={() => updateMode(item.day, mode)} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${item.workMode === mode ? modeClasses[mode] : 'border-slate-200 bg-white text-ink-soft hover:border-brand-indigo'}`}>{modeLabels[mode]}</button>)}
              </div>
            </div>
            {item.workMode !== 'off' ? <div className="mt-3 grid max-w-sm grid-cols-2 gap-3 sm:ml-[122px]"><label className="text-xs font-bold text-ink-secondary">Inicio<input aria-label={`Inicio del ${days.find((day) => day.id === item.day)?.label}`} type="time" value={item.start} onChange={(event) => updateDay(item.day, { start: event.target.value as TimeBlock['start'] })} className={`${inputClass} mt-1 min-h-9`} /></label><label className="text-xs font-bold text-ink-secondary">Fin<input aria-label={`Fin del ${days.find((day) => day.id === item.day)?.label}`} type="time" value={item.end} onChange={(event) => updateDay(item.day, { end: event.target.value as TimeBlock['end'] })} className={`${inputClass} mt-1 min-h-9`} /></label></div> : null}
          </div>)}
        </div>
        <FormField htmlFor="recommendation-commute" label="Tiempo de desplazamiento" hint="Se usa para detectar riesgos entre la oficina y una clase presencial."><div className="relative"><input id="recommendation-commute" type="number" min="0" value={commuteMinutes} onChange={(event) => { const value = Math.max(0, Number(event.target.value)); setCommuteMinutes(value); setSchedule(buildSchedule(preferences, value, anchorDay)) }} className={`${inputClass} pr-20`} /><span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-ink-soft">minutos</span></div></FormField>
        <button type="button" onClick={applyDemo} className="flex w-full items-center justify-between rounded-md border border-indigo-200 bg-indigo-50 px-4 py-3 text-left transition hover:bg-indigo-100"><span><span className="block text-xs font-bold uppercase tracking-wider text-brand-indigo">Respuesta rápida</span><span className="mt-1 block text-sm font-bold text-brand-navy">Trabajo de lunes a viernes, de 6:00 a. m. a 2:00 p. m.</span></span><Sparkles aria-hidden="true" className="h-5 w-5 shrink-0 text-brand-indigo" /></button>
      </section>
      <section>
        <div className="mb-3 flex items-center justify-between"><div><h2 className="font-bold text-brand-navy">Tu semana en una mirada</h2><p className="mt-1 text-sm text-ink-secondary">Office y remoto siguen siendo jornadas laborales; libre deja el día disponible.</p></div><StatusBadge status="work" /></div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">{preferences.map((item) => <div key={item.day} className={`min-h-28 rounded-md border p-3 ${modeClasses[item.workMode]}`}><p className="text-xs font-black uppercase tracking-wider">{days.find((day) => day.id === item.day)?.short}</p><div className="mt-5 flex items-center gap-2 text-sm font-bold">{item.workMode === 'off' ? <Circle aria-hidden="true" className="h-4 w-4" /> : <Clock3 aria-hidden="true" className="h-4 w-4" />} {modeLabels[item.workMode]}</div>{item.workMode !== 'off' ? <p className="mt-1 text-xs">{formatTime(item.start)} – {formatTime(item.end)}</p> : <p className="mt-1 text-xs">Disponible</p>}</div>)}</div>
        <div className="mt-6 border-t border-slate-200 pt-5"><label htmlFor="anchor-day" className="flex items-center gap-2 text-sm font-bold text-brand-navy"><MapPin aria-hidden="true" className="h-4 w-4 text-brand-turquoise" />Día ancla para clases presenciales</label><select id="anchor-day" value={anchorDay ?? ''} onChange={(event) => { const next = (event.target.value || undefined) as Day | undefined; setAnchorDay(next); setSchedule(buildSchedule(preferences, commuteMinutes, next)) }} className={`${inputClass} mt-2`}><option value="">No tengo preferencia</option>{days.map((day) => <option key={day.id} value={day.id}>{day.label}</option>)}</select><p className="mt-2 flex items-start gap-2 text-xs leading-5 text-ink-secondary"><Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-indigo" />Priorizaremos grupos presenciales que incluyan ese día. No bloquea otras opciones compatibles.</p></div>
      </section>
    </div>
    {error ? <p role="alert" className="mt-5 rounded-md bg-red-50 p-3 text-sm font-medium text-status-danger">{error}</p> : null}
    <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6"><BackButton /><Button onClick={submit}>Continuar con mis materias <ArrowRight aria-hidden="true" className="h-4 w-4" /></Button></div>
  </Page>
}

type RecommendationRequest = { studentId: string; maxCredits: number; workSchedule: WorkSchedule; selectedCourseIds?: string[] }

async function requestRecommendations(body: RecommendationRequest): Promise<RecommendationResponse> {
  const response = await fetch('/api/recommendations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, preferences: { anchorDay: body.workSchedule.anchorDay } }) })
  const payload = await response.json() as RecommendationResponse | { error?: { message?: string } }
  if (!response.ok) throw new Error(('error' in payload && payload.error?.message) || 'No pudimos actualizar las recomendaciones.')
  return payload as RecommendationResponse
}

function recommendationStatus(item: IndividualRecommendation) {
  switch (item.classification) {
    case 'compatible': return { label: 'Compatible', icon: CheckCircle2, classes: 'text-status-success bg-emerald-50' }
    case 'risk': return { label: 'Revisar desplazamiento', icon: AlertTriangle, classes: 'text-status-warning bg-amber-50' }
    case 'blocked_prerequisite': return { label: 'Prerequisito pendiente', icon: LockKeyhole, classes: 'text-slate-600 bg-slate-100' }
    case 'no_seats': return { label: 'Sin cupos', icon: Users, classes: 'text-status-danger bg-red-50' }
    case 'conflict': return { label: 'Cruza con tu trabajo', icon: XCircle, classes: 'text-status-danger bg-red-50' }
    default: return { label: 'No disponible', icon: XCircle, classes: 'text-slate-600 bg-slate-100' }
  }
}

function groupSummary(group: CourseGroup | undefined) {
  if (!group) return 'Grupo por revisar'
  const modality = group.modality === 'virtual' ? 'Virtual' : group.modality === 'mixta' ? 'Mixta' : 'Presencial'
  const blocks = group.blocks.map((block) => `${days.find((day) => day.id === block.day)?.short} ${formatTime(block.start)}–${formatTime(block.end)}`).join(' · ')
  return `${group.label} · ${modality} · ${blocks}`
}

function RecommendationRow({ item, course, selected, onToggle, catalogGroups }: { item: IndividualRecommendation; course: Course | undefined; selected: boolean; onToggle: () => void; catalogGroups: CourseGroup[] }) {
  const status = recommendationStatus(item)
  const Icon = status.icon
  const selectable = item.prerequisiteStatus.eligible && (item.classification === 'compatible' || item.classification === 'risk') && item.compatibleGroups.length > 0
  const bestGroup = catalogGroups.find((group) => group.id === item.compatibleGroups[0]?.groupId) ?? catalogGroups.find((group) => group.courseId === item.courseId)
  return <div className={`border-b border-slate-200 py-5 last:border-0 ${!selectable ? 'opacity-80' : ''}`}>
    <div className="flex items-start gap-4">
      <button type="button" disabled={!selectable} onClick={onToggle} aria-label={`${selected ? 'Quitar' : 'Seleccionar'} ${item.name}`} className={`mt-1 shrink-0 rounded-full ${selectable ? 'text-brand-indigo' : 'cursor-not-allowed text-slate-300'}`}>{selected ? <CheckCircle2 aria-hidden="true" className="h-6 w-6" /> : <Circle aria-hidden="true" className="h-6 w-6" />}</button>
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-bold text-brand-navy">{item.name}</h3><p className="mt-1 text-xs text-ink-soft">{course?.code ?? 'Código por confirmar'} · {item.credits} créditos · semestre {item.semester}</p></div><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${status.classes}`}><Icon aria-hidden="true" className="h-3.5 w-3.5" />{status.label}</span></div><p className="mt-3 text-sm leading-6 text-ink-secondary">{item.reason}</p>{bestGroup ? <p className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-brand-navy"><MapPin aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-turquoise" />Grupo recomendado: {groupSummary(bestGroup)}</p> : null}<p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft"><span>{item.prerequisiteStatus.required.length ? `Prerequisito: ${item.prerequisiteStatus.required.join(', ')}` : 'Sin prerrequisitos registrados'}</span><span>{bestGroup ? `${bestGroup.seatsLeft} cupos disponibles` : 'Cupos por confirmar'}</span></p>{!selectable && item.classification === 'blocked_prerequisite' ? <p className="mt-2 text-xs font-semibold text-slate-600">No es seleccionable hasta que cumplas el prerrequisito.</p> : null}</div>
    </div>
  </div>
}

export function AcademicRecommendationsScreen() {
  const router = useRouter()
  const catalog = useSemesterStore((state) => state.catalog)
  const profile = useSemesterStore((state) => state.profile)
  const schedule = useSemesterStore((state) => state.workSchedule)
  const savedSelected = useSemesterStore((state) => state.selectedCourseIds)
  const savedRecommendations = useSemesterStore((state) => state.recommendations)
  const savedMaxCredits = useSemesterStore((state) => state.recommendationMaxCredits)
  const setSelectedCourseIds = useSemesterStore((state) => state.setSelectedCourseIds)
  const setSelectedGroupIds = useSemesterStore((state) => state.setSelectedGroupIds)
  const setFinalPlan = useSemesterStore((state) => state.setFinalPlan)
  const setRecommendations = useSemesterStore((state) => state.setRecommendations)
  const setRecommendationMaxCredits = useSemesterStore((state) => state.setRecommendationMaxCredits)
  const setNotice = useSemesterStore((state) => state.setNotice)
  const [result, setResult] = useState<RecommendationResponse | null>(savedRecommendations)
  const [selected, setSelected] = useState<string[]>(savedSelected)
  const [maxCredits, setMaxCredits] = useState(savedMaxCredits || 12)
  const [loading, setLoading] = useState(!savedRecommendations)
  const [error, setError] = useState('')
  const [planning, setPlanning] = useState(false)
  const currentSemester = Number(profile.semester || 5)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const next = await requestRecommendations({ studentId: 'camilo-ospina', maxCredits, workSchedule: schedule })
      setResult(next)
      setRecommendations(next)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No pudimos cargar las recomendaciones.')
    } finally {
      setLoading(false)
    }
  }, [maxCredits, schedule, setRecommendations])

  useEffect(() => { void load() }, [load])

  const byId = useMemo(() => new Map(catalog.courses.map((course) => [course.id, course])), [catalog.courses])
  const groups = catalog.groups
  const current = result?.recommendations.filter((item) => item.semester <= currentSemester) ?? []
  const future = result?.recommendations.filter((item) => item.semester > currentSemester) ?? []
  const selectedCredits = selected.reduce((total, id) => total + (byId.get(id)?.credits ?? 0), 0)

  const toggle = (courseId: string) => {
    const next = selected.includes(courseId) ? selected.filter((id) => id !== courseId) : [...selected, courseId]
    const credits = next.reduce((total, id) => total + (byId.get(id)?.credits ?? 0), 0)
    if (credits > maxCredits) {
      setNotice({ type: 'info', message: `Tu selección supera el límite de ${maxCredits} créditos. Quita una materia para continuar.` })
      return
    }
    setSelected(next)
    setSelectedCourseIds(next)
  }

  const buildPlan = async (courseIds: string[]) => {
    setPlanning(true)
    setError('')
    try {
      const next = await requestRecommendations({ studentId: 'camilo-ospina', maxCredits, workSchedule: schedule, selectedCourseIds: courseIds })
      setResult(next)
      setRecommendations(next)
      setSelectedCourseIds(next.plan.selectedCourseIds)
      setSelectedGroupIds(next.plan.selectedGroupIds)
      setFinalPlan({ groupIds: next.plan.selectedGroupIds, courseIds: next.plan.selectedCourseIds, credits: next.plan.credits, conflicts: [], isValid: true })
      setNotice({ type: 'success', message: next.plan.credits ? 'Encontramos una combinación sin choques para tu horario.' : 'No encontramos una combinación con estos criterios.' })
      if (next.plan.credits) router.push('/armador')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No pudimos armar la combinación. Puedes reintentar.')
    } finally {
      setPlanning(false)
    }
  }

  const useBestPlan = () => void buildPlan(selected.length ? selected : (result?.plan.selectedCourseIds ?? []))
  const renderSection = (title: string, description: string, items: IndividualRecommendation[]) => <section className="border-b border-slate-200 pb-2"><div className="mb-2"><h2 className="text-lg font-bold text-brand-navy">{title}</h2><p className="mt-1 text-sm text-ink-secondary">{description}</p></div>{items.length ? items.map((item) => <RecommendationRow key={item.courseId} item={item} course={byId.get(item.courseId)} selected={selected.includes(item.courseId)} onToggle={() => toggle(item.courseId)} catalogGroups={groups} />) : <p className="py-5 text-sm text-ink-secondary">No encontramos materias en esta categoría con la oferta actual.</p>}</section>

  return <Page step="/materias" eyebrow="Momento 4 · Recomendación académica" title="Materias que puedes adelantar" description="Cruzamos tu jornada, tus prerrequisitos y los cupos disponibles para mostrarte opciones que tienen sentido para este semestre.">
    <div className="mb-6 flex flex-wrap items-center gap-3"><span className="text-sm text-ink-secondary">Semestre actual: {currentSemester} · {schedule.anchorDay ? `día ancla: ${days.find((day) => day.id === schedule.anchorDay)?.label}` : 'sin día ancla'}</span></div>
    <div className="mb-6 grid gap-4 border-b border-slate-200 pb-6 md:grid-cols-[1fr_200px] md:items-end"><div><p className="text-sm font-bold text-brand-navy">Ajusta el límite de tu plan</p><p className="mt-1 text-sm text-ink-secondary">El recomendador prioriza más créditos sin cruzar tus clases.</p></div><FormField htmlFor="max-credits" label="Máximo de créditos"><input id="max-credits" type="number" min="1" max="60" value={maxCredits} onChange={(event) => { const value = Math.min(60, Math.max(1, Number(event.target.value))); setMaxCredits(value); setRecommendationMaxCredits(value) }} className={inputClass} /></FormField></div>
    {loading ? <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div> : error ? <EmptyState title="No pudimos actualizar tus recomendaciones" message={error} action={<Button onClick={() => void load()}>Reintentar</Button>} /> : <div className="grid gap-8 lg:grid-cols-[1fr_300px]"><div className="space-y-8">{renderSection('Para tu semestre actual', 'Materias que puedes considerar ahora si hay un grupo que encaje.', current)}{renderSection('Para más adelante', 'Opciones de otros semestres para que conozcas tu ruta. Las bloqueadas por prerrequisito no se pueden seleccionar.', future)}</div><aside className="h-fit border-l border-slate-200 pl-0 lg:sticky lg:top-24 lg:pl-6"><p className="text-xs font-bold uppercase tracking-wider text-ink-soft">Tu selección</p><p className="mt-2 text-3xl font-black text-brand-navy">{selectedCredits} <span className="text-sm font-semibold text-ink-soft">/ {maxCredits} créditos</span></p><p className="mt-2 text-sm leading-6 text-ink-secondary">Selecciona materias y armamos la mejor combinación posible para tu semana.</p>{result?.plan.credits ? <div className="mt-5 border-t border-slate-200 pt-5"><div className="flex items-center gap-2 text-sm font-bold text-status-success"><CheckCircle2 aria-hidden="true" className="h-4 w-4" />Plan sugerido: {result.plan.credits} créditos</div><ul className="mt-3 space-y-2">{result.plan.selectedGroupIds.map((groupId) => { const group = groups.find((item) => item.id === groupId); return group ? <li key={group.id} className="text-xs leading-5 text-brand-navy"><span className="font-bold">{byId.get(group.courseId)?.name}</span><span className="block text-ink-secondary">{groupSummary(group)}</span></li> : null })}</ul><p className="mt-3 text-xs leading-5 text-ink-secondary">{result.plan.explanation}</p></div> : null}<Button className="mt-6 w-full" onClick={useBestPlan} loading={planning} disabled={!selected.length && !result?.plan.selectedCourseIds.length}><Sparkles aria-hidden="true" className="h-4 w-4" />Armar la mejor combinación</Button><div className="mt-5 flex items-start gap-2 text-xs leading-5 text-ink-soft"><Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />Puedes ajustar los grupos en el armador.</div></aside></div>}
    <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6"><BackButton /><Button variant="ghost" onClick={() => router.push('/compatibilidad')}>Revisar compatibilidad detallada <ArrowRight aria-hidden="true" className="h-4 w-4" /></Button></div>
  </Page>
}
