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
  ScrollView,
} from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { AuthStackParamList } from '../../types/navigation'
import { supabase } from '../../lib/supabase'
import { useThemedStyles } from '../../theme'
import type { ThemeColors } from '../../theme'

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>

interface Props {
  navigation: RegisterScreenNavigationProp
}

type UserRole = 'servant' | 'coordinator'

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export default function RegisterScreen({ navigation }: Props) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<UserRole>('servant')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const styles = useThemedStyles(createStyles)

  function handlePhoneChange(text: string) {
    setPhone(formatPhone(text))
  }

  async function handleRegister() {
    if (!firstName.trim() || !lastName.trim() || !email) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`
    const rawPhone = phone.replace(/\D/g, '')

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: 'ministryhub://login-callback',
          data: {
            full_name: fullName,
            phone: rawPhone ? `+1${rawPhone}` : null,
            role,
          },
        },
      })

      if (error) throw error
      setSent(true)
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'An error occurred during registration')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.sentContent}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.sentText}>
            We sent a magic link to{'\n'}<Text style={styles.sentEmail}>{email.trim().toLowerCase()}</Text>
          </Text>
          <Text style={styles.sentHint}>Tap the link in the email to finish creating your account.</Text>
          <TouchableOpacity onPress={() => setSent(false)} style={styles.retryButton}>
            <Text style={styles.retryText}>Use a different email</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join your ministry community</Text>

          <View style={styles.form}>
            <View style={styles.nameRow}>
              <TextInput
                style={[styles.input, styles.nameInput]}
                placeholder="First Name *"
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                autoComplete="given-name"
                textContentType="givenName"
                editable={!loading}
              />
              <TextInput
                style={[styles.input, styles.nameInput]}
                placeholder="Last Name *"
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                autoComplete="family-name"
                textContentType="familyName"
                editable={!loading}
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Email *"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Phone (optional)"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              editable={!loading}
            />

            <Text style={styles.label}>I am a:</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'servant' && styles.roleButtonActive]}
                onPress={() => setRole('servant')}
                disabled={loading}
              >
                <Text style={[styles.roleText, role === 'servant' && styles.roleTextActive]}>
                  Servant
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleButton, role === 'coordinator' && styles.roleButtonActive]}
                onPress={() => setRole('coordinator')}
                disabled={loading}
              >
                <Text style={[styles.roleText, role === 'coordinator' && styles.roleTextActive]}>
                  Coordinator
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Magic Link</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
                <Text style={styles.link}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const createStyles = (colors: ThemeColors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.card,
  } as const,
  scrollContent: {
    flexGrow: 1,
  } as const,
  content: {
    flex: 1,
    justifyContent: 'center' as const,
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
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
    marginBottom: 32,
  },
  form: {
    width: '100%' as const,
  },
  nameRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  nameInput: {
    flex: 1,
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
  label: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600' as const,
    marginBottom: 12,
    marginTop: 8,
  },
  roleContainer: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center' as const,
  },
  roleButtonActive: {
    backgroundColor: colors.alertInfoBg,
    borderColor: colors.primary,
  },
  roleText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600' as const,
  },
  roleTextActive: {
    color: colors.onPrimaryText,
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
  sentContent: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 32,
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
