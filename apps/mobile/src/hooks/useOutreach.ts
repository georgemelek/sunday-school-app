import { useState, useEffect, useCallback } from 'react'
import { useTour } from '../contexts/TourContext'
// import { supabase } from '../lib/supabase'
import type { Student } from './useStudents'

export interface OutreachAssignment {
  id: string
  servantId: string
  studentId: string
  gradeName: string
  assignedAt: string
}

export interface OutreachVisit {
  id: string
  assignmentId: string
  visitDate: string
  notes?: string
  createdAt: string
}

export interface AssignedKid {
  assignment: OutreachAssignment
  student: Student
  visits: OutreachVisit[]
  lastVisit?: OutreachVisit
}

// --- Mock data (self-contained) ---

const MOCK_STUDENTS: Student[] = [
  {
    id: '1', grade_id: 'grade-6', first_name: 'John', last_name: 'Smith',
    date_of_birth: '2010-05-15', gender: 'male', student_phone: null,
    mother_first_name: null, mother_last_name: null,
    mother_phone: '555-0101', mother_email: 'mary@example.com',
    father_first_name: null, father_last_name: null,
    father_phone: null, father_email: null,
    street: '1234 Main St', city: 'Naperville', state: 'IL', zip: '60540', country: 'USA',
    notes: null, created_by: 'user-1', created_at: '2025-09-01T00:00:00Z', updated_at: '2025-09-01T00:00:00Z',
  },
  {
    id: '3', grade_id: 'grade-6', first_name: 'Michael', last_name: 'Chen',
    date_of_birth: '2010-03-10', gender: 'male', student_phone: null,
    mother_first_name: null, mother_last_name: null,
    mother_phone: '555-0103', mother_email: 'lisa@example.com',
    father_first_name: null, father_last_name: null,
    father_phone: null, father_email: null,
    street: '789 Oak Ave', city: 'Aurora', state: 'IL', zip: '60505', country: 'USA',
    notes: 'Allergic to peanuts', created_by: 'user-1', created_at: '2025-09-01T00:00:00Z', updated_at: '2025-09-01T00:00:00Z',
  },
  {
    id: '5', grade_id: 'grade-6', first_name: 'Kevin', last_name: 'Ibrahim',
    date_of_birth: '2010-07-20', gender: 'male', student_phone: null,
    mother_first_name: null, mother_last_name: null,
    mother_phone: '555-0105', mother_email: 'hany@example.com',
    father_first_name: null, father_last_name: null,
    father_phone: null, father_email: null,
    street: '456 Elm Blvd', city: 'Naperville', state: 'IL', zip: '60540', country: 'USA',
    notes: null, created_by: 'user-1', created_at: '2025-09-01T00:00:00Z', updated_at: '2025-09-01T00:00:00Z',
  },
  {
    id: '6', grade_id: 'grade-6', first_name: 'Andrew', last_name: 'Bishay',
    date_of_birth: '2010-12-05', gender: 'male', student_phone: null,
    mother_first_name: null, mother_last_name: null,
    mother_phone: '555-0106', mother_email: 'mina@example.com',
    father_first_name: null, father_last_name: null,
    father_phone: null, father_email: null,
    street: '321 Cedar Ln', city: 'Naperville', state: 'IL', zip: '60540', country: 'USA',
    notes: null, created_by: 'user-1', created_at: '2025-09-01T00:00:00Z', updated_at: '2025-09-01T00:00:00Z',
  },
]

const MOCK_ASSIGNMENTS: OutreachAssignment[] = [
  { id: 'oa-1', servantId: 'servant-1', studentId: '1', gradeName: '6th Grade', assignedAt: '2025-09-15T00:00:00Z' },
  { id: 'oa-2', servantId: 'servant-1', studentId: '3', gradeName: '6th Grade', assignedAt: '2025-09-15T00:00:00Z' },
  { id: 'oa-3', servantId: 'servant-1', studentId: '5', gradeName: '6th Grade', assignedAt: '2025-09-15T00:00:00Z' },
  { id: 'oa-4', servantId: 'servant-1', studentId: '6', gradeName: '6th Grade', assignedAt: '2025-09-15T00:00:00Z' },
]

const MOCK_VISITS: OutreachVisit[] = [
  { id: 'ov-1', assignmentId: 'oa-1', visitDate: '2025-11-10', notes: 'Went to Portillo\'s — had a great time!', createdAt: '2025-11-10T20:00:00Z' },
  { id: 'ov-2', assignmentId: 'oa-1', visitDate: '2026-01-18', notes: 'Bowling at Brunswick Zone', createdAt: '2026-01-18T21:00:00Z' },
  { id: 'ov-3', assignmentId: 'oa-3', visitDate: '2026-02-01', notes: 'Got pizza at Lou Malnati\'s', createdAt: '2026-02-01T19:30:00Z' },
]

export function useOutreach() {
  const { isTourMode } = useTour()
  const [assignedKids, setAssignedKids] = useState<AssignedKid[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOutreach = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      if (!isTourMode) {
        // TODO: S.12 — replace with real Supabase query
        setAssignedKids([])
        return
      }

      await new Promise(resolve => setTimeout(resolve, 500))

      const kids: AssignedKid[] = MOCK_ASSIGNMENTS.map(assignment => {
        const student = MOCK_STUDENTS.find(s => s.id === assignment.studentId)!
        const visits = MOCK_VISITS
          .filter(v => v.assignmentId === assignment.id)
          .sort((a, b) => b.visitDate.localeCompare(a.visitDate))
        return {
          assignment,
          student,
          visits,
          lastVisit: visits[0],
        }
      })

      setAssignedKids(kids)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch outreach assignments')
      setAssignedKids([])
    } finally {
      setLoading(false)
    }
  }, [isTourMode])

  useEffect(() => {
    fetchOutreach()
  }, [fetchOutreach])

  async function logVisit(assignmentId: string, date: string, notes?: string) {
    // TODO: Replace with actual Supabase insert
    // const { error } = await supabase
    //   .from('outreach_visits')
    //   .insert({ assignment_id: assignmentId, visit_date: date, notes })

    const newVisit: OutreachVisit = {
      id: `ov-${Date.now()}`,
      assignmentId,
      visitDate: date,
      notes,
      createdAt: new Date().toISOString(),
    }

    setAssignedKids(prev =>
      prev.map(kid => {
        if (kid.assignment.id !== assignmentId) return kid
        const visits = [newVisit, ...kid.visits]
        return { ...kid, visits, lastVisit: visits[0] }
      })
    )
  }

  return { assignedKids, loading, error, refetch: fetchOutreach, logVisit }
}
