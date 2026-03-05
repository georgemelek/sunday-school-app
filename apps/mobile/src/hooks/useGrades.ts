import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TABLES } from '../lib/tables'
import { useAuth } from '../contexts/AuthContext'
import { useTour } from '../contexts/TourContext'
import { Grade } from '../types'

export type { Grade }

export type GradeWithStats = Grade & {
  student_count: number
  recent_attendance_rate?: number
}

const MOCK_GRADES: GradeWithStats[] = [
  {
    id: 'mock-grade-1',
    church_id: 'mock-church-1',
    name: '6th Grade Boys',
    created_by: 'mock-user-1',
    created_at: new Date().toISOString(),
    student_count: 12,
    recent_attendance_rate: 85,
  },
  {
    id: 'mock-grade-2',
    church_id: 'mock-church-1',
    name: 'Kindergarten',
    created_by: 'mock-user-1',
    created_at: new Date().toISOString(),
    student_count: 8,
    recent_attendance_rate: 92,
  },
]

export function useGrades() {
  const { profile } = useAuth()
  const { isTourMode } = useTour()
  const [grades, setGrades] = useState<GradeWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchGrades()
  }, [profile?.id, isTourMode])

  async function fetchGrades() {
    setLoading(true)
    setError(null)

    try {
      if (isTourMode) {
        await new Promise(resolve => setTimeout(resolve, 300))
        setGrades(MOCK_GRADES)
        return
      }

      if (!profile) return

      let query = supabase.from(TABLES.GRADES).select(`*, students(count)`)

      if (profile.role === 'servant') {
        const { data: servantGrades, error: sgError } = await supabase
          .from(TABLES.SERVANT_GRADES)
          .select('grade_id')
          .eq('servant_id', profile.id)

        if (sgError) throw sgError

        const gradeIds = (servantGrades ?? []).map((sg: any) => sg.grade_id)
        if (gradeIds.length === 0) {
          setGrades([])
          return
        }
        query = query.in('id', gradeIds)
      } else {
        // TODO: church_id on profile is not yet set — no onboarding flow exists
        // for coordinators/priests to link their account to a church.
        // Tracked in IMPLEMENTATION_PLAN.md under C.7 (Church Invitation System).
        // Once that's built, remove this guard.
        if (!profile.church_id) {
          setGrades([])
          return
        }
        query = query.eq('church_id', profile.church_id)
      }

      const { data, error: fetchError } = await query.order('name')
      if (fetchError) throw fetchError

      const mapped: GradeWithStats[] = (data ?? []).map((g: any) => ({
        id: g.id,
        church_id: g.church_id,
        name: g.name,
        created_by: g.created_by,
        created_at: g.created_at,
        student_count: g.students?.[0]?.count ?? 0,
      }))

      setGrades(mapped)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch grades')
      setGrades([])
    } finally {
      setLoading(false)
    }
  }

  async function createGrade(name: string) {
    if (isTourMode) {
      const newGrade: GradeWithStats = {
        id: `mock-grade-${Date.now()}`,
        church_id: 'mock-church-1',
        name,
        created_by: 'mock-user-1',
        created_at: new Date().toISOString(),
        student_count: 0,
      }
      setGrades(prev => [...prev, newGrade].sort((a, b) => a.name.localeCompare(b.name)))
      return { data: newGrade, error: null }
    }

    try {
      const { data, error: insertError } = await supabase
        .from(TABLES.GRADES)
        .insert({
          name,
          church_id: profile!.church_id,
          created_by: profile!.id,
        })
        .select()
        .single()

      if (insertError) throw insertError

      if (profile?.role === 'servant') {
        const { error: sgError } = await supabase
          .from(TABLES.SERVANT_GRADES)
          .insert({ servant_id: profile.id, grade_id: data.id })
        if (sgError) throw sgError
      }

      const newGrade: GradeWithStats = { ...data, student_count: 0 }
      setGrades(prev => [...prev, newGrade].sort((a, b) => a.name.localeCompare(b.name)))
      return { data: newGrade, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  async function deleteGrade(gradeId: string) {
    if (isTourMode) {
      setGrades(prev => prev.filter(g => g.id !== gradeId))
      return { error: null }
    }

    try {
      const { error: deleteError } = await supabase
        .from(TABLES.GRADES)
        .delete()
        .eq('id', gradeId)

      if (deleteError) throw deleteError

      setGrades(prev => prev.filter(g => g.id !== gradeId))
      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  return {
    grades,
    loading,
    error,
    refetch: fetchGrades,
    createGrade,
    deleteGrade,
  }
}
