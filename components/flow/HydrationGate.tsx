'use client'

import { useEffect } from 'react'
import { useSemesterStore } from '@/store/semester-store'
import { Skeleton } from '@/components/ui/Skeleton'

export function HydrationGate({ children }: { children: React.ReactNode }) {
  const hydrated = useSemesterStore((state) => state.hydrated)
  const hydrate = useSemesterStore((state) => state.hydrate)
  useEffect(() => { if (!hydrated) hydrate() }, [hydrate, hydrated])
  if (!hydrated) return <div className="min-h-screen bg-surface-page p-6"><div className="mx-auto max-w-6xl"><Skeleton className="mb-12 h-8 w-44" /><Skeleton className="h-[420px] w-full rounded-lg" /></div></div>
  return children
}
