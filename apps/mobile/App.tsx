import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AuthProvider } from './src/contexts/AuthContext'
import { TourProvider } from './src/contexts/TourContext'
import { ThemeProvider, useTheme } from './src/theme'
import RootNavigator from './src/navigation'

function ThemedStatusBar() {
  const { isDark } = useTheme()
  return <StatusBar style={isDark ? 'light' : 'dark'} />
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <TourProvider>
          <AuthProvider>
            <RootNavigator />
            <ThemedStatusBar />
          </AuthProvider>
        </TourProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
