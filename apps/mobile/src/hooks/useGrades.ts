import { useState, useEffect } from 'react'
// import { supabase } from '../lib/supabase'

export interface Grade {
  id: string
  church_id: string
  name: string
  created_by: string
  created_at: string
  student_count?: number
  recent_attendance_rate?: number
}

export function useGrades(servantId?: string) {
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchGrades()
  }, [servantId])

  async function fetchGrades() {
    setLoading(true)
    setError(null)

    try {
      // TODO: Replace with actual Supabase query when auth is fixed
      // const { data, error: fetchError } = await supabase
      //   .from('grades')
      //   .select(`
      //     *,
      //     students:students(count),
      //     servant_grades!inner(servant_id)
      //   `)
      //   .eq('servant_grades.servant_id', servantId)
      //   .order('name')

      // if (fetchError) throw fetchError

      // Mock data for development
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay

      const mockGrades: Grade[] = [
        {
          id: '1',
          church_id: 'church-1',
          name: '6th Grade Boys',
          created_by: 'user-1',
          created_at: new Date().toISOString(),
          student_count: 12,
          recent_attendance_rate: 85,
        },
        {
          id: '2',
          church_id: 'church-1',
          name: 'Kindergarten',
          created_by: 'user-1',
          created_at: new Date().toISOString(),
          student_count: 8,
          recent_attendance_rate: 92,
        },
      ]

      setGrades(mockGrades)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch grades')
      setGrades([])
    } finally {
      setLoading(false)
    }
  }

  async function createGrade(name: string) {
    try {
      // TODO: Replace with actual Supabase insert
      // const { data, error: insertError } = await supabase
      //   .from('grades')
      //   .insert({
      //     name,
      //     church_id: userChurchId,
      //     created_by: servantId,
      //   })
      //   .select()
      //   .single()

      // if (insertError) throw insertError

      // Also insert into servant_grades to link servant to grade
      // await supabase
      //   .from('servant_grades')
      //   .insert({
      //     servant_id: servantId,
      //     grade_id: data.id,
      //   })

      // Mock implementation
      const newGrade: Grade = {
        id: Date.now().toString(),
        church_id: 'church-1',
        name,
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        student_count: 0,
        recent_attendance_rate: 0,
      }

      setGrades(prev => [...prev, newGrade])
      return { data: newGrade, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  async function deleteGrade(gradeId: string) {
    try {
      // TODO: Replace with actual Supabase delete
      // const { error: deleteError } = await supabase
      //   .from('grades')
      //   .delete()
      //   .eq('id', gradeId)

      // if (deleteError) throw deleteError

      // Mock implementation
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
