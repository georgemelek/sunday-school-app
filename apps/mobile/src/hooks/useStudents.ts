import { useState, useEffect } from 'react'
// import { supabase } from '../lib/supabase'

export interface Student {
  id: string
  grade_id: string
  name: string
  date_of_birth?: string
  parent_name?: string
  parent_phone?: string
  parent_email?: string
  address?: string
  city?: string
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
}

export function useStudents(gradeId: string) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (gradeId) {
      fetchStudents()
    }
  }, [gradeId])

  async function fetchStudents() {
    setLoading(true)
    setError(null)

    try {
      // TODO: Replace with actual Supabase query when auth is fixed
      // const { data, error: fetchError } = await supabase
      //   .from('students')
      //   .select('*')
      //   .eq('grade_id', gradeId)
      //   .order('name')

      // if (fetchError) throw fetchError

      // Mock data for development
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay

      const mockStudents: Student[] = [
        {
          id: '1',
          grade_id: gradeId,
          name: 'John Smith',
          date_of_birth: '2010-05-15',
          parent_name: 'Mary Smith',
          parent_phone: '555-0101',
          parent_email: 'mary@example.com',
          city: 'Naperville',
          notes: '',
          created_by: 'user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          grade_id: gradeId,
          name: 'Sarah Johnson',
          date_of_birth: '2010-08-22',
          parent_name: 'Tom Johnson',
          parent_phone: '555-0102',
          parent_email: 'tom@example.com',
          city: 'Naperville',
          notes: '',
          created_by: 'user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '3',
          grade_id: gradeId,
          name: 'Michael Chen',
          date_of_birth: '2010-03-10',
          parent_name: 'Lisa Chen',
          parent_phone: '555-0103',
          parent_email: 'lisa@example.com',
          city: 'Aurora',
          notes: 'Allergic to peanuts',
          created_by: 'user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '4',
          grade_id: gradeId,
          name: 'Emily Davis',
          date_of_birth: '2010-11-30',
          parent_name: 'Robert Davis',
          parent_phone: '555-0104',
          parent_email: 'robert@example.com',
          city: 'Naperville',
          notes: '',
          created_by: 'user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]

      setStudents(mockStudents)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch students')
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  async function addStudent(studentData: Partial<Student>) {
    try {
      // TODO: Replace with actual Supabase insert
      // const { data, error: insertError } = await supabase
      //   .from('students')
      //   .insert({
      //     ...studentData,
      //     grade_id: gradeId,
      //   })
      //   .select()
      //   .single()

      // if (insertError) throw insertError

      // Mock implementation
      const newStudent: Student = {
        id: Date.now().toString(),
        grade_id: gradeId,
        name: studentData.name || '',
        date_of_birth: studentData.date_of_birth,
        parent_name: studentData.parent_name,
        parent_phone: studentData.parent_phone,
        parent_email: studentData.parent_email,
        address: studentData.address,
        city: studentData.city,
        notes: studentData.notes,
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setStudents(prev => [...prev, newStudent].sort((a, b) => a.name.localeCompare(b.name)))
      return { data: newStudent, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  async function updateStudent(studentId: string, studentData: Partial<Student>) {
    try {
      // TODO: Replace with actual Supabase update
      // const { data, error: updateError } = await supabase
      //   .from('students')
      //   .update(studentData)
      //   .eq('id', studentId)
      //   .select()
      //   .single()

      // if (updateError) throw updateError

      // Mock implementation
      setStudents(prev =>
        prev.map(s =>
          s.id === studentId
            ? { ...s, ...studentData, updated_at: new Date().toISOString() }
            : s
        )
      )
      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  async function deleteStudent(studentId: string) {
    try {
      // TODO: Replace with actual Supabase delete
      // const { error: deleteError } = await supabase
      //   .from('students')
      //   .delete()
      //   .eq('id', studentId)

      // if (deleteError) throw deleteError

      // Mock implementation
      setStudents(prev => prev.filter(s => s.id !== studentId))
      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  return {
    students,
    loading,
    error,
    refetch: fetchStudents,
    addStudent,
    updateStudent,
    deleteStudent,
  }
}
