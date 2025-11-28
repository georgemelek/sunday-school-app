import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, ActivityIndicator, StyleSheet } from 'react-native'

import { useAuth } from '../contexts/AuthContext'
import { AuthStackParamList, ServantStackParamList, CoordinatorStackParamList } from '../types/navigation'

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'

// Servant screens
import MyGradesScreen from '../screens/servant/MyGradesScreen'

// Coordinator screens
import DashboardScreen from '../screens/coordinator/DashboardScreen'

const AuthStack = createNativeStackNavigator<AuthStackParamList>()
const ServantStack = createNativeStackNavigator<ServantStackParamList>()
const CoordinatorStack = createNativeStackNavigator<CoordinatorStackParamList>()

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  )
}

function ServantNavigator() {
  return (
    <ServantStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <ServantStack.Screen
        name="MyGrades"
        component={MyGradesScreen}
        options={{ title: 'My Grades' }}
      />
    </ServantStack.Navigator>
  )
}

function CoordinatorNavigator() {
  return (
    <CoordinatorStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <CoordinatorStack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
    </CoordinatorStack.Navigator>
  )
}

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  )
}

export default function RootNavigator() {
  const { session, profile, loading } = useAuth()

  return (
    <NavigationContainer>
      {loading ? (
        <LoadingScreen />
      ) : session && profile ? (
        // Show role-specific navigator based on user role
        profile.role === 'servant' ? (
          <ServantNavigator />
        ) : profile.role === 'coordinator' || profile.role === 'priest' ? (
          <CoordinatorNavigator />
        ) : (
          <AuthNavigator />
        )
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
})
