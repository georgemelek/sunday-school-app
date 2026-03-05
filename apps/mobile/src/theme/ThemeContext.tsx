import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useColorScheme, StyleSheet } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ThemeColors, lightColors, darkColors } from './colors'

export type ThemePreference = 'system' | 'light' | 'dark'

interface ThemeContextValue {
  colors: ThemeColors
  isDark: boolean
  preference: ThemePreference
  setPreference: (pref: ThemePreference) => void
}

const STORAGE_KEY = '@theme_preference'

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isDark: false,
  preference: 'system',
  setPreference: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme()
  const [preference, setPreferenceState] = useState<ThemePreference>('system')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(value => {
      if (value === 'light' || value === 'dark' || value === 'system') {
        setPreferenceState(value)
      }
      setLoaded(true)
    })
  }, [])

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref)
    AsyncStorage.setItem(STORAGE_KEY, pref)
  }, [])

  const isDark = preference === 'dark' || (preference === 'system' && systemScheme === 'dark')
  const colors = isDark ? darkColors : lightColors

  const value = useMemo<ThemeContextValue>(
    () => ({ colors, isDark, preference, setPreference }),
    [colors, isDark, preference, setPreference],
  )

  if (!loaded) return null

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}

export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  createStyles: (colors: ThemeColors) => T,
): T {
  const { colors } = useTheme()
  const colorsRef = useRef(colors)
  const stylesRef = useRef<T | null>(null)

  if (colorsRef.current !== colors || stylesRef.current === null) {
    colorsRef.current = colors
    stylesRef.current = StyleSheet.create(createStyles(colors))
  }

  return stylesRef.current
}
