import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import { useChurch, InviteRow } from '../../hooks/useChurch'

interface InviteServantsScreenProps {
  onBack: () => void
}

export default function InviteServantsScreen({ onBack }: InviteServantsScreenProps) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const { generateInvite, fetchMyInvites } = useChurch()

  const [invites, setInvites] = useState<InviteRow[]>([])
  const [loadingInvites, setLoadingInvites] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadInvites()
  }, [])

  async function loadInvites() {
    setLoadingInvites(true)
    const rows = await fetchMyInvites()
    setInvites(rows)
    setLoadingInvites(false)
  }

  async function handleGenerate() {
    setGenerating(true)
    const { code, error } = await generateInvite()
    setGenerating(false)

    if (error || !code) {
      Alert.alert('Error', error ?? 'Failed to generate invite')
      return
    }

    await loadInvites()
    await shareCode(code)
  }

  async function shareCode(code: string) {
    const link = `ministryhub://invite/${code}`
    try {
      await Share.share({
        message: `Join our ministry on MinistryHub!\n\nTap to connect: ${link}\n\nOr enter code: ${code}`,
        title: 'MinistryHub Invite',
      })
    } catch {
      // User cancelled share — that's fine
    }
  }

  function isExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  function formatExpiry(expiresAt: string | null): string {
    if (!expiresAt) return 'No expiry'
    const d = new Date(expiresAt)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `Expires ${months[d.getMonth()]} ${d.getDate()}`
  }

  function renderInvite({ item }: { item: InviteRow }) {
    const expired = isExpired(item.expires_at)
    return (
      <TouchableOpacity
        style={[styles.inviteRow, expired && styles.inviteRowExpired]}
        onPress={expired ? undefined : () => shareCode(item.code)}
        activeOpacity={expired ? 1 : 0.7}
      >
        <View style={styles.inviteInfo}>
          <Text style={[styles.inviteCode, expired && styles.textMuted]}>{item.code}</Text>
          <Text style={[styles.inviteDetail, expired && styles.textMuted]}>
            {item.use_count ?? 0} joined · {formatExpiry(item.expires_at)}
          </Text>
        </View>
        {!expired && (
          <Text style={styles.shareLabel}>Share</Text>
        )}
        {expired && (
          <Text style={styles.expiredLabel}>Expired</Text>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>{'\u2039'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Servants</Text>
      </View>

      <View style={styles.explainer}>
        <Text style={styles.explainerText}>
          Generate an invite link and share it with servants. When they open it, they'll be prompted to join your church and connect their classes.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.generateButton, generating && styles.buttonDisabled]}
        onPress={handleGenerate}
        disabled={generating}
      >
        {generating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.generateButtonText}>Generate Invite Link</Text>
        )}
      </TouchableOpacity>

      {loadingInvites ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : invites.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Recent Invites</Text>
          <FlatList
            data={invites}
            keyExtractor={item => item.id}
            renderItem={renderInvite}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </>
      ) : null}
    </View>
  )
}

const createStyles = (colors: ThemeColors) => ({
  container: {
    flex: 1 as const,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    fontSize: 16,
    color: colors.primary,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  explainer: {
    padding: 16,
    paddingBottom: 0,
  },
  explainerText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  generateButton: {
    margin: 16,
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center' as const,
  },
  generateButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  listContent: {
    paddingBottom: 40,
  },
  inviteRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.card,
  },
  inviteRowExpired: {
    opacity: 0.5,
  },
  inviteInfo: {
    flex: 1 as const,
  },
  inviteCode: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'] as any,
  },
  inviteDetail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  shareLabel: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600' as const,
    marginLeft: 12,
  },
  expiredLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginLeft: 12,
  },
  textMuted: {
    color: colors.textMuted,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 16,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center' as const,
  },
})
