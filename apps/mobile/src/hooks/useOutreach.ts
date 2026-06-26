import { useState, useEffect, useCallback } from 'react'
import { useTour } from '../contexts/TourContext'
import { supabase } from '../lib/supabase'
import { TABLES } from '../lib/tables'
import { useAuth } from '../contexts/AuthContext'
import type { Student } from './useStudents'
import {
  MOCK_OUTREACH_STUDENTS,
  MOCK_OUTREACH_ASSIGNMENTS,
  MOCK_OUTREACH_VISITS,
  MOCK_OUTREACH_SERVANTS,
} from '../data/mockData'

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
        const myAssignments = MOCK_OUTREACH_ASSIGNMENTS.filter(a => a.servantId === myId)

        const buildKid = (a: OutreachAssignment): AssignedKid => {
          const student = MOCK_OUTREACH_STUDENTS.find(s => s.id === a.studentId)!
          const visits = MOCK_OUTREACH_VISITS
            .filter(v => v.assignmentId === a.id)
            .sort((x, y) => y.visitDate.localeCompare(x.visitDate))
          return { assignment: a, student, visits, lastVisit: visits[0] }
        }

        setAssignedKids(myAssignments.filter(a => a.status === 'active').map(buildKid))
        setLocalFriends(myAssignments.filter(a => a.status === 'local_friend').map(buildKid))

        // Grade overview: all servants
        const overview: GradeServantProgress[] = MOCK_OUTREACH_SERVANTS.map(servant => {
          const servantActive = MOCK_OUTREACH_ASSIGNMENTS.filter(a => a.servantId === servant.id && a.status === 'active')
          const visitedIds = new Set(MOCK_OUTREACH_VISITS.map(v => v.assignmentId))
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

        const assignedStudentIds = new Set(MOCK_OUTREACH_ASSIGNMENTS.filter(a => a.status === 'active').map(a => a.studentId))
        const localIds = new Set(MOCK_OUTREACH_ASSIGNMENTS.filter(a => a.status === 'local_friend').map(a => a.studentId))

        const builtServants: ManageServant[] = [
          ...MOCK_OUTREACH_SERVANTS.map(sv => ({
            id: sv.id,
            fullName: sv.fullName,
            gender: sv.gender ?? null,
            assignedKids: MOCK_OUTREACH_STUDENTS
              .filter(s => {
                const a = MOCK_OUTREACH_ASSIGNMENTS.find(a => a.studentId === s.id && a.servantId === sv.id && a.status === 'active')
                return !!a
              })
              .map(s => ({
                student: s,
                assignment: MOCK_OUTREACH_ASSIGNMENTS.find(a => a.studentId === s.id && a.servantId === sv.id && a.status === 'active') ?? null,
              })),
          })),
          { id: PHANTOM_SERVANT_ID, fullName: PHANTOM_SERVANT_NAME, gender: null, assignedKids: [] },
        ]

        const unassignedStudents = MOCK_OUTREACH_STUDENTS.filter(s => !assignedStudentIds.has(s.id) && !localIds.has(s.id))

        const localFriendKids: AssignedKid[] = MOCK_OUTREACH_ASSIGNMENTS
          .filter(a => a.status === 'local_friend')
          .map(a => {
            const student = MOCK_OUTREACH_STUDENTS.find(s => s.id === a.studentId)!
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

// ─── useOutreachClaim ─────────────────────────────────────────────────────────
// Opt-in model: servant sees all kids in their grades and self-selects who they're responsible for.

export interface ClaimableKid {
  student: Student
  assignmentId: string | null  // null = not claimed by anyone yet (or by this servant)
  claimedByMe: boolean
}

export function useOutreachClaim() {
  const { isTourMode } = useTour()
  const { profile } = useAuth()
  const [kids, setKids] = useState<ClaimableKid[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (isTourMode) {
        await new Promise(resolve => setTimeout(resolve, 300))
        const myId = 'servant-1'
        const result: ClaimableKid[] = MOCK_OUTREACH_STUDENTS.map(s => {
          const a = MOCK_OUTREACH_ASSIGNMENTS.find(a => a.studentId === s.id && a.servantId === myId && a.status === 'active')
          return { student: s, assignmentId: a?.id ?? null, claimedByMe: !!a }
        })
        setKids(result)
        return
      }

      if (!profile) { setKids([]); return }

      const { data: sgRows, error: sgError } = await supabase
        .from(TABLES.SERVANT_GRADES).select('grade_id').eq('servant_id', profile.id)
      if (sgError) throw sgError
      const gradeIds = (sgRows ?? []).map((r: any) => r.grade_id)
      if (!gradeIds.length) { setKids([]); return }

      const { data: studentRows, error: studentError } = await supabase
        .from(TABLES.STUDENTS).select('*').in('grade_id', gradeIds).order('first_name')
      if (studentError) throw studentError
      const allStudents: Student[] = studentRows ?? []

      const studentIds = allStudents.map(s => s.id)
      const { data: myAssigns } = studentIds.length
        ? await supabase
            .from(TABLES.OUTREACH_ASSIGNMENTS)
            .select('id, student_id')
            .eq('servant_id', profile.id)
            .in('student_id', studentIds)
            .in('status', ['active', 'local_friend'])
        : { data: [] }

      const myAssignMap = new Map((myAssigns ?? []).map((r: any) => [r.student_id, r.id]))

      setKids(allStudents.map(s => ({
        student: s,
        assignmentId: myAssignMap.get(s.id) ?? null,
        claimedByMe: myAssignMap.has(s.id),
      })))
    } catch (err: any) {
      setError(err.message || 'Failed to load kids')
    } finally {
      setLoading(false)
    }
  }, [isTourMode, profile])

  useEffect(() => { fetch() }, [fetch])

  async function claimKid(studentId: string) {
    if (isTourMode) {
      const id = `oa-${Date.now()}`
      setKids(prev => prev.map(k => k.student.id === studentId ? { ...k, assignmentId: id, claimedByMe: true } : k))
      return
    }
    const { data } = await supabase
      .from(TABLES.OUTREACH_ASSIGNMENTS)
      .insert({ student_id: studentId, servant_id: profile!.id, status: 'active' })
      .select('id')
      .single()
    setKids(prev => prev.map(k => k.student.id === studentId ? { ...k, assignmentId: data?.id ?? null, claimedByMe: true } : k))
  }

  async function unclaimKid(assignmentId: string, studentId: string) {
    if (isTourMode) {
      setKids(prev => prev.map(k => k.student.id === studentId ? { ...k, assignmentId: null, claimedByMe: false } : k))
      return
    }
    await supabase.from(TABLES.OUTREACH_ASSIGNMENTS).delete().eq('id', assignmentId)
    setKids(prev => prev.map(k => k.student.id === studentId ? { ...k, assignmentId: null, claimedByMe: false } : k))
  }

  return { kids, loading, error, refetch: fetch, claimKid, unclaimKid }
}

// ─── useCoordinatorOutreach ───────────────────────────────────────────────────

export interface CoordOutreachKid {
  studentId: string
  firstName: string
  lastName: string
  visited: boolean
}

export interface CoordOutreachServant {
  servantId: string
  servantName: string
  totalKids: number
  visitedKids: number
  kids: CoordOutreachKid[]
}

export interface CoordOutreachGrade {
  gradeId: string
  gradeName: string
  servants: CoordOutreachServant[]
  totalKids: number
  visitedKids: number
}

export function useCoordinatorOutreach() {
  // TODO: Scope by coordinator_grades junction table (per-ministry) once that table exists.
  // Currently fetches all grades in the coordinator's church (church-wide), meaning
  // coordinators from different ministries (e.g. elementary vs. middle school) will see
  // each other's outreach data. Fix by adding coordinator_grades and filtering here.
  const { profile } = useAuth()
  const [grades, setGrades] = useState<CoordOutreachGrade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (!profile?.church_id) {
        setGrades([])
        return
      }

      // 1. All grades in the church
      const { data: gradeRows, error: gradeError } = await supabase
        .from(TABLES.GRADES)
        .select('id, name')
        .eq('church_id', profile.church_id)
        .order('name')
      if (gradeError) throw gradeError
      if (!gradeRows?.length) { setGrades([]); return }

      const gradeIds = gradeRows.map((g: any) => g.id as string)

      // 2. All students in those grades (with names)
      const { data: studentRows, error: studentError } = await supabase
        .from(TABLES.STUDENTS)
        .select('id, grade_id, first_name, last_name')
        .in('grade_id', gradeIds)
      if (studentError) throw studentError
      const studentIds = (studentRows ?? []).map((s: any) => s.id as string)
      const studentGradeMap: Record<string, string> = {}
      const studentNameMap: Record<string, { first: string; last: string }> = {}
      for (const s of studentRows ?? []) {
        if (s.grade_id) studentGradeMap[s.id] = s.grade_id
        studentNameMap[s.id] = { first: s.first_name ?? '', last: s.last_name ?? '' }
      }

      // 3. All active outreach assignments for those students (with servant profiles)
      type AssignRow = { id: string; servant_id: string | null; student_id: string; profiles: { full_name: string | null } | null }
      const { data: assignRows, error: assignError } = studentIds.length
        ? await supabase
            .from(TABLES.OUTREACH_ASSIGNMENTS)
            .select('id, servant_id, student_id, profiles(full_name)')
            .in('student_id', studentIds)
            .eq('status', 'active')
        : { data: [] as AssignRow[], error: null }
      if (assignError) throw assignError
      const typedAssigns = (assignRows ?? []) as AssignRow[]

      // 4. Which assignments have at least one visit
      const assignIds = typedAssigns.map(a => a.id)
      const { data: visitRows } = assignIds.length
        ? await supabase
            .from(TABLES.OUTREACH_VISITS)
            .select('assignment_id')
            .in('assignment_id', assignIds)
        : { data: [] }
      const visitedSet = new Set((visitRows ?? []).map((v: any) => v.assignment_id as string))

      // 5. Build grade → servant → stats + kids map
      type ServantStats = { name: string; total: number; visited: number; kids: CoordOutreachKid[] }
      const gradeServantMap: Record<string, Record<string, ServantStats>> = {}
      for (const g of gradeRows) gradeServantMap[g.id] = {}

      for (const row of typedAssigns) {
        const gradeId = studentGradeMap[row.student_id]
        if (!gradeId || !row.servant_id) continue
        const svMap = gradeServantMap[gradeId]
        if (!svMap) continue
        if (!svMap[row.servant_id]) {
          svMap[row.servant_id] = { name: row.profiles?.full_name ?? 'Unknown', total: 0, visited: 0, kids: [] }
        }
        const wasVisited = visitedSet.has(row.id)
        const names = studentNameMap[row.student_id] ?? { first: '', last: '' }
        svMap[row.servant_id].kids.push({ studentId: row.student_id, firstName: names.first, lastName: names.last, visited: wasVisited })
        svMap[row.servant_id].total++
        if (wasVisited) svMap[row.servant_id].visited++
      }

      const result: CoordOutreachGrade[] = gradeRows.map((g: any) => {
        const svMap = gradeServantMap[g.id]
        const servants: CoordOutreachServant[] = Object.entries(svMap).map(([servantId, stats]) => ({
          servantId,
          servantName: stats.name,
          totalKids: stats.total,
          visitedKids: stats.visited,
          kids: stats.kids.sort((a, b) => a.firstName.localeCompare(b.firstName)),
        })).sort((a, b) => a.servantName.localeCompare(b.servantName))
        const totalKids = servants.reduce((s, sv) => s + sv.totalKids, 0)
        const visitedKids = servants.reduce((s, sv) => s + sv.visitedKids, 0)
        return { gradeId: g.id, gradeName: g.name, servants, totalKids, visitedKids }
      })

      setGrades(result)
    } catch (err: any) {
      setError(err.message ?? 'Failed to load outreach data')
      setGrades([])
    } finally {
      setLoading(false)
    }
  }, [profile?.church_id])

  useEffect(() => { fetch() }, [fetch])

  return { grades, loading, error, refetch: fetch }
}
