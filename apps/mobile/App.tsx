import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './src/lib/queryClient'

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
    <GestureHandlerRootView style={{ flex: 1 }}>
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
