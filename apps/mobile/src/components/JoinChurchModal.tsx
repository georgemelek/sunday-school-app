import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useThemedStyles, ThemeColors } from '../theme'
import { useChurch, InviteDetails } from '../hooks/useChurch'

interface JoinChurchModalProps {
  visible: boolean
  details: InviteDetails
  gradeCount: number
  classCount: number
  onDismiss: () => void
  onJoined: () => void
}

export default function JoinChurchModal({
  visible,
  details,
  gradeCount,
  classCount,
  onDismiss,
  onJoined,
}: JoinChurchModalProps) {
  const styles = useThemedStyles(createStyles)
  const { acceptInvite } = useChurch()
  const [saving, setSaving] = useState(false)

  const hasData = gradeCount > 0 || classCount > 0
  const churchLabel = [details.church.name, details.church.city, details.church.state]
    .filter(Boolean)
    .join(', ')

  async function handleJoin(transfer: boolean) {
    setSaving(true)
    const { error } = await acceptInvite(details.code, details.church.id, transfer)
    setSaving(false)
    if (error) {
      Alert.alert('Error', error)
    } else {
      onJoined()
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>You've been invited!</Text>

          <Text style={styles.body}>
            <Text style={styles.bold}>{details.coordinatorName}</Text>
            {' has invited you to join '}
            <Text style={styles.bold}>{churchLabel}</Text>
            {'.'}
          </Text>

          {hasData && (
            <View style={styles.transferCard}>
              <Text style={styles.transferTitle}>Transfer your data?</Text>
              <Text style={styles.transferBody}>
                You have {gradeCount > 0 ? `${gradeCount} grade${gradeCount !== 1 ? 's' : ''}` : ''}
                {gradeCount > 0 && classCount > 0 ? ' and ' : ''}
                {classCount > 0 ? `${classCount} class${classCount !== 1 ? 'es' : ''}` : ''}{' '}
                you've already set up. Transfer them to this ministry so your coordinator can see them?
              </Text>
            </View>
          )}

          {saving ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator />
              <Text style={styles.loadingText}>Joining...</Text>
            </View>
          ) : hasData ? (
            <>
              <TouchableOpacity style={styles.primaryButton} onPress={() => handleJoin(true)}>
                <Text style={styles.primaryButtonText}>Yes, transfer my classes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => handleJoin(false)}>
                <Text style={styles.secondaryButtonText}>Join without transferring</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.primaryButton} onPress={() => handleJoin(false)}>
              <Text style={styles.primaryButtonText}>Join {details.church.name}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.cancelButton} onPress={onDismiss} disabled={saving}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const createStyles = (colors: ThemeColors) => ({
  overlay: {
    flex: 1 as const,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end' as const,
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 16,
  },
  bold: {
    fontWeight: '600' as const,
  },
  transferCard: {
    backgroundColor: colors.alertInfoBg,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.alertInfoBorder,
    marginBottom: 20,
  },
  transferTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  transferBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  primaryButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  secondaryButtonText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center' as const,
  },
  cancelButtonText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  loadingRow: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
})
