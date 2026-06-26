import { useMemo } from 'react'
import { format, addDays } from 'date-fns'
import { useClasses } from './useClasses'
import { useGrades } from './useGrades'
import { useSessions } from './useSessions'
import { useAvailability } from './useAvailability'

export interface ClassSummary {
  classId: string
  className: string
  classTypeName: string
  servantCount: number
  nextSessionDate: string | null
  nextSessionTopic: string | null
}

export interface StaffingGap {
  date: string
  classId: string
  className: string
  availableCount: number
  totalCount: number
}

export function useCoordinatorStats() {
  const TODAY = format(new Date(), 'yyyy-MM-dd')

  const { classes, classTypes, loading: classesLoading, error: classesError, refetch: refetchClasses } = useClasses()
  const { grades, loading: gradesLoading, error: gradesError, refetch: refetchGrades } = useGrades()
  const { sessions, loading: sessionsLoading, error: sessionsError, refetch: refetchSessions } = useSessions()
  const { loading: availLoading, error: availError, refetch: refetchAvail, getUnavailableServantsForDate } = useAvailability()

  const loading = classesLoading || gradesLoading || sessionsLoading || availLoading
  const error = classesError || gradesError || sessionsError || availError

  const totalStudents = useMemo(() => {
    return grades.reduce((sum, g) => sum + (g.student_count || 0), 0)
  }, [grades])

  const totalClasses = classes.length

  const overallAttendanceRate = useMemo(() => {
    const ratedGrades = grades.filter(g => g.recent_attendance_rate != null)
    if (ratedGrades.length === 0) return 0
    const sum = ratedGrades.reduce((acc, g) => acc + (g.recent_attendance_rate || 0), 0)
    return Math.round(sum / ratedGrades.length)
  }, [grades])

  const classSummaries = useMemo((): ClassSummary[] => {
    return classes.map(cls => {
      const classType = classTypes.find(ct => ct.id === cls.classTypeId)
      const upcomingSessions = sessions
        .filter(s => s.classId === cls.id && s.date >= TODAY && s.status !== 'canceled')
        .sort((a, b) => a.date.localeCompare(b.date))
      const next = upcomingSessions[0] || null

      return {
        classId: cls.id,
        className: cls.name,
        classTypeName: classType?.name || '',
        servantCount: cls.servantIds.length,
        nextSessionDate: next?.date || null,
        nextSessionTopic: next?.lessonTopic || null,
      }
    })
  }, [classes, classTypes, sessions, TODAY])

  const upcomingGaps = useMemo((): StaffingGap[] => {
    const gaps: StaffingGap[] = []
    const endDate = new Date(TODAY + 'T12:00:00')
    endDate.setDate(endDate.getDate() + 14)
    const endStr = format(endDate, 'yyyy-MM-dd')

    const upcomingSessions = sessions.filter(
      s => s.date >= TODAY && s.date <= endStr && s.status !== 'canceled'
    )

    // Deduplicate by class+date
    const seen = new Set<string>()
    for (const s of upcomingSessions) {
      const key = `${s.classId}:${s.date}`
      if (seen.has(key)) continue
      seen.add(key)

      const cls = classes.find(c => c.id === s.classId)
      if (!cls) continue

      const unavailableIds = getUnavailableServantsForDate(s.date, cls.servantIds)
      const availableCount = cls.servantIds.length - unavailableIds.length

      if (availableCount <= 2) {
        gaps.push({
          date: s.date,
          classId: cls.id,
          className: cls.name,
          availableCount,
          totalCount: cls.servantIds.length,
        })
      }
    }

    return gaps.sort((a, b) => a.date.localeCompare(b.date))
  }, [sessions, classes, getUnavailableServantsForDate])

  function refetch() {
    refetchClasses()
    refetchGrades()
    refetchSessions()
    refetchAvail()
  }

  return {
    totalStudents,
    totalClasses,
    overallAttendanceRate,
    grades,
    classSummaries,
    upcomingGaps,
    loading,
    error,
    refetch,
  }
}
