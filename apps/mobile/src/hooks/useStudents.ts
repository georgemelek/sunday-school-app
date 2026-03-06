import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TABLES } from '../lib/tables'
import { useAuth } from '../contexts/AuthContext'
import { useTour } from '../contexts/TourContext'
import { Student } from '../types'

export type { Student }

// Computed display name — used throughout the UI
export function studentDisplayName(s: Pick<Student, 'first_name' | 'last_name'>): string {
  return [s.first_name, s.last_name].filter(Boolean).join(' ') || 'Unnamed Student'
}

// Fields the form writes — subset of Student used for insert/update
export type StudentFormData = {
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string
  student_phone: string
  mother_first_name: string
  mother_last_name: string
  mother_phone: string
  mother_email: string
  father_first_name: string
  father_last_name: string
  father_phone: string
  father_email: string
  street: string
  city: string
  state: string
  zip: string
  country: string
  notes: string
}

export const EMPTY_FORM: StudentFormData = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  gender: '',
  student_phone: '',
  mother_first_name: '',
  mother_last_name: '',
  mother_phone: '',
  mother_email: '',
  father_first_name: '',
  father_last_name: '',
  father_phone: '',
  father_email: '',
  street: '',
  city: '',
  state: '',
  zip: '',
  country: 'USA',
  notes: '',
}

// ── Mock data (tour mode only) ────────────────────────────────────────────────

const MOCK_STUDENTS: Student[] = [
  {
    id: 'mock-s-1',
    grade_id: 'mock-grade-1',
    first_name: 'John',
    last_name: 'Smith',
    date_of_birth: '2010-05-15',
    gender: 'male',
    student_phone: null,
    mother_first_name: null,
    mother_last_name: null,
    mother_email: 'mary@example.com',
    mother_phone: '555-0101',
    father_first_name: null,
    father_last_name: null,
    father_email: null,
    father_phone: null,
    street: '123 Main St',
    city: 'Naperville',
    state: 'IL',
    zip: '60540',
    country: 'USA',
    notes: null,
    created_by: 'mock-user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-s-2',
    grade_id: 'mock-grade-1',
    first_name: 'Sarah',
    last_name: 'Johnson',
    date_of_birth: '2010-08-22',
    gender: 'female',
    student_phone: null,
    mother_first_name: null,
    mother_last_name: null,
    mother_email: 'linda@example.com',
    mother_phone: '555-0102',
    father_first_name: null,
    father_last_name: null,
    father_email: null,
    father_phone: null,
    street: '456 Oak Ave',
    city: 'Naperville',
    state: 'IL',
    zip: '60540',
    country: 'USA',
    notes: null,
    created_by: 'mock-user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-s-3',
    grade_id: 'mock-grade-1',
    first_name: 'Michael',
    last_name: 'Chen',
    date_of_birth: '2010-03-10',
    gender: 'male',
    student_phone: null,
    mother_first_name: null,
    mother_last_name: null,
    mother_email: 'lisa@example.com',
    mother_phone: '555-0103',
    father_first_name: null,
    father_last_name: null,
    father_email: null,
    father_phone: null,
    street: '789 Elm St',
    city: 'Aurora',
    state: 'IL',
    zip: '60505',
    country: 'USA',
    notes: 'Allergic to peanuts',
    created_by: 'mock-user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useStudents(gradeId: string) {
  const { profile } = useAuth()
  const { isTourMode } = useTour()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (gradeId) fetchStudents()
  }, [gradeId, isTourMode])

  async function fetchStudents() {
    setLoading(true)
    setError(null)

    try {
      if (isTourMode) {
        await new Promise(resolve => setTimeout(resolve, 300))
        setStudents(MOCK_STUDENTS.filter(s => s.grade_id === gradeId))
        return
      }

      const { data, error: fetchError } = await supabase
        .from(TABLES.STUDENTS)
        .select('*')
        .eq('grade_id', gradeId)
        .order('last_name')

      if (fetchError) throw fetchError
      setStudents(data ?? [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch students')
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  async function addStudent(formData: StudentFormData) {
    if (isTourMode) {
      const newStudent: Student = {
        id: `mock-s-${Date.now()}`,
        grade_id: gradeId,
        ...formData,
        created_by: 'mock-user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setStudents(prev => [...prev, newStudent].sort((a, b) =>
        studentDisplayName(a).localeCompare(studentDisplayName(b))
      ))
      return { data: newStudent, error: null }
    }

    try {
      const { data, error: insertError } = await supabase
        .from(TABLES.STUDENTS)
        .insert({
          grade_id: gradeId,
          created_by: profile!.id,
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender || null,
          student_phone: formData.student_phone || null,
          mother_first_name: formData.mother_first_name || null,
          mother_last_name: formData.mother_last_name || null,
          mother_phone: formData.mother_phone || null,
          mother_email: formData.mother_email || null,
          father_first_name: formData.father_first_name || null,
          father_last_name: formData.father_last_name || null,
          father_phone: formData.father_phone || null,
          father_email: formData.father_email || null,
          street: formData.street || null,
          city: formData.city || null,
          state: formData.state || null,
          zip: formData.zip || null,
          country: formData.country || null,
          notes: formData.notes || null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      setStudents(prev => [...prev, data].sort((a, b) =>
        studentDisplayName(a).localeCompare(studentDisplayName(b))
      ))
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  async function updateStudent(studentId: string, formData: StudentFormData) {
    if (isTourMode) {
      setStudents(prev => prev.map(s =>
        s.id === studentId ? { ...s, ...formData, updated_at: new Date().toISOString() } : s
      ))
      return { error: null }
    }

    try {
      const { error: updateError } = await supabase
        .from(TABLES.STUDENTS)
        .update({
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender || null,
          student_phone: formData.student_phone || null,
          mother_first_name: formData.mother_first_name || null,
          mother_last_name: formData.mother_last_name || null,
          mother_phone: formData.mother_phone || null,
          mother_email: formData.mother_email || null,
          father_first_name: formData.father_first_name || null,
          father_last_name: formData.father_last_name || null,
          father_phone: formData.father_phone || null,
          father_email: formData.father_email || null,
          street: formData.street || null,
          city: formData.city || null,
          state: formData.state || null,
          zip: formData.zip || null,
          country: formData.country || null,
          notes: formData.notes || null,
        })
        .eq('id', studentId)

      if (updateError) throw updateError

      setStudents(prev => prev.map(s =>
        s.id === studentId ? { ...s, ...formData, updated_at: new Date().toISOString() } : s
      ))
      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  async function deleteStudent(studentId: string) {
    if (isTourMode) {
      setStudents(prev => prev.filter(s => s.id !== studentId))
      return { error: null }
    }

    try {
      const { error: deleteError } = await supabase
        .from(TABLES.STUDENTS)
        .delete()
        .eq('id', studentId)

      if (deleteError) throw deleteError

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
