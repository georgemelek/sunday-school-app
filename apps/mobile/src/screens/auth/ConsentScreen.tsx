import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native'
import { useThemedStyles } from '../../theme'
import type { ThemeColors } from '../../theme'

const PRIVACY_URL = 'https://georgemelek.github.io/sunday-school-app/privacy-policy.html'
const TERMS_URL = 'https://georgemelek.github.io/sunday-school-app/terms.html'

interface Props {
  onAccept: () => Promise<void>
}

export default function ConsentScreen({ onAccept }: Props) {
  const [accepting, setAccepting] = useState(false)
  const styles = useThemedStyles(createStyles)

  async function handleAccept() {
    setAccepting(true)
    await onAccept()
    setAccepting(false)
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✝</Text>
        </View>

        <Text style={styles.title}>Welcome to MinistryHub</Text>
        <Text style={styles.subtitle}>
          Before you get started, please review how we handle your data and the data of the students in your ministry.
        </Text>

        <View style={styles.card}>
          <View style={styles.bulletRow}>
            <Text style={styles.bulletIcon}>👤</Text>
            <Text style={styles.bulletText}>
              We collect your name, email, and phone number to create your account.
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.bulletRow}>
            <Text style={styles.bulletIcon}>👦</Text>
            <Text style={styles.bulletText}>
              Student names, contact info, and attendance records are stored securely and visible only to servants and coordinators in your church.
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.bulletRow}>
            <Text style={styles.bulletIcon}>🔒</Text>
            <Text style={styles.bulletText}>
              We never sell your data or use it for advertising. Data is encrypted in transit and at rest.
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.bulletRow}>
            <Text style={styles.bulletIcon}>🗑️</Text>
            <Text style={styles.bulletText}>
              You can delete your account at any time from Settings.
            </Text>
          </View>
        </View>

        <Text style={styles.legalText}>
          By tapping "I Agree", you confirm you are at least 18 years old and agree to our{' '}
          <Text style={styles.link} onPress={() => Linking.openURL(TERMS_URL)}>
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text style={styles.link} onPress={() => Linking.openURL(PRIVACY_URL)}>
            Privacy Policy
          </Text>
          .
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.agreeButton, accepting && styles.agreeButtonDisabled]}
          onPress={handleAccept}
          disabled={accepting}
        >
          {accepting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.agreeButtonText}>I Agree — Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const createStyles = (colors: ThemeColors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as const,
  scrollContent: {
    padding: 24,
    paddingTop: 72,
    paddingBottom: 24,
  } as const,
  iconContainer: {
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  icon: {
    fontSize: 48,
    color: colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 28,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 28,
    overflow: 'hidden' as const,
  },
  bulletRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    padding: 16,
    gap: 12,
  },
  bulletIcon: {
    fontSize: 20,
    marginTop: 1,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: 16,
  },
  legalText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  link: {
    color: colors.primary,
    fontWeight: '500' as const,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  } as const,
  agreeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center' as const,
  },
  agreeButtonDisabled: {
    opacity: 0.6,
  },
  agreeButtonText: {
    color: colors.primaryText,
    fontSize: 17,
    fontWeight: '600' as const,
  },
})
