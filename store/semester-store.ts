'use client'

import { create } from 'zustand'
import { clearSession, readSession, writeSession } from '@/lib/storage'
import type { Catalog, CompatibilityResponse, Plan, RecommendationResponse, WorkSchedule } from '@/lib/api/contracts'
import { DEMO_CATALOG, DEMO_PROFILE, DEMO_SUGGESTION, DEMO_WORK_SCHEDULE } from './demo-data'

export type Profile = { name: string; email: string; university: string; program: string; semester: string }
type Notice = { type: 'success' | 'info' | 'error'; message: string } | null

type SemesterState = {
  profile: Profile
  workSchedule: WorkSchedule
  selectedCourseIds: string[]
  selectedGroupIds: string[]
  compatibility: CompatibilityResponse | null
  finalPlan: Plan | null
  recommendations: RecommendationResponse | null
  recommendationMaxCredits: number
  demoMode: boolean
  sessionActive: boolean
  hydrated: boolean
  notice: Notice
  catalog: Catalog
  setProfile: (profile: Profile) => void
  startSession: (email: string) => void
  setWorkSchedule: (schedule: WorkSchedule) => void
  setSelectedCourseIds: (ids: string[]) => void
  setSelectedGroupIds: (ids: string[]) => void
  setCompatibility: (value: CompatibilityResponse | null) => void
  setFinalPlan: (plan: Plan | null) => void
  setRecommendations: (value: RecommendationResponse | null) => void
  setRecommendationMaxCredits: (value: number) => void
  setNotice: (notice: Notice) => void
  loadDemo: () => void
  hydrate: () => void
  reset: () => void
}

const emptyProfile: Profile = { name: '', email: '', university: '', program: '', semester: '' }
const emptySchedule: WorkSchedule = { blocks: [], commuteMinutes: 0 }
const initialValues = { profile: emptyProfile, workSchedule: emptySchedule, selectedCourseIds: [] as string[], selectedGroupIds: [] as string[], compatibility: null, finalPlan: null, recommendations: null, recommendationMaxCredits: 12, demoMode: false, sessionActive: false }

function persist(state: SemesterState) {
  writeSession({ profile: state.profile, workSchedule: state.workSchedule, selectedCourseIds: state.selectedCourseIds, selectedGroupIds: state.selectedGroupIds, compatibility: state.compatibility, finalPlan: state.finalPlan, recommendations: state.recommendations, recommendationMaxCredits: state.recommendationMaxCredits, demoMode: state.demoMode, sessionActive: state.sessionActive })
}

export const useSemesterStore = create<SemesterState>((set, get) => ({
  ...initialValues,
  catalog: DEMO_CATALOG,
  hydrated: false,
  notice: null,
  setProfile: (profile) => { set({ profile }); persist({ ...get(), profile }) },
  startSession: (email) => {
    const profile = { ...get().profile, email }
    set({ profile, sessionActive: true })
    persist({ ...get(), profile, sessionActive: true })
  },
  setWorkSchedule: (workSchedule) => { set({ workSchedule }); persist({ ...get(), workSchedule }) },
  setSelectedCourseIds: (selectedCourseIds) => { set({ selectedCourseIds }); persist({ ...get(), selectedCourseIds }) },
  setSelectedGroupIds: (selectedGroupIds) => { set({ selectedGroupIds }); persist({ ...get(), selectedGroupIds }) },
  setCompatibility: (compatibility) => { set({ compatibility }); persist({ ...get(), compatibility }) },
  setFinalPlan: (finalPlan) => { set({ finalPlan }); persist({ ...get(), finalPlan }) },
  setRecommendations: (recommendations) => { set({ recommendations }); persist({ ...get(), recommendations }) },
  setRecommendationMaxCredits: (recommendationMaxCredits) => { set({ recommendationMaxCredits }); persist({ ...get(), recommendationMaxCredits }) },
  setNotice: (notice) => set({ notice }),
  loadDemo: () => {
    const demo = { profile: DEMO_PROFILE, workSchedule: DEMO_WORK_SCHEDULE, selectedCourseIds: ['estadistica-aplicada', ...(DEMO_SUGGESTION.plan?.courseIds ?? [])], selectedGroupIds: ['bases-datos-ii-g1', 'ingenieria-requisitos-g1', 'desarrollo-web-g1', 'ingles-v-g1'], compatibility: null, finalPlan: null, recommendations: null, recommendationMaxCredits: 12, demoMode: true, sessionActive: true }
    set(demo)
    persist({ ...get(), ...demo })
  },
  hydrate: () => { const saved = readSession<Partial<SemesterState>>(); if (saved) set({ ...initialValues, ...saved, catalog: DEMO_CATALOG, hydrated: true }); else set({ hydrated: true }) },
  reset: () => { clearSession(); set({ ...initialValues, catalog: DEMO_CATALOG, hydrated: true, notice: { type: 'info', message: 'Plan reiniciado. Puedes empezar de nuevo cuando quieras.' } }) },
}))

export function serializePlan(plan: Plan | null) { return plan ? JSON.stringify(plan) : '' }
