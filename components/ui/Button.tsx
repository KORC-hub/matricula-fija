import { forwardRef } from 'react'
import { LoaderCircle } from 'lucide-react'
import { cn } from './utils'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; loading?: boolean; size?: 'sm' | 'md' | 'lg' }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant = 'primary', loading, disabled, size = 'md', children, ...props }, ref) {
  return <button ref={ref} disabled={disabled || loading} className={cn('inline-flex flex-row whitespace-nowrap items-center justify-center gap-2 rounded-md font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-50', { 'bg-brand-indigo px-5 py-3 text-white shadow-soft hover:bg-brand-navy': variant === 'primary', 'border border-slate-300 bg-white px-5 py-3 text-brand-navy hover:border-brand-indigo hover:bg-indigo-50': variant === 'secondary', 'px-3 py-2 text-ink-secondary hover:bg-slate-100 hover:text-brand-navy': variant === 'ghost', 'bg-red-700 px-5 py-3 text-white hover:bg-red-800': variant === 'danger', 'min-h-9 text-sm': size === 'sm', 'min-h-11 text-sm': size === 'md', 'min-h-14 text-base': size === 'lg' }, className)} {...props}>{loading ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}<span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap">{children}</span></button>
})
