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

type UserRole = 'servant' | 'coordinator' | 'priest'

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
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<UserRole>('servant')
  const [loading, setLoading] = useState(false)
  const styles = useThemedStyles(createStyles)

  function handlePhoneChange(text: string) {
    setPhone(formatPhone(text))
  }

  async function handleRegister() {
    if (!firstName.trim() || !lastName.trim() || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters')
      return
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`
    const rawPhone = phone.replace(/\D/g, '')

    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName,
            phone: rawPhone ? `+1${rawPhone}` : null,
            role,
          },
        },
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Registration failed - no user created')
      }

      // Profile will be automatically created by database trigger
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'An error occurred during registration')
    } finally {
      setLoading(false)
    }
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

            <TextInput
              style={styles.input}
              placeholder="Password *"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password *"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
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

              <TouchableOpacity
                style={[styles.roleButton, role === 'priest' && styles.roleButtonActive]}
                onPress={() => setRole('priest')}
                disabled={loading}
              >
                <Text style={[styles.roleText, role === 'priest' && styles.roleTextActive]}>
                  Priest
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
                <Text style={styles.buttonText}>Create Account</Text>
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
})
