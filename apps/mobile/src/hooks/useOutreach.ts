import { useState, useEffect, useCallback } from 'react'
import { useTour } from '../contexts/TourContext'
import { supabase } from '../lib/supabase'
import { TABLES } from '../lib/tables'
import { useAuth } from '../contexts/AuthContext'
import type { Student } from './useStudents'

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface OutreachAssignment {
  id: string
  servantId: string
  studentId: string
  gradeName: string
  assignedAt: string
  status: 'active' | 'local_friend' | 'other_servant'
}

export interface OutreachVisit {
  id: string
  assignmentId: string
  visitDate: string
  notes?: string
  type: 'visit' | 'call' | 'message'
  createdAt: string
}

export interface AssignedKid {
  assignment: OutreachAssignment
  student: Student
  visits: OutreachVisit[]
  lastVisit?: OutreachVisit
}

export interface GradeServantProgress {
  servantId: string
  servantName: string
  totalKids: number
  visitedKids: number
}

export interface AssignableKid {
  student: Student
  assignment: OutreachAssignment | null
}

export interface ManageServant {
  id: string
  fullName: string
  gender: string | null
  assignedKids: AssignableKid[]
}

// Sentinel used to represent servants who manage kids but aren't on the app yet.
// DB rows use servant_id = null + status = 'other_servant' (no FK violation).
// When all servants join the app, bulk-reassign these rows to real servant IDs.
export const PHANTOM_SERVANT_ID = '__phantom__'
export const PHANTOM_SERVANT_NAME = 'Other servants (not on app yet)'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_STUDENTS: Student[] = [
  {
    id: '1', grade_id: 'grade-6', first_name: 'John', last_name: 'Smith',
    date_of_birth: '2010-05-15', gender: 'male', student_phone: null,
    mother_first_name: 'Mary', mother_last_name: 'Smith',
    mother_phone: '555-0101', mother_email: 'mary@example.com',
    father_first_name: 'Bob', father_last_name: 'Smith',
    father_phone: '555-0102', father_email: null,
    street: '1234 Main St', city: 'Naperville', state: 'IL', zip: '60540', country: 'USA',
    notes: null, created_by: 'user-1', created_at: '2025-09-01T00:00:00Z', updated_at: '2025-09-01T00:00:00Z',
  },
  {
    id: '3', grade_id: 'grade-6', first_name: 'Michael', last_name: 'Chen',
    date_of_birth: '2010-03-10', gender: 'male', student_phone: null,
    mother_first_name: 'Lisa', mother_last_name: 'Chen',
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
    father_first_name: 'Hany', father_last_name: 'Ibrahim',
    father_phone: '555-0106', father_email: null,
    street: '456 Elm Blvd', city: 'Naperville', state: 'IL', zip: '60540', country: 'USA',
    notes: null, created_by: 'user-1', created_at: '2025-09-01T00:00:00Z', updated_at: '2025-09-01T00:00:00Z',
  },
  {
    id: '6', grade_id: 'grade-6', first_name: 'Andrew', last_name: 'Bishay',
    date_of_birth: '2010-12-05', gender: 'male', student_phone: null,
    mother_first_name: null, mother_last_name: null,
    mother_phone: '555-0107', mother_email: 'mina@example.com',
    father_first_name: null, father_last_name: null,
    father_phone: null, father_email: null,
    street: '321 Cedar Ln', city: 'Naperville', state: 'IL', zip: '60540', country: 'USA',
    notes: null, created_by: 'user-1', created_at: '2025-09-01T00:00:00Z', updated_at: '2025-09-01T00:00:00Z',
  },
  {
    id: '7', grade_id: 'grade-6', first_name: 'Peter', last_name: 'Gerges',
    date_of_birth: '2010-09-14', gender: 'male', student_phone: null,
    mother_first_name: null, mother_last_name: null,
    mother_phone: null, mother_email: null,
    father_first_name: null, father_last_name: null,
    father_phone: null, father_email: null,
    street: null, city: 'Naperville', state: 'IL', zip: '60540', country: 'USA',
    notes: null, created_by: 'user-1', created_at: '2025-09-01T00:00:00Z', updated_at: '2025-09-01T00:00:00Z',
  },
]

const MOCK_ASSIGNMENTS: OutreachAssignment[] = [
  { id: 'oa-1', servantId: 'servant-1', studentId: '1', gradeName: '6th Grade', assignedAt: '2025-09-15T00:00:00Z', status: 'active' },
  { id: 'oa-2', servantId: 'servant-1', studentId: '3', gradeName: '6th Grade', assignedAt: '2025-09-15T00:00:00Z', status: 'active' },
  { id: 'oa-3', servantId: 'servant-1', studentId: '5', gradeName: '6th Grade', assignedAt: '2025-09-15T00:00:00Z', status: 'active' },
  { id: 'oa-4', servantId: 'servant-2', studentId: '6', gradeName: '6th Grade', assignedAt: '2025-09-15T00:00:00Z', status: 'active' },
  { id: 'oa-5', servantId: 'servant-1', studentId: '7', gradeName: '6th Grade', assignedAt: '2025-09-15T00:00:00Z', status: 'local_friend' },
]

const MOCK_VISITS: OutreachVisit[] = [
  { id: 'ov-1', assignmentId: 'oa-1', visitDate: '2025-11-10', notes: "Went to Portillo's — had a great time!", type: 'visit', createdAt: '2025-11-10T20:00:00Z' },
  { id: 'ov-2', assignmentId: 'oa-1', visitDate: '2026-01-18', notes: 'Bowling at Brunswick Zone', type: 'visit', createdAt: '2026-01-18T21:00:00Z' },
  { id: 'ov-3', assignmentId: 'oa-3', visitDate: '2026-02-01', notes: "Got pizza at Lou Malnati's", type: 'visit', createdAt: '2026-02-01T19:30:00Z' },
]

const MOCK_SERVANTS_MANAGE = [
  { id: 'servant-1', fullName: 'George Melek', gender: 'male'},
  { id: 'servant-2', fullName: 'Mark Hanna', gender: 'male'},
]

// ─── Row mappers ──────────────────────────────────────────────────────────────

function rowToAssignment(row: any, gradeName: string): OutreachAssignment {
  const status = row.status ?? 'active'
  return {
    id: row.id,
    // 'other_servant' rows have servant_id = null in DB; map to phantom sentinel for UI
    servantId: status === 'other_servant' ? PHANTOM_SERVANT_ID : row.servant_id,
    studentId: row.student_id,
    gradeName,
    assignedAt: row.created_at,
    status,
  }
}

function rowToVisit(row: any): OutreachVisit {
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    visitDate: (row.visited_at ?? row.visit_date ?? '').split('T')[0],
    notes: row.notes ?? undefined,
    type: row.type ?? 'visit',
    createdAt: row.created_at,
  }
}

// ─── useOutreach ──────────────────────────────────────────────────────────────

export function useOutreach() {
  const { isTourMode } = useTour()
  const { profile } = useAuth()

  const [assignedKids, setAssignedKids] = useState<AssignedKid[]>([])
  const [localFriends, setLocalFriends] = useState<AssignedKid[]>([])
  const [gradeOverview, setGradeOverview] = useState<GradeServantProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOutreach = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      if (isTourMode) {
        await new Promise(resolve => setTimeout(resolve, 500))

        const myId = 'servant-1'
        const myAssignments = MOCK_ASSIGNMENTS.filter(a => a.servantId === myId)

        const buildKid = (a: OutreachAssignment): AssignedKid => {
          const student = MOCK_STUDENTS.find(s => s.id === a.studentId)!
          const visits = MOCK_VISITS
            .filter(v => v.assignmentId === a.id)
            .sort((x, y) => y.visitDate.localeCompare(x.visitDate))
          return { assignment: a, student, visits, lastVisit: visits[0] }
        }

        setAssignedKids(myAssignments.filter(a => a.status === 'active').map(buildKid))
        setLocalFriends(myAssignments.filter(a => a.status === 'local_friend').map(buildKid))

        // Grade overview: all servants
        const overview: GradeServantProgress[] = MOCK_SERVANTS_MANAGE.map(servant => {
          const servantActive = MOCK_ASSIGNMENTS.filter(a => a.servantId === servant.id && a.status === 'active')
          const visitedIds = new Set(MOCK_VISITS.map(v => v.assignmentId))
          return {
            servantId: servant.id,
            servantName: servant.fullName,
            totalKids: servantActive.length,
            visitedKids: servantActive.filter(a => visitedIds.has(a.id)).length,
          }
        })
        setGradeOverview(overview)
        return
      }

      if (!profile) {
        setAssignedKids([])
        setLocalFriends([])
        setGradeOverview([])
        return
      }

      type SgWithGrade = { grade_id: string | null; grades: { name: string } | null }

      // 1. Get grade IDs for this servant
      const { data: sgRows, error: sgError } = await supabase
        .from(TABLES.SERVANT_GRADES)
        .select('grade_id, grades(name)')
        .eq('servant_id', profile.id)
      if (sgError) throw sgError

      const typedSgRows = (sgRows ?? []) as SgWithGrade[]
      const gradeIds: string[] = typedSgRows.filter(r => r.grade_id !== null).map(r => r.grade_id as string)
      const gradeNameMap: Record<string, string> = {}
      for (const r of typedSgRows) {
        if (r.grade_id) gradeNameMap[r.grade_id] = r.grades?.name ?? ''
      }

      if (gradeIds.length === 0) {
        setAssignedKids([])
        setLocalFriends([])
        setGradeOverview([])
        return
      }

      // 2. Fetch my assignments with embedded students
      const { data: assignRows, error: assignError } = await supabase
        .from(TABLES.OUTREACH_ASSIGNMENTS)
        .select('*, students(*)')
        .eq('servant_id', profile.id)
      if (assignError) throw assignError

      const myAssignmentIds = (assignRows ?? []).map((r: any) => r.id)

      // 3. Fetch visits for my assignments
      const { data: visitRows, error: visitError } = myAssignmentIds.length > 0
        ? await supabase
            .from(TABLES.OUTREACH_VISITS)
            .select('*')
            .in('assignment_id', myAssignmentIds)
            .order('visited_at', { ascending: false })
        : { data: [], error: null }
      if (visitError) throw visitError

      const visitsByAssignment: Record<string, OutreachVisit[]> = {}
      for (const row of visitRows ?? []) {
        const v = rowToVisit(row)
        if (!visitsByAssignment[v.assignmentId]) visitsByAssignment[v.assignmentId] = []
        visitsByAssignment[v.assignmentId].push(v)
      }

      const buildKidFromRow = (row: any): AssignedKid => {
        const student = row.students as Student
        const gradeName = student.grade_id ? (gradeNameMap[student.grade_id] ?? '') : ''
        const assignment = rowToAssignment(row, gradeName)
        const visits = visitsByAssignment[assignment.id] ?? []
        return { assignment, student, visits, lastVisit: visits[0] }
      }

      const active = (assignRows ?? []).filter((r: any) => (r.status ?? 'active') === 'active').map(buildKidFromRow)
      const local = (assignRows ?? []).filter((r: any) => r.status === 'local_friend').map(buildKidFromRow)

      setAssignedKids(active)
      setLocalFriends(local)

      type AssignWithProfile = { id: string; servant_id: string | null; profiles: { full_name: string } | null }

      // 4. Grade overview: all servants in grade
      const { data: studentIdRows } = await supabase.from(TABLES.STUDENTS).select('id').in('grade_id', gradeIds)
      const allStudentIds = (studentIdRows ?? []).map(s => s.id)

      const { data: allAssigns, error: allAssignError } = allStudentIds.length
        ? await supabase
            .from(TABLES.OUTREACH_ASSIGNMENTS)
            .select('id, servant_id, profiles(full_name)')
            .in('student_id', allStudentIds)
            .eq('status', 'active')
        : { data: [] as AssignWithProfile[], error: null }
      if (allAssignError) throw allAssignError

      const typedAllAssigns = (allAssigns ?? []) as AssignWithProfile[]
      const { data: allVisitRows } = typedAllAssigns.length
        ? await supabase.from(TABLES.OUTREACH_VISITS).select('assignment_id').in('assignment_id', typedAllAssigns.map(a => a.id))
        : { data: [] }
      const visitedAssignmentIds = new Set((allVisitRows ?? []).map(v => v.assignment_id))

      const overviewMap: Record<string, { name: string; total: number; visited: number }> = {}
      for (const row of typedAllAssigns) {
        const sid = row.servant_id
        if (!sid) continue
        if (!overviewMap[sid]) {
          overviewMap[sid] = { name: row.profiles?.full_name ?? 'Unknown', total: 0, visited: 0 }
        }
        overviewMap[sid].total++
        if (visitedAssignmentIds.has(row.id)) overviewMap[sid].visited++
      }

      setGradeOverview(
        Object.entries(overviewMap).map(([servantId, v]) => ({
          servantId,
          servantName: v.name,
          totalKids: v.total,
          visitedKids: v.visited,
        }))
      )
    } catch (err: any) {
      setError(err.message || 'Failed to fetch outreach assignments')
      setAssignedKids([])
      setLocalFriends([])
      setGradeOverview([])
    } finally {
      setLoading(false)
    }
  }, [isTourMode, profile])

  useEffect(() => {
    fetchOutreach()
  }, [fetchOutreach])

  async function logVisit(
    assignmentId: string,
    visitedAt: string,
    notes?: string,
    type: 'visit' | 'call' | 'message' = 'visit',
  ): Promise<{ error: any }> {
    const newVisit: OutreachVisit = {
      id: `ov-${Date.now()}`,
      assignmentId,
      visitDate: visitedAt.split('T')[0],
      notes,
      type,
      createdAt: new Date().toISOString(),
    }

    // Optimistic update
    const applyVisit = (prev: AssignedKid[]) =>
      prev.map(kid => {
        if (kid.assignment.id !== assignmentId) return kid
        const visits = [newVisit, ...kid.visits]
        return { ...kid, visits, lastVisit: visits[0] }
      })
    setAssignedKids(applyVisit)
    setLocalFriends(applyVisit)

    if (isTourMode) return { error: null }

    if (!profile) return { error: new Error('Not authenticated') }

    const { data: assignRow } = await supabase
      .from(TABLES.OUTREACH_ASSIGNMENTS)
      .select('student_id')
      .eq('id', assignmentId)
      .single()

    const { error } = await supabase
      .from(TABLES.OUTREACH_VISITS)
      .insert({
        assignment_id: assignmentId,
        servant_id: profile.id,
        student_id: assignRow?.student_id ?? null,
        visited_at: visitedAt.includes('T') ? visitedAt : visitedAt + 'T00:00:00Z',
        notes: notes ?? null,
        type,
      })
    return { error }
  }

  async function deleteVisit(visitId: string, assignmentId: string): Promise<{ error: any }> {
    // Optimistic update
    const removeVisit = (prev: AssignedKid[]) =>
      prev.map(kid => {
        if (kid.assignment.id !== assignmentId) return kid
        const visits = kid.visits.filter(v => v.id !== visitId)
        return { ...kid, visits, lastVisit: visits[0] }
      })
    setAssignedKids(removeVisit)
    setLocalFriends(removeVisit)

    if (isTourMode) return { error: null }

    const { error } = await supabase
      .from(TABLES.OUTREACH_VISITS)
      .delete()
      .eq('id', visitId)
    return { error }
  }

  return { assignedKids, localFriends, gradeOverview, loading, error, refetch: fetchOutreach, logVisit, deleteVisit }
}

// ─── useOutreachManagement ────────────────────────────────────────────────────

export function useOutreachManagement() {
  const { isTourMode } = useTour()
  const { profile } = useAuth()

  const [servants, setServants] = useState<ManageServant[]>([])
  const [unassigned, setUnassigned] = useState<Student[]>([])
  const [localFriends, setLocalFriends] = useState<AssignedKid[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchManagement = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      if (isTourMode) {
        await new Promise(resolve => setTimeout(resolve, 400))

        const assignedStudentIds = new Set(MOCK_ASSIGNMENTS.filter(a => a.status === 'active').map(a => a.studentId))
        const localIds = new Set(MOCK_ASSIGNMENTS.filter(a => a.status === 'local_friend').map(a => a.studentId))

        const builtServants: ManageServant[] = [
          ...MOCK_SERVANTS_MANAGE.map(sv => ({
            id: sv.id,
            fullName: sv.fullName,
            gender: sv.gender,
            assignedKids: MOCK_STUDENTS
              .filter(s => {
                const a = MOCK_ASSIGNMENTS.find(a => a.studentId === s.id && a.servantId === sv.id && a.status === 'active')
                return !!a
              })
              .map(s => ({
                student: s,
                assignment: MOCK_ASSIGNMENTS.find(a => a.studentId === s.id && a.servantId === sv.id && a.status === 'active') ?? null,
              })),
          })),
          { id: PHANTOM_SERVANT_ID, fullName: PHANTOM_SERVANT_NAME, gender: null, assignedKids: [] },
        ]

        const unassignedStudents = MOCK_STUDENTS.filter(s => !assignedStudentIds.has(s.id) && !localIds.has(s.id))

        const localFriendKids: AssignedKid[] = MOCK_ASSIGNMENTS
          .filter(a => a.status === 'local_friend')
          .map(a => {
            const student = MOCK_STUDENTS.find(s => s.id === a.studentId)!
            return { assignment: a, student, visits: [], lastVisit: undefined }
          })

        setServants(builtServants)
        setUnassigned(unassignedStudents)
        setLocalFriends(localFriendKids)
        return
      }

      if (!profile) {
        setServants([])
        setUnassigned([])
        setLocalFriends([])
        return
      }

      // 1. Grade IDs
      const { data: sgRows, error: sgError } = await supabase
        .from(TABLES.SERVANT_GRADES)
        .select('grade_id')
        .eq('servant_id', profile.id)
      if (sgError) throw sgError
      const gradeIds = (sgRows ?? []).map((r: any) => r.grade_id)
      if (!gradeIds.length) { setServants([]); setUnassigned([]); setLocalFriends([]); return }

      // 2. All students in grades
      const { data: studentRows, error: studentError } = await supabase
        .from(TABLES.STUDENTS)
        .select('*')
        .in('grade_id', gradeIds)
      if (studentError) throw studentError
      const allStudents: Student[] = studentRows ?? []

      type AssignRow = {
        id: string
        servant_id: string | null
        student_id: string | null
        status: string
        created_at: string | null
      }
      type SgWithProfile = {
        servant_id: string | null
        profiles: { id: string; full_name: string | null; gender: string | null } | null
      }

      // 3. All assignments for those students
      const studentIds = allStudents.map(s => s.id)
      const { data: assignRows, error: assignError } = studentIds.length
        ? await supabase
            .from(TABLES.OUTREACH_ASSIGNMENTS)
            .select('id, servant_id, student_id, status, created_at')
            .in('student_id', studentIds)
        : { data: [] as AssignRow[], error: null }
      if (assignError) throw assignError

      const typedAssignRows = (assignRows ?? []) as AssignRow[]

      // 4. All servants in grades
      const { data: allSgRows, error: allSgError } = await supabase
        .from(TABLES.SERVANT_GRADES)
        .select('servant_id, profiles!servant_id(id, full_name, gender)')
        .in('grade_id', gradeIds)
      if (allSgError) throw allSgError

      const typedSgRows2 = (allSgRows ?? []) as SgWithProfile[]

      // Deduplicate servants
      const servantMap = new Map<string, { id: string; fullName: string; gender: string | null }>()
      for (const r of typedSgRows2) {
        const p = r.profiles
        if (p?.id && !servantMap.has(p.id)) {
          servantMap.set(p.id, { id: p.id, fullName: p.full_name ?? '', gender: p.gender ?? null })
        }
      }

      // Build servant → kids map
      const activeAssigns = typedAssignRows.filter(r => (r.status ?? 'active') === 'active')
      const localAssigns = typedAssignRows.filter(r => r.status === 'local_friend')
      const otherServantAssigns = typedAssignRows.filter(r => r.status === 'other_servant')
      const assignedByServant = new Map<string, AssignableKid[]>()
      const assignedStudentIds = new Set<string>()
      const localStudentIds = new Set<string>()

      for (const r of activeAssigns) {
        const student = allStudents.find(s => s.id === r.student_id)
        if (!student || !r.student_id || !r.servant_id) continue
        assignedStudentIds.add(r.student_id)
        const kid: AssignableKid = {
          student,
          assignment: rowToAssignment(r, ''),
        }
        const list = assignedByServant.get(r.servant_id) ?? []
        list.push(kid)
        assignedByServant.set(r.servant_id, list)
      }

      for (const r of localAssigns) {
        if (r.student_id) localStudentIds.add(r.student_id)
      }

      // Collect kids in the "other servants not on app" bucket (status = 'other_servant')
      const phantomKids: AssignableKid[] = []
      for (const r of otherServantAssigns) {
        const student = allStudents.find(s => s.id === r.student_id)
        if (!student || !r.student_id) continue
        assignedStudentIds.add(r.student_id)
        phantomKids.push({ student, assignment: rowToAssignment(r, '') })
      }

      const builtServants: ManageServant[] = [
        ...Array.from(servantMap.values()).map(sv => ({
          ...sv,
          assignedKids: assignedByServant.get(sv.id) ?? [],
        })),
        { id: PHANTOM_SERVANT_ID, fullName: PHANTOM_SERVANT_NAME, gender: null, assignedKids: phantomKids },
      ]

      const unassignedStudents = allStudents.filter(s => !assignedStudentIds.has(s.id) && !localStudentIds.has(s.id))

      const localFriendKids: AssignedKid[] = localAssigns
        .filter(r => r.student_id !== null)
        .map(r => {
          const student = allStudents.find(s => s.id === r.student_id)!
          return { assignment: rowToAssignment(r, ''), student, visits: [], lastVisit: undefined }
        })

      setServants(builtServants)
      setUnassigned(unassignedStudents)
      setLocalFriends(localFriendKids)
    } catch (err: any) {
      setError(err.message || 'Failed to load management data')
      setServants([])
      setUnassigned([])
      setLocalFriends([])
    } finally {
      setLoading(false)
    }
  }, [isTourMode, profile])

  useEffect(() => {
    fetchManagement()
  }, [fetchManagement])

  async function assignKid(studentId: string, servantId: string): Promise<{ error: any }> {
    if (isTourMode) {
      const student = [...unassigned, ...servants.flatMap(s => s.assignedKids.map(k => k.student))].find(s => s.id === studentId)
      if (!student) return { error: null }
      const newAssignment: OutreachAssignment = {
        id: `oa-${Date.now()}`,
        servantId,
        studentId,
        gradeName: '',
        assignedAt: new Date().toISOString(),
        status: 'active',
      }
      setServants(prev => prev.map(sv =>
        sv.id !== servantId ? sv : {
          ...sv,
          assignedKids: [...sv.assignedKids, { student, assignment: newAssignment }],
        }
      ))
      setUnassigned(prev => prev.filter(s => s.id !== studentId))
      return { error: null }
    }

    const isPhantom = servantId === PHANTOM_SERVANT_ID
    const { error } = await supabase
      .from(TABLES.OUTREACH_ASSIGNMENTS)
      .insert({
        student_id: studentId,
        servant_id: isPhantom ? null : servantId,
        status: isPhantom ? 'other_servant' : 'active',
      })
    if (!error) await fetchManagement()
    return { error }
  }

  async function reassignKid(assignmentId: string, newServantId: string): Promise<{ error: any }> {
    if (isTourMode) {
      let found: AssignableKid | null = null
      setServants(prev => {
        const updated = prev.map(sv => {
          const idx = sv.assignedKids.findIndex(k => k.assignment?.id === assignmentId)
          if (idx === -1) return sv
          found = sv.assignedKids[idx]
          return { ...sv, assignedKids: sv.assignedKids.filter((_, i) => i !== idx) }
        })
        if (!found) return prev
        const movedKid = found as AssignableKid
        const newAssignment: OutreachAssignment = { ...movedKid.assignment!, servantId: newServantId }
        return updated.map(sv =>
          sv.id !== newServantId ? sv : {
            ...sv,
            assignedKids: [...sv.assignedKids, { student: movedKid.student, assignment: newAssignment }],
          }
        )
      })
      return { error: null }
    }

    const update = newServantId === PHANTOM_SERVANT_ID
      ? { servant_id: null, status: 'other_servant' }
      : { servant_id: newServantId, status: 'active' }
    const { error } = await supabase
      .from(TABLES.OUTREACH_ASSIGNMENTS)
      .update(update)
      .eq('id', assignmentId)
    if (!error) await fetchManagement()
    return { error }
  }

  async function unassignKid(assignmentId: string): Promise<{ error: any }> {
    if (isTourMode) {
      let removedStudent: Student | null = null
      setServants(prev => prev.map(sv => {
        const idx = sv.assignedKids.findIndex(k => k.assignment?.id === assignmentId)
        if (idx === -1) return sv
        removedStudent = sv.assignedKids[idx].student
        return { ...sv, assignedKids: sv.assignedKids.filter((_, i) => i !== idx) }
      }))
      if (removedStudent) setUnassigned(prev => [...prev, removedStudent!])
      return { error: null }
    }

    const { error } = await supabase
      .from(TABLES.OUTREACH_ASSIGNMENTS)
      .delete()
      .eq('id', assignmentId)
    if (!error) await fetchManagement()
    return { error }
  }

  async function markLocalFriend(assignmentId: string): Promise<{ error: any }> {
    if (isTourMode) {
      let found: AssignableKid | null = null
      setServants(prev => prev.map(sv => {
        const idx = sv.assignedKids.findIndex(k => k.assignment?.id === assignmentId)
        if (idx === -1) return sv
        found = sv.assignedKids[idx]
        return { ...sv, assignedKids: sv.assignedKids.filter((_, i) => i !== idx) }
      }))
      if (found) {
        const movedKid = found as AssignableKid
        const updatedAssign: OutreachAssignment = { ...movedKid.assignment!, status: 'local_friend' }
        setLocalFriends(prev => [...prev, { student: movedKid.student, assignment: updatedAssign, visits: [], lastVisit: undefined }])
      }
      return { error: null }
    }

    const { error } = await supabase
      .from(TABLES.OUTREACH_ASSIGNMENTS)
      .update({ status: 'local_friend' })
      .eq('id', assignmentId)
    if (!error) await fetchManagement()
    return { error }
  }

  async function unmarkLocalFriend(assignmentId: string): Promise<{ error: any }> {
    if (isTourMode) {
      let found: AssignedKid | null = null
      setLocalFriends(prev => {
        const idx = prev.findIndex(k => k.assignment.id === assignmentId)
        if (idx === -1) return prev
        found = prev[idx]
        return prev.filter((_, i) => i !== idx)
      })
      if (found) {
        const movedKid = found as AssignedKid
        const updatedAssign: OutreachAssignment = { ...movedKid.assignment, status: 'active' }
        setServants(prev => prev.map(sv =>
          sv.id !== movedKid.assignment.servantId ? sv : {
            ...sv,
            assignedKids: [...sv.assignedKids, { student: movedKid.student, assignment: updatedAssign }],
          }
        ))
      }
      return { error: null }
    }

    const { error } = await supabase
      .from(TABLES.OUTREACH_ASSIGNMENTS)
      .update({ status: 'active' })
      .eq('id', assignmentId)
    if (!error) await fetchManagement()
    return { error }
  }

  async function autoAssign(gender: 'male' | 'female'): Promise<{ error: any }> {
    const eligibleStudents = unassigned.filter(s => s.gender === gender)
    const eligibleServants = servants.filter(sv => sv.gender === gender)

    if (!eligibleStudents.length || !eligibleServants.length) return { error: null }

    if (isTourMode) {
      // Round-robin distribute
      const sorted = [...eligibleServants].sort((a, b) => a.assignedKids.length - b.assignedKids.length)
      const newAssignments = new Map<string, Student[]>()
      for (const sv of sorted) newAssignments.set(sv.id, [])

      eligibleStudents.forEach((student, i) => {
        const servant = sorted[i % sorted.length]
        newAssignments.get(servant.id)!.push(student)
      })

      setServants(prev => prev.map(sv => {
        const newKids = newAssignments.get(sv.id)
        if (!newKids?.length) return sv
        const added: AssignableKid[] = newKids.map(s => ({
          student: s,
          assignment: {
            id: `oa-${Date.now()}-${s.id}`,
            servantId: sv.id,
            studentId: s.id,
            gradeName: '',
            assignedAt: new Date().toISOString(),
            status: 'active' as const,
          },
        }))
        return { ...sv, assignedKids: [...sv.assignedKids, ...added] }
      }))
      setUnassigned(prev => prev.filter(s => s.gender !== gender))
      return { error: null }
    }

    // Real mode: sort servants by current load, round-robin, bulk insert
    const sorted = [...eligibleServants].sort((a, b) => a.assignedKids.length - b.assignedKids.length)
    const rows = eligibleStudents.map((student, i) => ({
      student_id: student.id,
      servant_id: sorted[i % sorted.length].id,
      status: 'active',
    }))

    const { error } = await supabase.from(TABLES.OUTREACH_ASSIGNMENTS).insert(rows)
    if (!error) await fetchManagement()
    return { error }
  }

  async function bulkReassign(assignmentIds: string[], newServantId: string): Promise<{ error: any }> {
    if (!assignmentIds.length) return { error: null }

    if (isTourMode) {
      for (const id of assignmentIds) await reassignKid(id, newServantId)
      return { error: null }
    }

    const update = newServantId === PHANTOM_SERVANT_ID
      ? { servant_id: null, status: 'other_servant' }
      : { servant_id: newServantId, status: 'active' }
    const { error } = await supabase
      .from(TABLES.OUTREACH_ASSIGNMENTS)
      .update(update)
      .in('id', assignmentIds)
    if (!error) await fetchManagement()
    return { error }
  }

  async function bulkAssign(studentIds: string[], servantId: string): Promise<{ error: any }> {
    if (!studentIds.length) return { error: null }

    if (isTourMode) {
      for (const id of studentIds) await assignKid(id, servantId)
      return { error: null }
    }

    const isPhantom = servantId === PHANTOM_SERVANT_ID
    const rows = studentIds.map(student_id => ({
      student_id,
      servant_id: isPhantom ? null : servantId,
      status: isPhantom ? 'other_servant' : 'active',
    }))
    const { error } = await supabase.from(TABLES.OUTREACH_ASSIGNMENTS).insert(rows)
    if (!error) await fetchManagement()
    return { error }
  }

  return {
    servants,
    unassigned,
    localFriends,
    loading,
    error,
    refetch: fetchManagement,
    assignKid,
    reassignKid,
    unassignKid,
    markLocalFriend,
    unmarkLocalFriend,
    autoAssign,
    bulkReassign,
    bulkAssign,
  }
}
