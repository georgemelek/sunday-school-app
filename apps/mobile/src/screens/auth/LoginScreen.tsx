import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { AuthStackParamList } from '../../types/navigation'
import { supabase } from '../../lib/supabase'
import { useThemedStyles } from '../../theme'
import type { ThemeColors } from '../../theme'

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>

interface Props {
  navigation: LoginScreenNavigationProp
  onTakeTour?: () => void
}

// Dev accounts that bypass magic link and use password auth for testing.
const DEV_ACCOUNTS: Record<string, string> = __DEV__ ? {
  'test@gmail.com': '123456',
  'test2@gmail.com': '123456',
} : {}

export default function LoginScreen({ navigation, onTakeTour }: Props) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const styles = useThemedStyles(createStyles)

  async function handleSend() {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      Alert.alert('Error', 'Please enter your email address')
      return
    }

    setLoading(true)
    try {
      // Dev bypass: sign in with password so we don't need a real email
      if (DEV_ACCOUNTS[trimmed]) {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmed,
          password: DEV_ACCOUNTS[trimmed],
        })
        if (error) throw error
        return
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { shouldCreateUser: false, emailRedirectTo: 'ministryhub://login-callback' },
      })
      if (error) throw error
      setSent(true)
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>MinistryHub</Text>
        <Text style={styles.subtitle}>
          {sent ? 'Check your email' : 'Sign in to continue'}
        </Text>

        {sent ? (
          <View style={styles.sentContainer}>
            <Text style={styles.sentText}>
              We sent a magic link to{'\n'}<Text style={styles.sentEmail}>{email.trim().toLowerCase()}</Text>
            </Text>
            <Text style={styles.sentHint}>Tap the link in the email to sign in.</Text>
            <TouchableOpacity onPress={() => setSent(false)} style={styles.retryButton}>
              <Text style={styles.retryText}>Use a different email</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              editable={!loading}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSend}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Magic Link</Text>
              )}
            </TouchableOpacity>

            {onTakeTour && (
              <TouchableOpacity
                style={styles.tourButton}
                onPress={onTakeTour}
                disabled={loading}
              >
                <Text style={styles.tourButtonText}>Take a Tour</Text>
              </TouchableOpacity>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>New here? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                disabled={loading}
              >
                <Text style={styles.link}>Create account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const createStyles = (colors: ThemeColors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.card,
  } as const,
  content: {
    flex: 1,
    justifyContent: 'center' as const,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: colors.textPrimary,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 40,
  },
  form: {
    width: '100%' as const,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center' as const,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  tourButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center' as const,
    marginTop: 12,
  },
  tourButtonText: {
    color: colors.onPrimaryText,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  footer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  link: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  sentContainer: {
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    gap: 16,
  },
  sentText: {
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  sentEmail: {
    fontWeight: '600' as const,
    color: colors.primary,
  },
  sentHint: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  retryButton: {
    marginTop: 8,
  },
  retryText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600' as const,
  },
})
