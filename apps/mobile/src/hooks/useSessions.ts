import { useState, useEffect, useCallback } from 'react'
import { useTour } from '../contexts/TourContext'
import { supabase } from '../lib/supabase'
import { TABLES } from '../lib/tables'

export interface Session {
  id: string
  classId: string
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  locationName: string
  locationAddress: string
  lessonTopic: string
  lessonPage: string
  lessonReference: string
  lessonServantId: string | null
  classAdminId: string | null
  notes: string
  status: 'scheduled' | 'canceled' | 'completed'
}

// Map DB row → Session interface
function rowToSession(row: any): Session {
  return {
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
    classAdminId: row.class_admin_id ?? null,
    notes: row.notes ?? '',
    status: (row.status ?? 'scheduled') as Session['status'],
  }
}

// --- Mock session data (from real 6th grade curriculum CSV) ---

const TODAY = '2026-02-23'

function buildMockSessions(): Session[] {
  const sessions: Session[] = []
  let id = 1

  // Helper to determine status based on date relative to "today" (Feb 23, 2026)
  function status(date: string, canceled = false): 'scheduled' | 'canceled' | 'completed' {
    if (canceled) return 'canceled'
    return date < TODAY ? 'completed' : 'scheduled'
  }

  // Sunday School sessions (class-1) — from the real curriculum CSV
  const sundaySchool: Array<{
    date: string
    topic: string
    page: string
    servantId: string | null
    adminId: string | null
    notes?: string
    canceled?: boolean
  }> = [
    { date: '2025-08-31', topic: 'Class Saint', page: '', servantId: 'servant-5', adminId: 'servant-5', notes: 'Nayrouz' },
    { date: '2025-09-07', topic: 'Studying the Bible: What is the Bible', page: '8', servantId: null, adminId: 'servant-6' },
    { date: '2025-09-21', topic: 'The Old Testament Sections, Books, and Writers', page: '16', servantId: 'servant-8', adminId: 'servant-8' },
    { date: '2025-09-28', topic: 'The New Testament Sections, Books, and Writers', page: '18', servantId: 'servant-2', adminId: 'servant-2', notes: 'Feast of the Cross (27-29)' },
    { date: '2025-10-05', topic: 'Introduction to Apologetics: How Do I Know God Exists?', page: '24', servantId: 'servant-4', adminId: 'servant-4' },
    { date: '2025-10-12', topic: 'Why Did God Create the World?', page: '26', servantId: 'servant-1', adminId: 'servant-1' },
    { date: '2025-10-26', topic: "God's Love and the Fall", page: '28', servantId: 'servant-5', adminId: 'servant-5' },
    { date: '2025-11-02', topic: 'The Ten Virgins', page: '31', servantId: 'servant-6', adminId: 'servant-6' },
    { date: '2025-11-09', topic: 'A Helping Hand: The Good Samaritan', page: '33', servantId: 'servant-7', adminId: 'servant-7' },
    { date: '2025-11-16', topic: 'Humble: As The Fertile Ground - St. Moses', page: '35', servantId: 'servant-1', adminId: 'servant-1' },
    { date: '2025-11-23', topic: 'Courageous: Daniel Prayers from the Window', page: '39', servantId: 'servant-2', adminId: 'servant-2' },
    { date: '2025-11-30', topic: 'Zealous for God: Christ Cleanses the Temple Twice', page: '43', servantId: 'servant-4', adminId: 'servant-4' },
    { date: '2025-12-14', topic: 'Generous: Tithing - The Rich Man and Lazarus', page: '45', servantId: 'servant-1', adminId: 'servant-1' },
    { date: '2025-12-21', topic: 'In Control: Dangers of Social Media', page: '47', servantId: 'servant-3', adminId: 'servant-3' },
    { date: '2025-12-28', topic: 'Pure in a Fallen World: Joseph', page: '49', servantId: 'servant-5', adminId: 'servant-5' },
    { date: '2026-01-04', topic: 'How to Repent? Start a New Start with Jesus', page: '', servantId: 'servant-7', adminId: 'servant-7' },
    { date: '2026-01-11', topic: 'The Liturgy, Intro to Sacraments, Baptism and Chrismation', page: '82', servantId: 'servant-2', adminId: 'servant-2' },
    { date: '2026-01-25', topic: 'The Sacrament of the Eucharist', page: '85', servantId: 'servant-4', adminId: 'servant-4', canceled: true, notes: 'Canceled — Snow Storm' },
    { date: '2026-02-01', topic: 'The Sacrament of Repentance and Confession', page: '87', servantId: 'servant-1', adminId: 'servant-1' },
    { date: '2026-02-08', topic: 'Psalms in the Agpeya Prayers', page: '90', servantId: 'servant-3', adminId: 'servant-3' },
    { date: '2026-02-15', topic: 'Psalm 50: A Psalm of Repentance', page: '96', servantId: 'servant-6', adminId: 'servant-6' },
    { date: '2026-02-22', topic: 'The Use of Candles and Incense', page: '103', servantId: 'servant-2', adminId: 'servant-2' },
    { date: '2026-02-23', topic: 'The Sacrament of the Sick (Holy Unction)', page: '108', servantId: 'servant-1', adminId: 'servant-6', notes: 'Makeup class — Monday session' },
    { date: '2026-03-01', topic: 'Priesthood in the Old Testament VS. New Testament', page: '106', servantId: 'servant-3', adminId: 'servant-3' },
    { date: '2026-03-08', topic: 'The Gospel of the Day - The Prodigal Son', page: '', servantId: 'servant-4', adminId: 'servant-4', notes: 'Gospel of the day' },
    { date: '2026-03-15', topic: 'Palm Sunday', page: '', servantId: 'servant-1', adminId: 'servant-1', notes: 'Holy Week Book' },
    { date: '2026-03-22', topic: 'Good Friday', page: '', servantId: 'servant-3', adminId: 'servant-3', notes: 'Holy Week Book' },
    { date: '2026-03-29', topic: 'Talking About the Holy Week: How I Benefit from the Holy Week', page: '', servantId: 'servant-6', adminId: 'servant-6', notes: 'Holy Week Book' },
  ]

  for (const s of sundaySchool) {
    sessions.push({
      id: `session-${id++}`,
      classId: 'class-1',
      date: s.date,
      startTime: '11:30',
      endTime: '12:30',
      locationName: 'St. Mary Coptic Orthodox Church',
      locationAddress: '1233 W Ogden Ave, Naperville, IL 60563',
      lessonTopic: s.topic,
      lessonPage: s.page,
      lessonReference: '',
      lessonServantId: s.servantId,
      classAdminId: s.adminId,
      notes: s.notes || '',
      status: status(s.date, s.canceled),
    })
  }

  // Small Group sessions (class-2) — Tuesdays near "today"
  const smallGroup: Array<{
    date: string
    topic: string
    location: string
    locationAddress: string
  }> = [
    { date: '2026-02-10', topic: 'Small Group Hangout', location: "Andrew's House", locationAddress: '456 Oak St, Naperville, IL 60540' },
    { date: '2026-02-17', topic: 'Small Group Discussion', location: "Daniel's House", locationAddress: '789 Elm St, Naperville, IL 60563' },
    { date: '2026-02-24', topic: 'Small Group Bible Study', location: "Max's House", locationAddress: '321 Maple Ave, Naperville, IL 60565' },
    { date: '2026-03-03', topic: 'Small Group Fellowship', location: "Peter's House", locationAddress: '654 Pine Rd, Naperville, IL 60564' },
    { date: '2026-03-10', topic: 'Small Group Discussion', location: "Andrew's House", locationAddress: '456 Oak St, Naperville, IL 60540' },
  ]

  for (const s of smallGroup) {
    sessions.push({
      id: `session-${id++}`,
      classId: 'class-2',
      date: s.date,
      startTime: '19:00',
      endTime: '20:30',
      locationName: s.location,
      locationAddress: s.locationAddress,
      lessonTopic: s.topic,
      lessonPage: '',
      lessonReference: '',
      lessonServantId: null,
      classAdminId: null,
      notes: '',
      status: status(s.date),
    })
  }

  // FNA sessions (class-3) — Fridays
  const fna: Array<{
    date: string
    topic: string
    location: string
    locationAddress: string
  }> = [
    { date: '2026-02-13', topic: 'Ice Skating', location: 'Fox Valley Ice Arena', locationAddress: '1996 S Kirk Rd, Geneva, IL 60134' },
    { date: '2026-02-27', topic: 'Bowling Night', location: 'Bowlero Naperville', locationAddress: '1515 Aurora Ave, Naperville, IL 60540' },
    { date: '2026-03-06', topic: 'Laser Tag', location: 'WhirlyBall', locationAddress: '3103 Ogden Ave, Lisle, IL 60532' },
    { date: '2026-03-20', topic: 'Movie Night', location: 'AMC Naperville', locationAddress: '2815 Show Pl, Naperville, IL 60564' },
  ]

  for (const s of fna) {
    sessions.push({
      id: `session-${id++}`,
      classId: 'class-3',
      date: s.date,
      startTime: '19:00',
      endTime: '21:00',
      locationName: s.location,
      locationAddress: s.locationAddress,
      lessonTopic: s.topic,
      lessonPage: '',
      lessonReference: '',
      lessonServantId: null,
      classAdminId: null,
      notes: '',
      status: status(s.date),
    })
  }

  return sessions
}

const ALL_MOCK_SESSIONS = buildMockSessions()
export { ALL_MOCK_SESSIONS as ALL_MOCK_SESSIONS_EXPORT }

// classId: single class filter (e.g. from SessionDetail)
// classIds: multiple class filter (e.g. dashboard — pass servant's class ID list)
export function useSessions(classId?: string, classIds?: string[]) {
  const { isTourMode } = useTour()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const classIdsKey = classIds?.join(',')

  useEffect(() => {
    fetchSessions()
  }, [classId, classIdsKey, isTourMode])

  async function fetchSessions() {
    setLoading(true)
    setError(null)

    try {
      if (isTourMode) {
        await new Promise(resolve => setTimeout(resolve, 300))
        let filtered = ALL_MOCK_SESSIONS
        if (classId) filtered = filtered.filter(s => s.classId === classId)
        else if (classIds) filtered = filtered.filter(s => classIds.includes(s.classId))
        setSessions(filtered)
        return
      }

      let query = supabase
        .from(TABLES.SESSIONS)
        .select('*')
        .order('date', { ascending: true })

      if (classId) {
        query = query.eq('class_id', classId)
      } else if (classIds && classIds.length > 0) {
        query = query.in('class_id', classIds)
      } else if (!classId && !classIds) {
        // No filter — caller should pass classIds to scope results
        setSessions([])
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError
      setSessions((data ?? []).map(rowToSession))
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sessions')
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  async function cancelSession(sessionId: string, reason?: string) {
    if (isTourMode) {
      setSessions(prev => prev.map(s =>
        s.id === sessionId
          ? { ...s, status: 'canceled', notes: reason || s.notes }
          : s
      ))
      return { error: null }
    }
    try {
      const { error: updateError } = await supabase
        .from(TABLES.SESSIONS)
        .update({ status: 'canceled', notes: reason || null })
        .eq('id', sessionId)
      if (updateError) throw updateError
      setSessions(prev => prev.map(s =>
        s.id === sessionId
          ? { ...s, status: 'canceled', notes: reason || s.notes }
          : s
      ))
      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  async function updateLessonTopic(sessionId: string, topic: string) {
    if (isTourMode) {
      setSessions(prev => prev.map(s =>
        s.id === sessionId ? { ...s, lessonTopic: topic } : s
      ))
      return { error: null }
    }
    try {
      const { error: updateError } = await supabase
        .from(TABLES.SESSIONS)
        .update({ lesson_topic: topic })
        .eq('id', sessionId)
      if (updateError) throw updateError
      setSessions(prev => prev.map(s =>
        s.id === sessionId ? { ...s, lessonTopic: topic } : s
      ))
      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  async function updateSessionLocation(sessionId: string, locationName: string, locationAddress: string) {
    if (isTourMode) {
      setSessions(prev => prev.map(s =>
        s.id === sessionId ? { ...s, locationName, locationAddress } : s
      ))
      return { error: null }
    }
    try {
      const { error: updateError } = await supabase
        .from(TABLES.SESSIONS)
        .update({ location_name: locationName, location_address: locationAddress })
        .eq('id', sessionId)
      if (updateError) throw updateError
      setSessions(prev => prev.map(s =>
        s.id === sessionId ? { ...s, locationName, locationAddress } : s
      ))
      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  const getUpcomingSessions = useCallback(
    (days: number): Session[] => {
      const todayStr = new Date().toISOString().split('T')[0]
      const end = new Date()
      end.setDate(end.getDate() + days)
      const endStr = end.toISOString().split('T')[0]

      return sessions
        .filter(s => s.date >= todayStr && s.date <= endStr)
        .sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date)
          if (dateCompare !== 0) return dateCompare
          return a.startTime.localeCompare(b.startTime)
        })
    },
    [sessions]
  )

  const getSessionsByDateRange = useCallback(
    (start: string, end: string): Session[] => {
      return sessions
        .filter(s => s.date >= start && s.date <= end)
        .sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date)
          if (dateCompare !== 0) return dateCompare
          return a.startTime.localeCompare(b.startTime)
        })
    },
    [sessions]
  )

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
    cancelSession,
    updateLessonTopic,
    updateSessionLocation,
    getUpcomingSessions,
    getSessionsByDateRange,
  }
}
