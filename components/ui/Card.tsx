import { cn } from './utils'

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn('rounded-lg border border-slate-200 bg-white shadow-card', className)} {...props}>{children}</div> }
export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn('border-b border-slate-100 px-6 py-5', className)} {...props}>{children}</div> }
export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn('px-6 py-5', className)} {...props}>{children}</div> }
