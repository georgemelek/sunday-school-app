import React from 'react'
// import { NavigationContainer } from '@react-navigation/native'
// import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native'

// import { useAuth } from '../contexts/AuthContext'
// import { AuthStackParamList, ServantStackParamList, CoordinatorStackParamList } from '../types/navigation'

// Auth screens
// import LoginScreen from '../screens/auth/LoginScreen'
// import RegisterScreen from '../screens/auth/RegisterScreen'

// Servant screens
import DashboardScreen from '../screens/servant/DashboardScreen'
import MyGradesScreen from '../screens/servant/MyGradesScreen'
import GradeDetailScreen from '../screens/servant/GradeDetailScreen'
import AddStudentScreen from '../screens/servant/AddStudentScreen'
import EditStudentScreen from '../screens/servant/EditStudentScreen'
import TakeAttendanceScreen from '../screens/servant/TakeAttendanceScreen'
import SessionDetailScreen from '../screens/servant/SessionDetailScreen'
import type { Session } from '../hooks/useSessions'

// Coordinator screens
// import DashboardScreen from '../screens/coordinator/DashboardScreen'

// const AuthStack = createNativeStackNavigator<AuthStackParamList>()
// const ServantStack = createNativeStackNavigator<ServantStackParamList>()
// const CoordinatorStack = createNativeStackNavigator<CoordinatorStackParamList>()

// function AuthNavigator() {
//   return (
//     <AuthStack.Navigator
//       screenOptions={{
//         headerShown: false,
//       }}
//     >
//       <AuthStack.Screen name="Login" component={LoginScreen} />
//       <AuthStack.Screen name="Register" component={RegisterScreen} />
//     </AuthStack.Navigator>
//   )
// }

// function ServantNavigator() {
//   return (
//     <ServantStack.Navigator
//       screenOptions={{
//         headerStyle: {
//           backgroundColor: '#007AFF',
//         },
//         headerTintColor: '#fff',
//         headerTitleStyle: {
//           fontWeight: '600' as any,
//         },
//       }}
//     >
//       <ServantStack.Screen
//         name="MyGrades"
//         component={MyGradesScreen}
//         options={{ title: 'My Grades' }}
//       />
//     </ServantStack.Navigator>
//   )
// }

// function CoordinatorNavigator() {
//   return (
//     <CoordinatorStack.Navigator
//       screenOptions={{
//         headerStyle: {
//           backgroundColor: '#007AFF',
//         },
//         headerTintColor: '#fff',
//         headerTitleStyle: {
//           fontWeight: '600' as any,
//         },
//       }}
//     >
//       <CoordinatorStack.Screen
//         name="Dashboard"
//         component={DashboardScreen}
//         options={{ title: 'Dashboard' }}
//       />
//     </CoordinatorStack.Navigator>
//   )
// }

// function LoadingScreen() {
//   return (
//     <View style={styles.loadingContainer}>
//       <ActivityIndicator size="large" color="#007AFF" />
//     </View>
//   )
// }

function PlaceholderScreen() {
  const [selectedRole, setSelectedRole] = React.useState<'servant' | 'coordinator' | null>(null)
  const [currentScreen, setCurrentScreen] = React.useState<'dashboard' | 'grades' | 'gradeDetail' | 'addStudent' | 'editStudent' | 'takeAttendance' | 'sessionDetail'>('dashboard')
  const [selectedGrade, setSelectedGrade] = React.useState<{ id: string; name: string } | null>(null)
  const [selectedStudent, setSelectedStudent] = React.useState<any>(null)
  const [selectedSession, setSelectedSession] = React.useState<Session | null>(null)

  // Pass navigation handler to MyGradesScreen
  const handleGradePress = (gradeId: string, gradeName: string) => {
    setSelectedGrade({ id: gradeId, name: gradeName })
    setCurrentScreen('gradeDetail')
  }

  const handleNavigateToDashboard = () => {
    setCurrentScreen('dashboard')
    setSelectedGrade(null)
    setSelectedStudent(null)
    setSelectedSession(null)
  }

  const handleNavigateToGrades = () => {
    setCurrentScreen('grades')
  }

  const handleBackToGrades = () => {
    setCurrentScreen('grades')
    setSelectedGrade(null)
    setSelectedStudent(null)
  }

  const handleBackToDetail = () => {
    setCurrentScreen('gradeDetail')
    setSelectedStudent(null)
  }

  const handleAddStudent = () => {
    setCurrentScreen('addStudent')
  }

  const handleEditStudent = (student: any) => {
    setSelectedStudent(student)
    setCurrentScreen('editStudent')
  }

  const handleTakeAttendance = () => {
    setCurrentScreen('takeAttendance')
  }

  const handleNavigateToSessionDetail = (session: Session) => {
    setCurrentScreen('sessionDetail')
    setSelectedSession(session)
  }

  if (selectedRole === 'servant') {
    if (currentScreen === 'takeAttendance' && selectedGrade) {
      return (
        <TakeAttendanceScreen
          gradeId={selectedGrade.id}
          gradeName={selectedGrade.name}
          onBack={selectedSession ? () => {
            setCurrentScreen('sessionDetail')
            setSelectedGrade(null)
          } : handleBackToDetail}
        />
      )
    }

    if (currentScreen === 'addStudent' && selectedGrade) {
      return (
        <AddStudentScreen
          gradeId={selectedGrade.id}
          gradeName={selectedGrade.name}
          onBack={handleBackToDetail}
        />
      )
    }

    if (currentScreen === 'editStudent' && selectedGrade && selectedStudent) {
      return (
        <EditStudentScreen
          gradeId={selectedGrade.id}
          gradeName={selectedGrade.name}
          student={selectedStudent}
          onBack={handleBackToDetail}
        />
      )
    }

    if (currentScreen === 'gradeDetail' && selectedGrade) {
      return (
        <GradeDetailScreen
          gradeId={selectedGrade.id}
          gradeName={selectedGrade.name}
          onBack={handleBackToGrades}
          onAddStudent={handleAddStudent}
          onEditStudent={handleEditStudent}
          onTakeAttendance={handleTakeAttendance}
        />
      )
    }
    if (currentScreen === 'grades') {
      return <MyGradesScreen onGradePress={handleGradePress} onBack={handleNavigateToDashboard} />
    }

    if (currentScreen === 'sessionDetail' && selectedSession) {
      return (
        <SessionDetailScreen
          session={selectedSession}
          onBack={handleNavigateToDashboard}
          onTakeAttendance={(gradeId, gradeName) => {
            setSelectedGrade({ id: gradeId, name: gradeName })
            setCurrentScreen('takeAttendance')
          }}
        />
      )
    }

    return (
      <DashboardScreen
        onNavigateToGrades={handleNavigateToGrades}
        onSessionPress={handleNavigateToSessionDetail}
      />
    )
  }

  if (selectedRole === 'coordinator') {
    return <Text style={styles.title}>Coordinator Screen Coming Soon</Text>
  }

  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.title}>Sunday School App</Text>
      <Text style={styles.subtitle}>Development Mode</Text>
      <Text style={styles.message}>Select a role to test:</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => setSelectedRole('servant')}
        >
          <Text style={styles.roleButtonText}>Servant View</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => setSelectedRole('coordinator')}
        >
          <Text style={styles.roleButtonText}>Coordinator View</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default function RootNavigator() {
  // const { session, profile, loading } = useAuth()

  return <PlaceholderScreen />

  // return (
  //   <NavigationContainer>
  //     {loading ? (
  //       <LoadingScreen />
  //     ) : session && profile ? (
  //       // Show role-specific navigator based on user role
  //       profile.role === 'servant' ? (
  //         <ServantNavigator />
  //       ) : profile.role === 'coordinator' || profile.role === 'priest' ? (
  //         <CoordinatorNavigator />
  //       ) : (
  //         <AuthNavigator />
  //       )
  //     ) : (
  //       <AuthNavigator />
  //     )}
  //   </NavigationContainer>
  // )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#007AFF',
    marginBottom: 16,
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  roleButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  roleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
