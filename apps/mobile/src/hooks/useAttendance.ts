import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TABLES } from '../lib/tables'
import { useAuth } from '../contexts/AuthContext'
import { useTour } from '../contexts/TourContext'

export interface AttendanceRecord {
  id: string
  date: string
  student_id: string | null
  grade_id: string | null
  present: boolean
  notes: string | null
  recorded_by: string | null
  created_at: string | null
}

export interface AttendanceEntry {
  student_id: string
  present: boolean
  notes: string
}

// ── Mock data (tour mode only) ────────────────────────────────────────────────

function buildMockRecords(gradeId: string): AttendanceRecord[] {
  const studentIds = ['mock-s-1', 'mock-s-2', 'mock-s-3']
  const dates = [
    '2026-02-22', '2026-02-15', '2026-02-08', '2026-02-01',
    '2026-01-25', '2026-01-18',
  ]
  const records: AttendanceRecord[] = []
  let idCounter = 1

  for (const date of dates) {
    for (const studentId of studentIds) {
      const present = !(date === '2026-02-22' && studentId === 'mock-s-3')
        && !(date === '2026-02-08' && studentId === 'mock-s-1')
        && !(date === '2026-01-25' && studentId === 'mock-s-2')

      records.push({
        id: `mock-att-${idCounter++}`,
        date,
        student_id: studentId,
        grade_id: gradeId,
        present,
        notes: !present && studentId === 'mock-s-3' ? 'Sick' : null,
        recorded_by: 'mock-user-1',
        created_at: `${date}T10:00:00Z`,
      })
    }
  }

  return records
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAttendance(gradeId: string) {
  const { profile } = useAuth()
  const { isTourMode } = useTour()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (gradeId) {
      fetchAttendance()
    }
  }, [gradeId, isTourMode])

  async function fetchAttendance() {
    setLoading(true)
    setError(null)

    try {
      if (isTourMode) {
        await new Promise(resolve => setTimeout(resolve, 300))
        setRecords(buildMockRecords(gradeId))
        return
      }

      const { data, error: fetchError } = await supabase
        .from(TABLES.ATTENDANCE)
        .select('*')
        .eq('grade_id', gradeId)
        .order('date', { ascending: false })

      if (fetchError) throw fetchError
      setRecords(data ?? [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch attendance')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  async function submitAttendance(date: string, entries: AttendanceEntry[]) {
    const hasExisting = records.some(r => r.date === date)

    if (isTourMode) {
      const newRecords: AttendanceRecord[] = entries.map(entry => ({
        id: `mock-att-${Date.now()}-${entry.student_id}`,
        date,
        student_id: entry.student_id,
        grade_id: gradeId,
        present: entry.present,
        notes: entry.notes || null,
        recorded_by: 'mock-user-1',
        created_at: new Date().toISOString(),
      }))
      setRecords(prev => [...prev.filter(r => r.date !== date), ...newRecords])
      return { error: null, replaced: hasExisting }
    }

    try {
      const { error: upsertError } = await supabase
        .from(TABLES.ATTENDANCE)
        .upsert(
          entries.map(entry => ({
            date,
            student_id: entry.student_id,
            grade_id: gradeId,
            present: entry.present,
            notes: entry.notes || null,
            recorded_by: profile?.id ?? null,
          })),
          { onConflict: 'student_id,date' }
        )

      if (upsertError) throw upsertError

      await fetchAttendance()
      return { error: null, replaced: hasExisting }
    } catch (err: any) {
      return { error: err.message, replaced: false }
    }
  }

  function getAttendanceForDate(date: string) {
    return records.filter(r => r.date === date)
  }

  function hasAttendanceForDate(date: string) {
    return records.some(r => r.date === date)
  }

  function getUniqueDates() {
    const dates = [...new Set(records.map(r => r.date))]
    return dates.sort((a, b) => b.localeCompare(a)) // newest first
  }

  function getStudentAttendanceRate(studentId: string) {
    const studentRecords = records.filter(r => r.student_id === studentId)
    if (studentRecords.length === 0) return null
    const presentCount = studentRecords.filter(r => r.present).length
    return Math.round((presentCount / studentRecords.length) * 100)
  }

  function getDateSummary(date: string) {
    const dateRecords = records.filter(r => r.date === date)
    const total = dateRecords.length
    const present = dateRecords.filter(r => r.present).length
    return { total, present, absent: total - present }
  }

  return {
    records,
    loading,
    error,
    refetch: fetchAttendance,
    submitAttendance,
    getAttendanceForDate,
    hasAttendanceForDate,
    getUniqueDates,
    getStudentAttendanceRate,
    getDateSummary,
  }
}
