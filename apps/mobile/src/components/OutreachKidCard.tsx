import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import type { AssignedKid } from '../hooks/useOutreach'
import { studentDisplayName } from '../hooks/useStudents'
import { useThemedStyles, ThemeColors } from '../theme'

interface OutreachKidCardProps {
  assignedKid: AssignedKid
  onPress: () => void
  onCall?: (phone: string) => void
  onMap?: (address?: string, city?: string) => void
  onMessage?: (kidName: string, phone: string) => void
}

export function OutreachKidCard({
  assignedKid,
  onPress,
  onCall,
  onMap,
  onMessage,
}: OutreachKidCardProps) {
  const styles = useThemedStyles(createStyles)

  const { student, assignment, lastVisit } = assignedKid
  const displayName = studentDisplayName(student)
  const initial = displayName.charAt(0).toUpperCase()
  const hasVisit = !!lastVisit

  const visitLabel = hasVisit
    ? `Visited ${formatShortDate(lastVisit.visitDate)}`
    : 'Not yet visited'

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.grade}>{assignment.gradeName}</Text>
          <View style={[styles.badge, hasVisit ? styles.badgeGreen : styles.badgeGray]}>
            <Text style={[styles.badgeText, hasVisit ? styles.badgeTextGreen : styles.badgeTextGray]}>
              {visitLabel}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => { const p = student.mother_phone || student.father_phone; p && onCall?.(p) }}
            >
              <Text style={styles.actionIcon}>{'📞'}</Text>
              <Text style={styles.actionLabel}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onMap?.(student.street ?? undefined, student.city ?? undefined)}
            >
              <Text style={styles.actionIcon}>{'📍'}</Text>
              <Text style={styles.actionLabel}>Map</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => { const p = student.mother_phone || student.father_phone; p && onMessage?.(displayName, p) }}
            >
              <Text style={styles.actionIcon}>{'💬'}</Text>
              <Text style={styles.actionLabel}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.chevron}>{'›'}</Text>
      </View>
    </TouchableOpacity>
  )
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const createStyles = (colors: ThemeColors) => ({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  avatarText: {
    color: colors.primaryText,
    fontSize: 20,
    fontWeight: '700' as const,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  grade: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6,
  },
  badgeGreen: {
    backgroundColor: colors.alertSuccessBg,
  },
  badgeGray: {
    backgroundColor: colors.inputBackground,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  badgeTextGreen: {
    color: colors.success,
  },
  badgeTextGray: {
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row' as const,
    marginTop: 8,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  actionIcon: {
    fontSize: 14,
  },
  actionLabel: {
    fontSize: 13,
    color: colors.onPrimaryText,
    fontWeight: '500' as const,
  },
  chevron: {
    fontSize: 24,
    color: colors.chevron,
    lineHeight: 24,
    marginLeft: 8,
  },
})
