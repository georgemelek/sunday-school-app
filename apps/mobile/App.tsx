import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClientProvider } from '@tanstack/react-query'
import * as SplashScreen from 'expo-splash-screen'
import { queryClient } from './src/lib/queryClient'

SplashScreen.preventAutoHideAsync()

import { AuthProvider, useAuth } from './src/contexts/AuthContext'
import { TourProvider } from './src/contexts/TourContext'
import { ThemeProvider, useTheme } from './src/theme'
import RootNavigator from './src/navigation'

function ThemedStatusBar() {
  const { isDark } = useTheme()
  return <StatusBar style={isDark ? 'light' : 'dark'} />
}

// Hides the splash screen once auth has finished its initial load.
// Keeps the native splash visible instead of showing a JS spinner.
function SplashGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth()

  React.useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync()
    }
  }, [loading])

  return <>{children}</>
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <QueryClientProvider client={queryClient}>
    <SafeAreaProvider>
      <ThemeProvider>
        <TourProvider>
          <AuthProvider>
            <SplashGate>
              <RootNavigator />
              <ThemedStatusBar />
            </SplashGate>
          </AuthProvider>
        </TourProvider>
      </ThemeProvider>
    </SafeAreaProvider>
    </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
