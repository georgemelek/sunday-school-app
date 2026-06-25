import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClientProvider } from '@tanstack/react-query'
import * as SplashScreen from 'expo-splash-screen'
import { Chat, OverlayProvider } from 'stream-chat-expo'
import { queryClient } from './src/lib/queryClient'

SplashScreen.preventAutoHideAsync()

import { AuthProvider, useAuth } from './src/contexts/AuthContext'
import { TourProvider } from './src/contexts/TourContext'
import { ThemeProvider, useTheme } from './src/theme'
import RootNavigator from './src/navigation'
import { useStreamChatClient } from './src/hooks/useStreamChat'

function ThemedStatusBar() {
  const { isDark } = useTheme()
  return <StatusBar style={isDark ? 'light' : 'dark'} />
}

function SplashGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth()

  React.useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync()
    }
  }, [loading])

  return <>{children}</>
}

// Keeps OverlayProvider + Chat stable above the navigator so screen
// transitions don't reconnect the Stream socket.
function StreamChatWrapper({ children }: { children: React.ReactNode }) {
  const chatClient = useStreamChatClient()

  if (!chatClient) {
    return <OverlayProvider>{children}</OverlayProvider>
  }

  return (
    <OverlayProvider>
      <Chat client={chatClient}>
        {children}
      </Chat>
    </OverlayProvider>
  )
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
              <StreamChatWrapper>
                <RootNavigator />
                <ThemedStatusBar />
              </StreamChatWrapper>
            </SplashGate>
          </AuthProvider>
        </TourProvider>
      </ThemeProvider>
    </SafeAreaProvider>
    </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
