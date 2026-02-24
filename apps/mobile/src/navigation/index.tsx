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
  SettingsStackParamList,
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

// --- Stack Navigators ---

const DashboardStack = createNativeStackNavigator<DashboardStackParamList>()
const GradesStack = createNativeStackNavigator<GradesStackParamList>()
const AvailabilityStack = createNativeStackNavigator<AvailabilityStackParamList>()
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>()
const Tab = createBottomTabNavigator<ServantTabParamList>()

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
              <Text style={{ fontSize: 20, color }}>{'🏠'}</Text>
            ),
          }}
        />
        <Tab.Screen
          name="GradesTab"
          component={GradesStackNavigator}
          options={{
            tabBarLabel: 'My Grades',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>{'📚'}</Text>
            ),
          }}
        />
        <Tab.Screen
          name="AvailabilityTab"
          component={AvailabilityStackNavigator}
          options={{
            tabBarLabel: 'Availability',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>{'📅'}</Text>
            ),
          }}
        />
        <Tab.Screen
          name="SettingsTab"
          component={SettingsStackNavigator}
          options={{
            tabBarLabel: 'Settings',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>{'⚙️'}</Text>
            ),
          }}
        />
      </Tab.Navigator>
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
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.title}>Coordinator Screen Coming Soon</Text>
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => setSelectedRole(null)}
        >
          <Text style={styles.backLinkText}>{'\u2039'} Back to role selector</Text>
        </TouchableOpacity>
      </View>
    )
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
  backLink: {
    marginTop: 20,
  },
  backLinkText: {
    fontSize: 16,
    color: '#007AFF',
  },
})
