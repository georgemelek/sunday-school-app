import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import type { Session } from '../hooks/useSessions'
import type { Student } from '../hooks/useStudents'
import type { AssignedKid } from '../hooks/useOutreach'

// --- Servant Tab Navigator ---

export type ServantTabParamList = {
  DashboardTab: undefined
  GradesTab: undefined
  AvailabilityTab: undefined
  OutreachTab: undefined
  SettingsTab: undefined
}

// --- Dashboard Stack ---

export type DashboardStackParamList = {
  Dashboard: undefined
  SessionDetail: { session: Session }
  TakeAttendance: { gradeId: string; gradeName: string }
}

// --- Grades Stack ---

export type GradesStackParamList = {
  MyGrades: undefined
  Onboarding: undefined
  GradeDetail: { gradeId: string; gradeName: string }
  AddStudent: { gradeId: string; gradeName: string }
  EditStudent: { gradeId: string; gradeName: string; student: Student }
  TakeAttendance: { gradeId: string; gradeName: string }
}

// --- Availability Stack ---

export type AvailabilityStackParamList = {
  Availability: undefined
}

// --- Outreach Stack ---

export type OutreachStackParamList = {
  Outreach: undefined
  OutreachDetail: { assignedKid: AssignedKid }
}

// --- Settings Stack ---

export type SettingsStackParamList = {
  Settings: undefined
}

// --- Navigation prop types ---

export type DashboardStackNavProp = NativeStackNavigationProp<DashboardStackParamList>
export type GradesStackNavProp = NativeStackNavigationProp<GradesStackParamList>
export type AvailabilityStackNavProp = NativeStackNavigationProp<AvailabilityStackParamList>
export type OutreachStackNavProp = NativeStackNavigationProp<OutreachStackParamList>
export type SettingsStackNavProp = NativeStackNavigationProp<SettingsStackParamList>

// --- Route prop types ---

export type DashboardStackRouteProp<T extends keyof DashboardStackParamList> = RouteProp<DashboardStackParamList, T>
export type GradesStackRouteProp<T extends keyof GradesStackParamList> = RouteProp<GradesStackParamList, T>

// --- Auth Stack (preserved for future use) ---

export type AuthStackParamList = {
  Login: undefined
  Register: undefined
}

// --- Coordinator Tab Navigator ---

export type CoordinatorTabParamList = {
  DashboardTab: undefined
  ScheduleTab: undefined
  StaffingTab: undefined
  SettingsTab: undefined
}

// --- Coordinator Dashboard Stack ---

export type CoordDashboardStackParamList = {
  Dashboard: undefined
  AttendanceReport: undefined
}

// --- Coordinator Schedule Stack ---

export type CoordScheduleStackParamList = {
  Schedule: undefined
  SessionList: { classId: string; className: string }
  SessionForm: { classId: string; session?: Session }
}

// --- Coordinator Staffing Stack ---

export type CoordStaffingStackParamList = {
  Staffing: undefined
}

// --- Coordinator nav prop types ---

export type CoordDashboardStackNavProp = NativeStackNavigationProp<CoordDashboardStackParamList>
export type CoordScheduleStackNavProp = NativeStackNavigationProp<CoordScheduleStackParamList>
export type CoordStaffingStackNavProp = NativeStackNavigationProp<CoordStaffingStackParamList>

// --- Coordinator route prop types ---

export type CoordScheduleStackRouteProp<T extends keyof CoordScheduleStackParamList> = RouteProp<CoordScheduleStackParamList, T>
