import React, { useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import { useAvailability } from '../../hooks/useAvailability'
import { useSessions, Session } from '../../hooks/useSessions'
import { useClasses } from '../../hooks/useClasses'
import { useAuth } from '../../contexts/AuthContext'
import { useTour } from '../../contexts/TourContext'
import { CURRENT_USER } from '../../data/mockData'

interface AvailabilityScreenProps {
  onBack?: () => void
}

interface DateGroup {
  date: string
  label: string
  sessions: Array<{
    id: string
    className: string
    classTypeName: string
  }>
}

export default function AvailabilityScreen({ onBack }: AvailabilityScreenProps) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const { profile } = useAuth()
  const { isTourMode } = useTour()
  // In tour mode use the mock user ID for filtering mock data; in real mode use profile UUID
  const currentUserId = isTourMode ? CURRENT_USER.id : (profile?.id ?? '')

  const {
    loading: availLoading,
    refetch: refetchAvail,
    toggleAvailability,
    isServantAvailable,
    availability,
  } = useAvailability(isTourMode ? CURRENT_USER.id : undefined)

  const { classes, classTypes, loading: classesLoading, refetch: refetchClasses, getClassById } = useClasses()
  const classIds = classes.map(c => c.id)
  // Only pass classIds after classes have loaded — prevents premature empty fetch
  const { sessions, loading: sessionsLoading, refetch: refetchSessions } = useSessions(
    undefined,
    classesLoading ? undefined : classIds.length > 0 ? classIds : undefined,
  )

  const loading = availLoading || sessionsLoading || classesLoading

  // Build date groups: next 30 days, only dates with scheduled sessions
  const dateGroups = useMemo(() => {
    const today = new Date()
    const end = new Date()
    end.setDate(end.getDate() + 30)

    const todayStr = today.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]

    // Get upcoming scheduled sessions
    const upcoming = sessions.filter(
      s => s.date >= todayStr && s.date <= endStr && s.status === 'scheduled'
    )

    // Group by date
    const grouped: Record<string, Session[]> = {}
    for (const session of upcoming) {
      if (!grouped[session.date]) {
        grouped[session.date] = []
      }
      grouped[session.date].push(session)
    }

    // Build date groups with labels
    const result: DateGroup[] = Object.keys(grouped)
      .sort()
      .map(date => {
        const sessionInfos = grouped[date].map(s => {
          const cls = getClassById(s.classId)
          const classType = cls
            ? classTypes.find(ct => ct.id === cls.classTypeId)
            : undefined
          return {
            id: s.id,
            className: cls?.name || 'Unknown Class',
            classTypeName: classType?.name || '',
          }
        })

        return {
          date,
          label: formatDateLabel(date),
          sessions: sessionInfos,
        }
      })

    return result
  }, [sessions, classes, classTypes, getClassById])

  // Count unavailable dates
  const unavailableCount = useMemo(() => {
    return dateGroups.filter(g => !isServantAvailable(currentUserId, g.date)).length
  }, [dateGroups, isServantAvailable])

  function handleRefresh() {
    refetchAvail()
    refetchSessions()
    refetchClasses()
  }

  function handleToggle(date: string, dateLabel: string) {
    const currentlyAvailable = isServantAvailable(currentUserId, date)

    if (currentlyAvailable) {
      // Marking unavailable — show confirmation
      Alert.alert(
        'Mark Unavailable',
        `Mark yourself unavailable for ${dateLabel}? This affects all your sessions on that date.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Mark Unavailable',
            style: 'destructive',
            onPress: () => toggleAvailability(currentUserId, date),
          },
        ]
      )
    } else {
      // Marking available — no confirmation needed
      toggleAvailability(currentUserId, date)
    }
  }

  if (loading && dateGroups.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Text style={styles.backText}>{'\u2039'} Dashboard</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>My Availability</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>{'\u2039'} Dashboard</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>My Availability</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Summary banner */}
        <View style={styles.summaryBanner}>
          <Text style={styles.summaryText}>
            {unavailableCount === 0
              ? "You're available for all upcoming dates"
              : `You're unavailable for ${unavailableCount} upcoming date${unavailableCount !== 1 ? 's' : ''}`}
          </Text>
        </View>

        {/* Date list */}
        {dateGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No upcoming sessions</Text>
            <Text style={styles.emptyText}>No sessions scheduled in the next 30 days</Text>
          </View>
        ) : (
          dateGroups.map(group => {
            const available = isServantAvailable(currentUserId, group.date)

            return (
              <View key={group.date} style={styles.dateCard}>
                <View style={styles.dateCardContent}>
                  {/* Date and sessions */}
                  <View style={styles.dateInfo}>
                    <Text style={styles.dateLabel}>{group.label}</Text>
                    {group.sessions.map(s => (
                      <Text key={s.id} style={styles.sessionInfo}>
                        {s.className}{s.classTypeName ? ` \u00B7 ${s.classTypeName}` : ''}
                      </Text>
                    ))}
                  </View>

                  {/* Toggle button */}
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      available ? styles.toggleAvailable : styles.toggleUnavailable,
                    ]}
                    onPress={() => handleToggle(group.date, group.label)}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        available ? styles.toggleTextAvailable : styles.toggleTextUnavailable,
                      ]}
                    >
                      {available ? 'Available' : 'Unavailable'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}

// --- Helpers ---

function formatDateLabel(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0]
  if (dateStr === today) return 'Today'

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow'

  const d = new Date(dateStr + 'T12:00:00')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
}

// --- Styles ---

const createStyles = (colors: ThemeColors) => ({
  container: {
    flex: 1,
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
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: colors.onPrimaryText,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Summary banner
  summaryBanner: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },

  // Date cards
  dateCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  dateCardContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
  },
  dateInfo: {
    flex: 1,
    marginRight: 12,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sessionInfo: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Toggle button
  toggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    minWidth: 110,
    alignItems: 'center' as const,
  },
  toggleAvailable: {
    backgroundColor: colors.alertSuccessBg,
    borderColor: colors.success,
  },
  toggleUnavailable: {
    backgroundColor: colors.alertDangerBg,
    borderColor: colors.error,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  toggleTextAvailable: {
    color: colors.success,
  },
  toggleTextUnavailable: {
    color: colors.error,
  },

  // Empty state
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
})
