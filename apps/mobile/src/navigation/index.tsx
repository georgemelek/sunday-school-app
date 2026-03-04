import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import type {
  ServantTabParamList,
  DashboardStackParamList,
  GradesStackParamList,
  AvailabilityStackParamList,
  OutreachStackParamList,
  SettingsStackParamList,
  CoordinatorTabParamList,
  CoordDashboardStackParamList,
  CoordScheduleStackParamList,
  CoordStaffingStackParamList,
} from '../types/navigation'

// Servant screens
import DashboardScreen from '../screens/servant/DashboardScreen'
import MyGradesScreen from '../screens/servant/MyGradesScreen'
import GradeDetailScreen from '../screens/servant/GradeDetailScreen'
import AddStudentScreen from '../screens/servant/AddStudentScreen'
import EditStudentScreen from '../screens/servant/EditStudentScreen'
import TakeAttendanceScreen from '../screens/servant/TakeAttendanceScreen'
import SessionDetailScreen from '../screens/servant/SessionDetailScreen'
import AvailabilityScreen from '../screens/servant/AvailabilityScreen'
import OutreachScreen from '../screens/servant/OutreachScreen'
import OutreachDetailScreen from '../screens/servant/OutreachDetailScreen'
import { useOutreach } from '../hooks/useOutreach'

// Coordinator screens
import CoordinatorDashboardScreen from '../screens/coordinator/CoordinatorDashboardScreen'
import AttendanceReportScreen from '../screens/coordinator/AttendanceReportScreen'
import ScheduleScreen from '../screens/coordinator/ScheduleScreen'
import SessionListScreen from '../screens/coordinator/SessionListScreen'
import SessionFormScreen from '../screens/coordinator/SessionFormScreen'
import StaffingScreen from '../screens/coordinator/StaffingScreen'

import { useClasses } from '../hooks/useClasses'

// --- Servant Stack Navigators ---

const DashboardStack = createNativeStackNavigator<DashboardStackParamList>()
const GradesStack = createNativeStackNavigator<GradesStackParamList>()
const AvailabilityStack = createNativeStackNavigator<AvailabilityStackParamList>()
const OutreachStack = createNativeStackNavigator<OutreachStackParamList>()
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>()
const Tab = createBottomTabNavigator<ServantTabParamList>()

// --- Coordinator Stack Navigators ---

const CoordDashboardStack = createNativeStackNavigator<CoordDashboardStackParamList>()
const CoordScheduleStack = createNativeStackNavigator<CoordScheduleStackParamList>()
const CoordStaffingStack = createNativeStackNavigator<CoordStaffingStackParamList>()
const CoordTab = createBottomTabNavigator<CoordinatorTabParamList>()

// --- Dashboard Tab Stack ---

function DashboardStackNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="Dashboard">
        {({ navigation }) => (
          <DashboardScreen
            onNavigateToGrades={() =>
              navigation.getParent()?.navigate('GradesTab')
            }
            onNavigateToAvailability={() =>
              navigation.getParent()?.navigate('AvailabilityTab')
            }
            onSessionPress={(session) =>
              navigation.navigate('SessionDetail', { session })
            }
          />
        )}
      </DashboardStack.Screen>

      <DashboardStack.Screen name="SessionDetail">
        {({ navigation, route }) => (
          <SessionDetailScreen
            session={route.params.session}
            onBack={() => navigation.goBack()}
            onTakeAttendance={(gradeId, gradeName) =>
              navigation.navigate('TakeAttendance', { gradeId, gradeName })
            }
          />
        )}
      </DashboardStack.Screen>

      <DashboardStack.Screen name="TakeAttendance">
        {({ navigation, route }) => (
          <TakeAttendanceScreen
            gradeId={route.params.gradeId}
            gradeName={route.params.gradeName}
            onBack={() => navigation.goBack()}
          />
        )}
      </DashboardStack.Screen>
    </DashboardStack.Navigator>
  )
}

// --- Grades Tab Stack ---

function GradesStackNavigator() {
  return (
    <GradesStack.Navigator screenOptions={{ headerShown: false }}>
      <GradesStack.Screen name="MyGrades">
        {({ navigation }) => (
          <MyGradesScreen
            onGradePress={(gradeId, gradeName) =>
              navigation.navigate('GradeDetail', { gradeId, gradeName })
            }
          />
        )}
      </GradesStack.Screen>

      <GradesStack.Screen name="GradeDetail">
        {({ navigation, route }) => (
          <GradeDetailScreen
            gradeId={route.params.gradeId}
            gradeName={route.params.gradeName}
            onBack={() => navigation.goBack()}
            onAddStudent={() =>
              navigation.navigate('AddStudent', {
                gradeId: route.params.gradeId,
                gradeName: route.params.gradeName,
              })
            }
            onEditStudent={(student) =>
              navigation.navigate('EditStudent', {
                gradeId: route.params.gradeId,
                gradeName: route.params.gradeName,
                student,
              })
            }
            onTakeAttendance={() =>
              navigation.navigate('TakeAttendance', {
                gradeId: route.params.gradeId,
                gradeName: route.params.gradeName,
              })
            }
          />
        )}
      </GradesStack.Screen>

      <GradesStack.Screen name="AddStudent">
        {({ navigation, route }) => (
          <AddStudentScreen
            gradeId={route.params.gradeId}
            gradeName={route.params.gradeName}
            onBack={() => navigation.goBack()}
          />
        )}
      </GradesStack.Screen>

      <GradesStack.Screen name="EditStudent">
        {({ navigation, route }) => (
          <EditStudentScreen
            gradeId={route.params.gradeId}
            gradeName={route.params.gradeName}
            student={route.params.student}
            onBack={() => navigation.goBack()}
          />
        )}
      </GradesStack.Screen>

      <GradesStack.Screen name="TakeAttendance">
        {({ navigation, route }) => (
          <TakeAttendanceScreen
            gradeId={route.params.gradeId}
            gradeName={route.params.gradeName}
            onBack={() => navigation.goBack()}
          />
        )}
      </GradesStack.Screen>
    </GradesStack.Navigator>
  )
}

// --- Availability Tab Stack ---

function AvailabilityStackNavigator() {
  return (
    <AvailabilityStack.Navigator screenOptions={{ headerShown: false }}>
      <AvailabilityStack.Screen name="Availability">
        {() => <AvailabilityScreen />}
      </AvailabilityStack.Screen>
    </AvailabilityStack.Navigator>
  )
}

// --- Outreach Tab Stack ---

function OutreachStackNavigator() {
  const { assignedKids, loading, refetch, logVisit } = useOutreach()

  return (
    <OutreachStack.Navigator screenOptions={{ headerShown: false }}>
      <OutreachStack.Screen name="Outreach">
        {({ navigation }) => (
          <OutreachScreen
            assignedKids={assignedKids}
            loading={loading}
            refetch={refetch}
            onKidPress={(assignedKid) =>
              navigation.navigate('OutreachDetail', { assignedKid })
            }
          />
        )}
      </OutreachStack.Screen>

      <OutreachStack.Screen name="OutreachDetail">
        {({ navigation, route }) => (
          <OutreachDetailScreen
            assignedKid={route.params.assignedKid}
            onBack={() => navigation.goBack()}
            onLogVisit={async (assignmentId, date, notes) => {
              await logVisit(assignmentId, date, notes)
              navigation.goBack()
            }}
          />
        )}
      </OutreachStack.Screen>
    </OutreachStack.Navigator>
  )
}

// --- Settings Tab Stack ---

function SettingsPlaceholder() {
  return (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderTitle}>Settings</Text>
      <Text style={styles.placeholderText}>Coming soon</Text>
    </View>
  )
}

function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="Settings" component={SettingsPlaceholder} />
    </SettingsStack.Navigator>
  )
}

// --- Servant Tab Navigator ---

function ServantTabNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            borderTopColor: '#e0e0e0',
          },
        }}
      >
        <Tab.Screen
          name="DashboardTab"
          component={DashboardStackNavigator}
          options={{
            tabBarLabel: 'Dashboard',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>{'\uD83C\uDFE0'}</Text>
            ),
          }}
        />
        <Tab.Screen
          name="GradesTab"
          component={GradesStackNavigator}
          options={{
            tabBarLabel: 'My Grades',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>{'\uD83D\uDCDA'}</Text>
            ),
          }}
        />
        <Tab.Screen
          name="AvailabilityTab"
          component={AvailabilityStackNavigator}
          options={{
            tabBarLabel: 'Availability',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>{'\uD83D\uDCC5'}</Text>
            ),
          }}
        />
        <Tab.Screen
          name="OutreachTab"
          component={OutreachStackNavigator}
          options={{
            tabBarLabel: 'Outreach',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>{'\uD83E\uDD1D'}</Text>
            ),
          }}
        />
        <Tab.Screen
          name="SettingsTab"
          component={SettingsStackNavigator}
          options={{
            tabBarLabel: 'Settings',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>{'\u2699\uFE0F'}</Text>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  )
}

// --- Coordinator Dashboard Stack ---

function CoordDashboardStackNavigator() {
  return (
    <CoordDashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <CoordDashboardStack.Screen name="Dashboard">
        {({ navigation }) => (
          <CoordinatorDashboardScreen
            onClassPress={(classId) => {
              navigation.getParent()?.navigate('ScheduleTab')
            }}
            onViewReport={() => navigation.navigate('AttendanceReport')}
            onViewStaffing={() => {
              navigation.getParent()?.navigate('StaffingTab')
            }}
          />
        )}
      </CoordDashboardStack.Screen>

      <CoordDashboardStack.Screen name="AttendanceReport">
        {({ navigation }) => (
          <AttendanceReportScreen onBack={() => navigation.goBack()} />
        )}
      </CoordDashboardStack.Screen>
    </CoordDashboardStack.Navigator>
  )
}

// --- Coordinator Schedule Stack ---

function CoordScheduleStackNavigator() {
  const { getClassById, getServantsByClassId } = useClasses()

  return (
    <CoordScheduleStack.Navigator screenOptions={{ headerShown: false }}>
      <CoordScheduleStack.Screen name="Schedule">
        {({ navigation }) => (
          <ScheduleScreen
            onClassPress={(classId, className) =>
              navigation.navigate('SessionList', { classId, className })
            }
          />
        )}
      </CoordScheduleStack.Screen>

      <CoordScheduleStack.Screen name="SessionList">
        {({ navigation, route }) => (
          <SessionListScreen
            classId={route.params.classId}
            className={route.params.className}
            onBack={() => navigation.goBack()}
            onSessionPress={(session) =>
              navigation.navigate('SessionForm', {
                classId: route.params.classId,
                session,
              })
            }
            onAddSession={(classId) =>
              navigation.navigate('SessionForm', { classId })
            }
          />
        )}
      </CoordScheduleStack.Screen>

      <CoordScheduleStack.Screen name="SessionForm">
        {({ navigation, route }) => {
          const cls = getClassById(route.params.classId)
          const servants = cls ? getServantsByClassId(cls.id) : []

          return (
            <SessionFormScreen
              classId={route.params.classId}
              session={route.params.session}
              servants={servants}
              defaultLocation={cls?.defaultLocation}
              defaultLocationAddress={cls?.defaultLocationAddress}
              onBack={() => navigation.goBack()}
              onSave={() => navigation.goBack()}
              onDelete={() => navigation.goBack()}
            />
          )
        }}
      </CoordScheduleStack.Screen>
    </CoordScheduleStack.Navigator>
  )
}

// --- Coordinator Staffing Stack ---

function CoordStaffingStackNavigator() {
  return (
    <CoordStaffingStack.Navigator screenOptions={{ headerShown: false }}>
      <CoordStaffingStack.Screen name="Staffing" component={StaffingScreen} />
    </CoordStaffingStack.Navigator>
  )
}

// --- Coordinator Tab Navigator ---

function CoordinatorTabNavigator() {
  return (
    <NavigationContainer>
      <CoordTab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            borderTopColor: '#e0e0e0',
          },
        }}
      >
        <CoordTab.Screen
          name="DashboardTab"
          component={CoordDashboardStackNavigator}
          options={{
            tabBarLabel: 'Dashboard',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>{'\uD83D\uDCCA'}</Text>
            ),
          }}
        />
        <CoordTab.Screen
          name="ScheduleTab"
          component={CoordScheduleStackNavigator}
          options={{
            tabBarLabel: 'Schedule',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>{'\uD83D\uDCC5'}</Text>
            ),
          }}
        />
        <CoordTab.Screen
          name="StaffingTab"
          component={CoordStaffingStackNavigator}
          options={{
            tabBarLabel: 'Staffing',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>{'\uD83D\uDC65'}</Text>
            ),
          }}
        />
        <CoordTab.Screen
          name="SettingsTab"
          component={SettingsStackNavigator}
          options={{
            tabBarLabel: 'Settings',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>{'\u2699\uFE0F'}</Text>
            ),
          }}
        />
      </CoordTab.Navigator>
    </NavigationContainer>
  )
}

// --- Root Navigator (role selector) ---

export default function RootNavigator() {
  const [selectedRole, setSelectedRole] = React.useState<'servant' | 'coordinator' | null>(null)

  if (selectedRole === 'servant') {
    return <ServantTabNavigator />
  }

  if (selectedRole === 'coordinator') {
    return <CoordinatorTabNavigator />
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
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
  },
})
