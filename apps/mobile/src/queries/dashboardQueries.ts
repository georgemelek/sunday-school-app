/**
 * React Query hooks for the Dashboard screen.
 *
 * staleTime: 5 min — switching tabs and returning immediately shows cached data
 * with no loading spinner and no extra DB call. A background re-fetch only
 * happens when the cache is actually stale.
 *
 * To invalidate after a write (e.g. onboarding creates sessions):
 *   import { queryClient } from '../lib/queryClient'
 *   import { dashboardKeys } from '../queries/dashboardQueries'
 *   queryClient.invalidateQueries({ queryKey: ['dashboard'] })
 *
 * Other screens still use the old useState/useEffect hooks — migrate them
 * to React Query as part of the broader S.13 integration work.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { TABLES } from '../lib/tables'
import type { ClassInfo, ClassType, Servant } from '../hooks/useClasses'
import type { Session } from '../hooks/useSessions'
import type { AvailabilityRecord } from '../hooks/useAvailability'
import { ALL_MOCK_SESSIONS_EXPORT } from '../hooks/useSessions'
import { ALL_MOCK_AVAILABILITY_EXPORT } from '../hooks/useAvailability'
import { MOCK_CLASSES, MOCK_CLASS_TYPES, MOCK_SERVANTS } from '../data/mockData'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const dashboardKeys = {
  all: ['dashboard'] as const,
  classes: (profileId: string) => ['dashboard', 'classes', profileId] as const,
  sessions: (classIds: string[]) => ['dashboard', 'sessions', classIds.slice().sort().join(',')] as const,
  availability: (profileId: string) => ['dashboard', 'availability', profileId] as const,
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchClasses(profileId: string): Promise<{
  classes: ClassInfo[]
  classTypes: ClassType[]
  servants: Servant[]
}> {
  const [{ data: ctData, error: ctError }, { data: csData, error: csError }] = await Promise.all([
    supabase.from(TABLES.CLASS_TYPES).select('id, name'),
    supabase.from(TABLES.CLASS_SERVANTS).select('class_id').eq('servant_id', profileId),
  ])
  if (ctError) throw ctError
  if (csError) throw csError

  const myClassIds = (csData ?? []).map((r: any) => r.class_id as string)
  if (myClassIds.length === 0) {
    return { classes: [], classTypes: (ctData ?? []) as ClassType[], servants: [] }
  }

  const { data: classData, error: classError } = await supabase
    .from(TABLES.CLASSES)
    .select(`
      id, name, class_type_id, day_of_week, start_time, end_time, default_location,
      class_grades(grade_id),
      class_servants(servant_id)
    `)
    .in('id', myClassIds)
  if (classError) throw classError

  const classes: ClassInfo[] = (classData ?? []).map((c: any) => ({
    id: c.id,
    classTypeId: c.class_type_id ?? '',
    name: c.name,
    description: '',
    defaultLocation: c.default_location ?? '',
    defaultLocationAddress: '',
    defaultDayOfWeek: c.day_of_week ?? 0,
    defaultStartTime: c.start_time ?? '',
    defaultEndTime: c.end_time ?? '',
    servantIds: (c.class_servants ?? []).map((cs: any) => cs.servant_id as string),
    gradeIds: (c.class_grades ?? []).map((cg: any) => cg.grade_id as string),
  }))

  const allServantIds = [...new Set(classes.flatMap(c => c.servantIds))]
  let servants: Servant[] = []
  if (allServantIds.length > 0) {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', allServantIds)
    if (profileError) throw profileError
    servants = (profileData ?? []).map((p: any) => ({
      id: p.id,
      fullName: p.full_name ?? p.id,
    }))
  }

  return { classes, classTypes: (ctData ?? []) as ClassType[], servants }
}

async function fetchSessions(classIds: string[]): Promise<Session[]> {
  if (classIds.length === 0) return []

  const { data, error } = await supabase
    .from(TABLES.SESSIONS)
    .select('*')
    .in('class_id', classIds)
    .order('date', { ascending: true })
  if (error) throw error

  return (data ?? []).map((row: any) => ({
    id: row.id,
    classId: row.class_id ?? '',
    date: row.date,
    startTime: row.start_time ?? '',
    endTime: row.end_time ?? '',
    locationName: row.location_name ?? 'TBD',
    locationAddress: row.location_address ?? '',
    lessonTopic: row.lesson_topic ?? 'TBD',
    lessonPage: row.lesson_page ?? '',
    lessonReference: row.lesson_reference ?? '',
    lessonServantId: row.lesson_servant_id ?? null,
    lessonServantName: row.lesson_servant_name ?? '',
    classAdminId: row.class_admin_id ?? null,
    notes: row.notes ?? '',
    status: (row.status ?? 'scheduled') as Session['status'],
  }))
}

async function fetchAvailability(): Promise<AvailabilityRecord[]> {
  const { data, error } = await supabase
    .from(TABLES.SERVANT_AVAILABILITY)
    .select('*')
    .order('date', { ascending: true })
  if (error) throw error

  return (data ?? []).map((row: any) => ({
    id: row.id,
    servantId: row.servant_id,
    date: row.date,
    available: row.available,
    notes: row.notes ?? '',
  }))
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useClassesQuery(profileId: string | undefined, isTourMode: boolean) {
  return useQuery({
    queryKey: profileId ? dashboardKeys.classes(profileId) : ['dashboard', 'classes', '__tour__'],
    queryFn: async () => {
      if (isTourMode) {
        await new Promise(r => setTimeout(r, 300))
        return { classes: MOCK_CLASSES, classTypes: MOCK_CLASS_TYPES, servants: MOCK_SERVANTS }
      }
      if (!profileId) return { classes: [], classTypes: [], servants: [] }
      return fetchClasses(profileId)
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}

export function useSessionsQuery(classIds: string[], enabled: boolean, isTourMode: boolean) {
  return useQuery({
    queryKey: dashboardKeys.sessions(classIds),
    queryFn: async () => {
      if (isTourMode) {
        await new Promise(r => setTimeout(r, 300))
        return classIds.length > 0
          ? ALL_MOCK_SESSIONS_EXPORT.filter(s => classIds.includes(s.classId))
          : ALL_MOCK_SESSIONS_EXPORT
      }
      return fetchSessions(classIds)
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}

export function useAvailabilityQuery(profileId: string | undefined, isTourMode: boolean) {
  return useQuery({
    queryKey: profileId ? dashboardKeys.availability(profileId) : ['dashboard', 'availability', '__tour__'],
    queryFn: async () => {
      if (isTourMode) {
        await new Promise(r => setTimeout(r, 300))
        return ALL_MOCK_AVAILABILITY_EXPORT
      }
      if (!profileId) return []
      return fetchAvailability()
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}
