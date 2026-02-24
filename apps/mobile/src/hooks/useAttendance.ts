import { useState, useEffect } from 'react'
// import { supabase } from '../lib/supabase'

export interface AttendanceRecord {
  id: string
  date: string
  student_id: string
  grade_id: string
  present: boolean
  notes: string | null
  recorded_by: string | null
  created_at: string
}

export interface AttendanceEntry {
  student_id: string
  present: boolean
  notes: string
}

export function useAttendance(gradeId: string) {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (gradeId) {
      fetchAttendance()
    }
  }, [gradeId])

  async function fetchAttendance() {
    setLoading(true)
    setError(null)

    try {
      // TODO: Replace with actual Supabase query
      // const { data, error: fetchError } = await supabase
      //   .from('attendance')
      //   .select('*')
      //   .eq('grade_id', gradeId)
      //   .order('date', { ascending: false })

      // if (fetchError) throw fetchError

      // Mock data for development
      await new Promise(resolve => setTimeout(resolve, 500))

      // Generate several weeks of mock attendance history
      const studentIds = ['1', '2', '3', '4']
      const mockRecords: AttendanceRecord[] = []
      let idCounter = 1

      const dates = [
        '2026-02-22', '2026-02-15', '2026-02-08', '2026-02-01',
        '2026-01-25', '2026-01-18',
      ]

      for (const date of dates) {
        for (const studentId of studentIds) {
          // Randomize attendance: ~80% present
          const present = !(date === '2026-02-22' && studentId === '3')
            && !(date === '2026-02-08' && studentId === '1')
            && !(date === '2026-01-25' && studentId === '2')
            && !(date === '2026-01-25' && studentId === '4')

          mockRecords.push({
            id: String(idCounter++),
            date,
            student_id: studentId,
            grade_id: gradeId,
            present,
            notes: !present && studentId === '3' ? 'Sick' : null,
            recorded_by: 'user-1',
            created_at: `${date}T10:00:00Z`,
          })
        }
      }

      setRecords(mockRecords)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch attendance')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  async function submitAttendance(date: string, entries: AttendanceEntry[]) {
    try {
      // TODO: Replace with actual Supabase batch insert
      // const { error: insertError } = await supabase
      //   .from('attendance')
      //   .upsert(
      //     entries.map(entry => ({
      //       date,
      //       student_id: entry.student_id,
      //       grade_id: gradeId,
      //       present: entry.present,
      //       notes: entry.notes || null,
      //       recorded_by: 'user-1',
      //     })),
      //     { onConflict: 'student_id,date' }
      //   )

      // if (insertError) throw insertError

      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 500))

      // Check for duplicates
      const existingDates = records
        .filter(r => r.date === date)
        .map(r => r.student_id)

      const hasExisting = entries.some(e => existingDates.includes(e.student_id))

      const newRecords: AttendanceRecord[] = entries.map(entry => ({
        id: Date.now().toString() + entry.student_id,
        date,
        student_id: entry.student_id,
        grade_id: gradeId,
        present: entry.present,
        notes: entry.notes || null,
        recorded_by: 'user-1',
        created_at: new Date().toISOString(),
      }))

      // Replace existing records for this date, add new ones
      setRecords(prev => {
        const otherDates = prev.filter(r => r.date !== date)
        return [...otherDates, ...newRecords]
      })

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
