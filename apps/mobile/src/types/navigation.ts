import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'

// Auth Stack
export type AuthStackParamList = {
  Login: undefined
  Register: undefined
}

// Servant Stack
export type ServantStackParamList = {
  MyGrades: undefined
  GradeDetail: { gradeId: string; gradeName: string }
  TakeAttendance: { gradeId: string; gradeName: string }
  AddStudent: { gradeId: string }
  EditStudent: { studentId: string; gradeId: string }
  Profile: undefined
}

// Coordinator Stack
export type CoordinatorStackParamList = {
  Dashboard: undefined
  GradeAttendance: { gradeId: string; gradeName: string }
  AttendanceReport: undefined
  Profile: undefined
}

// Root Stack
export type RootStackParamList = {
  Auth: undefined
  Servant: undefined
  Coordinator: undefined
}

// Navigation prop types
export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>
export type ServantNavigationProp = NativeStackNavigationProp<ServantStackParamList>
export type CoordinatorNavigationProp = NativeStackNavigationProp<CoordinatorStackParamList>

// Route prop types
export type AuthRouteProp<T extends keyof AuthStackParamList> = RouteProp<AuthStackParamList, T>
export type ServantRouteProp<T extends keyof ServantStackParamList> = RouteProp<ServantStackParamList, T>
export type CoordinatorRouteProp<T extends keyof CoordinatorStackParamList> = RouteProp<CoordinatorStackParamList, T>
