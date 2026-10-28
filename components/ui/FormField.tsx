import { cn } from './utils'

type FormFieldProps = { label: string; hint?: string; error?: string; htmlFor: string; children: React.ReactNode; className?: string }
export function FormField({ label, hint, error, htmlFor, children, className }: FormFieldProps) { return <div className={cn('space-y-2', className)}><label htmlFor={htmlFor} className="block text-sm font-semibold text-ink-primary">{label}</label>{children}{hint && !error ? <p id={`${htmlFor}-hint`} className="text-xs leading-5 text-ink-soft">{hint}</p> : null}{error ? <p id={`${htmlFor}-error`} role="alert" className="text-sm font-medium text-status-danger">{error}</p> : null}</div> }
export const inputClass = 'min-h-12 w-full rounded-md border border-slate-300 bg-white px-3.5 text-ink-primary shadow-sm transition placeholder:text-slate-400 focus:border-brand-indigo focus:outline-none focus:ring-4 focus:ring-indigo-100'
