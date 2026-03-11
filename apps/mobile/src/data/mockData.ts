// Shared mock data constants used across hooks and tour mode.
// All names are fictional — no real people are represented.

import type { Student } from '../hooks/useStudents'
import type { OutreachAssignment, OutreachVisit } from '../hooks/useOutreach'

export interface Servant {
  id: string
  fullName: string
  gender?: string
}

export interface ClassType {
  id: string
  name: 'Sunday School' | 'Small Group' | 'FNA' | 'Bible Study'
}

export interface ClassInfo {
  id: string
  classTypeId: string
  name: string
  description: string
  defaultLocation: string
  defaultLocationAddress: string
  defaultDayOfWeek: number // 0=Sun, 1=Mon, ..., 6=Sat
  defaultStartTime: string // HH:mm
  defaultEndTime: string // HH:mm
  servantIds: string[]
  gradeIds: string[]
}

export interface GradeRef {
  id: string
  name: string
}

// Placeholder for the logged-in user in tour mode.
// In real mode, always use profile.id / profile.full_name from AuthContext.
export const CURRENT_USER: Servant = {
  id: 'servant-1',
  fullName: 'Demo User',
}

// All servants in the tour-mode class roster (fictional names)
export const MOCK_SERVANTS: Servant[] = [
  { id: 'servant-1', fullName: 'Alex Martin',    gender: 'male'   },
  { id: 'servant-2', fullName: 'Jordan Taylor',  gender: 'male'   },
  { id: 'servant-3', fullName: 'Riley Morgan',   gender: 'female' },
  { id: 'servant-4', fullName: 'Casey Brooks',   gender: 'female' },
  { id: 'servant-5', fullName: 'Sam Rivera',     gender: 'male'   },
  { id: 'servant-6', fullName: 'Dana Nguyen',    gender: 'female' },
  { id: 'servant-7', fullName: 'Morgan Ellis',   gender: 'female' },
  { id: 'servant-8', fullName: 'Taylor Reed',    gender: 'male'   },
  { id: 'servant-9', fullName: 'Quinn Foster',   gender: 'female' },
]

// Class types
export const MOCK_CLASS_TYPES: ClassType[] = [
  { id: 'ct-1', name: 'Sunday School' },
  { id: 'ct-2', name: 'Small Group' },
  { id: 'ct-3', name: 'FNA' },
  { id: 'ct-4', name: 'Bible Study' },
]

// Grades
export const MOCK_GRADES: GradeRef[] = [
  { id: 'grade-5', name: '5th Grade' },
  { id: 'grade-6', name: '6th Grade' },
]

// Classes the demo user is assigned to
export const MOCK_CLASSES: ClassInfo[] = [
  {
    id: 'class-1',
    classTypeId: 'ct-1',
    name: '6th Grade Sunday School',
    description: '6th grade boys & girls weekly Sunday School class',
    defaultLocation: 'St. Mary Coptic Orthodox Church',
    defaultLocationAddress: '1233 W Ogden Ave, Naperville, IL 60563',
    defaultDayOfWeek: 0,
    defaultStartTime: '11:30',
    defaultEndTime: '12:30',
    servantIds: [
      'servant-1', 'servant-2', 'servant-3', 'servant-4',
      'servant-5', 'servant-6', 'servant-7', 'servant-8', 'servant-9',
    ],
    gradeIds: ['grade-6'],
  },
  {
    id: 'class-2',
    classTypeId: 'ct-2',
    name: '6th Grade Boys Small Group',
    description: 'Smaller, intimate group for 6th grade boys with separate curriculum',
    defaultLocation: 'Rotating homes',
    defaultLocationAddress: '',
    defaultDayOfWeek: 2,
    defaultStartTime: '19:00',
    defaultEndTime: '20:30',
    servantIds: ['servant-1', 'servant-2', 'servant-5', 'servant-8'],
    gradeIds: ['grade-6'],
  },
  {
    id: 'class-3',
    classTypeId: 'ct-3',
    name: '5th & 6th Grade FNA',
    description: 'Friday Night Activities — non-spiritual hangouts at fun venues',
    defaultLocation: 'Varies',
    defaultLocationAddress: '',
    defaultDayOfWeek: 5,
    defaultStartTime: '19:00',
    defaultEndTime: '21:00',
    servantIds: [
      'servant-1', 'servant-2', 'servant-3', 'servant-4',
      'servant-5', 'servant-6', 'servant-7', 'servant-8', 'servant-9',
    ],
    gradeIds: ['grade-5', 'grade-6'],
  },
]

// ─── Outreach mock data ────────────────────────────────────────────────────────

export const MOCK_OUTREACH_STUDENTS: Student[] = [
  {
    id: '1', grade_id: 'grade-6', first_name: 'Ethan', last_name: 'Wallace',
    date_of_birth: '2010-05-15', gender: 'male', student_phone: null,
    mother_first_name: 'Linda', mother_last_name: 'Wallace',
    mother_phone: '555-0101', mother_email: 'linda@example.com',
    father_first_name: 'Bruce', father_last_name: 'Wallace',
    father_phone: '555-0102', father_email: null,
    street: '1234 Maple St', city: 'Naperville', state: 'IL', zip: '60540', country: 'USA',
    notes: null, created_by: 'user-1', created_at: '2025-09-01T00:00:00Z', updated_at: '2025-09-01T00:00:00Z',
  },
  {
    id: '3', grade_id: 'grade-6', first_name: 'Noah', last_name: 'Patel',
    date_of_birth: '2010-03-10', gender: 'male', student_phone: null,
    mother_first_name: 'Priya', mother_last_name: 'Patel',
    mother_phone: '555-0103', mother_email: 'priya@example.com',
    father_first_name: null, father_last_name: null,
    father_phone: null, father_email: null,
    street: '789 Oak Ave', city: 'Aurora', state: 'IL', zip: '60505', country: 'USA',
    notes: 'Allergic to peanuts', created_by: 'user-1', created_at: '2025-09-01T00:00:00Z', updated_at: '2025-09-01T00:00:00Z',
  },
  {
    id: '5', grade_id: 'grade-6', first_name: 'Lucas', last_name: 'Hoffman',
    date_of_birth: '2010-07-20', gender: 'male', student_phone: null,
    mother_first_name: null, mother_last_name: null,
    mother_phone: '555-0105', mother_email: 'diane@example.com',
    father_first_name: 'Diane', father_last_name: 'Hoffman',
    father_phone: '555-0106', father_email: null,
    street: '456 Elm Blvd', city: 'Naperville', state: 'IL', zip: '60540', country: 'USA',
    notes: null, created_by: 'user-1', created_at: '2025-09-01T00:00:00Z', updated_at: '2025-09-01T00:00:00Z',
  },
  {
    id: '6', grade_id: 'grade-6', first_name: 'Owen', last_name: 'Barrett',
    date_of_birth: '2010-12-05', gender: 'male', student_phone: null,
    mother_first_name: null, mother_last_name: null,
    mother_phone: '555-0107', mother_email: 'carol@example.com',
    father_first_name: null, father_last_name: null,
    father_phone: null, father_email: null,
    street: '321 Cedar Ln', city: 'Naperville', state: 'IL', zip: '60540', country: 'USA',
    notes: null, created_by: 'user-1', created_at: '2025-09-01T00:00:00Z', updated_at: '2025-09-01T00:00:00Z',
  },
  {
    id: '7', grade_id: 'grade-6', first_name: 'Liam', last_name: 'Grant',
    date_of_birth: '2010-09-14', gender: 'male', student_phone: null,
    mother_first_name: null, mother_last_name: null,
    mother_phone: null, mother_email: null,
    father_first_name: null, father_last_name: null,
    father_phone: null, father_email: null,
    street: null, city: 'Naperville', state: 'IL', zip: '60540', country: 'USA',
    notes: null, created_by: 'user-1', created_at: '2025-09-01T00:00:00Z', updated_at: '2025-09-01T00:00:00Z',
  },
]

export const MOCK_OUTREACH_ASSIGNMENTS: OutreachAssignment[] = [
  { id: 'oa-1', servantId: 'servant-1', studentId: '1', gradeName: '6th Grade', assignedAt: '2025-09-15T00:00:00Z', status: 'active' },
  { id: 'oa-2', servantId: 'servant-1', studentId: '3', gradeName: '6th Grade', assignedAt: '2025-09-15T00:00:00Z', status: 'active' },
  { id: 'oa-3', servantId: 'servant-1', studentId: '5', gradeName: '6th Grade', assignedAt: '2025-09-15T00:00:00Z', status: 'active' },
  { id: 'oa-4', servantId: 'servant-2', studentId: '6', gradeName: '6th Grade', assignedAt: '2025-09-15T00:00:00Z', status: 'active' },
  { id: 'oa-5', servantId: 'servant-1', studentId: '7', gradeName: '6th Grade', assignedAt: '2025-09-15T00:00:00Z', status: 'local_friend' },
]

export const MOCK_OUTREACH_VISITS: OutreachVisit[] = [
  { id: 'ov-1', assignmentId: 'oa-1', visitDate: '2025-11-10', notes: "Went to Portillo's — had a great time!", type: 'visit', createdAt: '2025-11-10T20:00:00Z' },
  { id: 'ov-2', assignmentId: 'oa-1', visitDate: '2026-01-18', notes: 'Bowling at Brunswick Zone', type: 'visit', createdAt: '2026-01-18T21:00:00Z' },
  { id: 'ov-3', assignmentId: 'oa-3', visitDate: '2026-02-01', notes: "Got pizza at Lou Malnati's", type: 'visit', createdAt: '2026-02-01T19:30:00Z' },
]

// Servants used in the tour-mode outreach management view
export const MOCK_OUTREACH_SERVANTS: Servant[] = [
  { id: 'servant-1', fullName: 'Alex Martin',   gender: 'male' },
  { id: 'servant-2', fullName: 'Jordan Taylor', gender: 'male' },
]
