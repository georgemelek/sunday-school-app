import { useState, useEffect, useCallback } from 'react'
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
    id: '1',
    grade_id: 'grade-6',
    name: 'John Smith',
    date_of_birth: '2010-05-15',
    parent_name: 'Mary Smith',
    parent_phone: '555-0101',
    parent_email: 'mary@example.com',
    address: '1234 Main St',
    city: 'Naperville',
    notes: '',
    created_by: 'user-1',
    created_at: '2025-09-01T00:00:00Z',
    updated_at: '2025-09-01T00:00:00Z',
  },
  {
    id: '3',
    grade_id: 'grade-6',
    name: 'Michael Chen',
    date_of_birth: '2010-03-10',
    parent_name: 'Lisa Chen',
    parent_phone: '555-0103',
    parent_email: 'lisa@example.com',
    address: '789 Oak Ave',
    city: 'Aurora',
    notes: 'Allergic to peanuts',
    created_by: 'user-1',
    created_at: '2025-09-01T00:00:00Z',
    updated_at: '2025-09-01T00:00:00Z',
  },
  {
    id: '5',
    grade_id: 'grade-6',
    name: 'Kevin Ibrahim',
    date_of_birth: '2010-07-20',
    parent_name: 'Hany Ibrahim',
    parent_phone: '555-0105',
    parent_email: 'hany@example.com',
    address: '456 Elm Blvd',
    city: 'Naperville',
    notes: '',
    created_by: 'user-1',
    created_at: '2025-09-01T00:00:00Z',
    updated_at: '2025-09-01T00:00:00Z',
  },
  {
    id: '6',
    grade_id: 'grade-6',
    name: 'Andrew Bishay',
    date_of_birth: '2010-12-05',
    parent_name: 'Mina Bishay',
    parent_phone: '555-0106',
    parent_email: 'mina@example.com',
    address: '321 Cedar Ln',
    city: 'Naperville',
    notes: '',
    created_by: 'user-1',
    created_at: '2025-09-01T00:00:00Z',
    updated_at: '2025-09-01T00:00:00Z',
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
  const [assignedKids, setAssignedKids] = useState<AssignedKid[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOutreach = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // TODO: Replace with actual Supabase query
      // const { data, error: fetchError } = await supabase
      //   .from('outreach_assignments')
      //   .select('*, student:students(*), visits:outreach_visits(*)')
      //   .eq('servant_id', currentUserId)
      //   .order('student.name')

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
  }, [])

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
