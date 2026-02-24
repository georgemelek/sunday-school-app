// Shared mock data constants used across hooks
// These will be replaced with Supabase queries in the integration phase

export interface Servant {
  id: string
  fullName: string
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

// Current logged-in user
export const CURRENT_USER: Servant = {
  id: 'servant-1',
  fullName: 'George Melek',
}

// All 6th grade servants
export const MOCK_SERVANTS: Servant[] = [
  { id: 'servant-1', fullName: 'George Melek' },
  { id: 'servant-2', fullName: 'Fady Roufail' },
  { id: 'servant-3', fullName: 'Revana Awadallah' },
  { id: 'servant-4', fullName: 'Monica Zaky' },
  { id: 'servant-5', fullName: 'Steven Yousef' },
  { id: 'servant-6', fullName: 'Koki Ishak' },
  { id: 'servant-7', fullName: 'Sarah Bekhet' },
  { id: 'servant-8', fullName: 'John Khillah' },
  { id: 'servant-9', fullName: 'Christina Ishak' },
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

// Classes George is assigned to
export const MOCK_CLASSES: ClassInfo[] = [
  {
    id: 'class-1',
    classTypeId: 'ct-1',
    name: '6th Grade Sunday School',
    description: '6th grade boys & girls weekly Sunday School class',
    defaultLocation: 'St. Mary Coptic Orthodox Church',
    defaultLocationAddress: '1233 W Ogden Ave, Naperville, IL 60563',
    defaultDayOfWeek: 0, // Sunday
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
    defaultDayOfWeek: 2, // Tuesday
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
    defaultDayOfWeek: 5, // Friday
    defaultStartTime: '19:00',
    defaultEndTime: '21:00',
    servantIds: [
      'servant-1', 'servant-2', 'servant-3', 'servant-4',
      'servant-5', 'servant-6', 'servant-7', 'servant-8', 'servant-9',
    ],
    gradeIds: ['grade-5', 'grade-6'],
  },
]
