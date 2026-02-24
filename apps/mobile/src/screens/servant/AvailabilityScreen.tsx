import React, { useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native'
import { useAvailability } from '../../hooks/useAvailability'
import { useSessions, Session } from '../../hooks/useSessions'
import { useClasses } from '../../hooks/useClasses'
import { CURRENT_USER, MOCK_CLASS_TYPES } from '../../data/mockData'

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
  const {
    loading: availLoading,
    refetch: refetchAvail,
    toggleAvailability,
    isServantAvailable,
    availability,
  } = useAvailability(CURRENT_USER.id)

  const { sessions, loading: sessionsLoading, refetch: refetchSessions } = useSessions()
  const { classes, loading: classesLoading, refetch: refetchClasses, getClassById } = useClasses()

  const loading = availLoading || sessionsLoading || classesLoading

  // Build date groups: next 30 days, only dates with scheduled sessions
  const dateGroups = useMemo(() => {
    const today = new Date('2026-02-23T12:00:00')
    const end = new Date('2026-02-23T12:00:00')
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
            ? MOCK_CLASS_TYPES.find(ct => ct.id === cls.classTypeId)
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
  }, [sessions, classes, getClassById])

  // Count unavailable dates
  const unavailableCount = useMemo(() => {
    return dateGroups.filter(g => !isServantAvailable(CURRENT_USER.id, g.date)).length
  }, [dateGroups, isServantAvailable])

  function handleRefresh() {
    refetchAvail()
    refetchSessions()
    refetchClasses()
  }

  function handleToggle(date: string, dateLabel: string) {
    const currentlyAvailable = isServantAvailable(CURRENT_USER.id, date)

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
            onPress: () => toggleAvailability(CURRENT_USER.id, date),
          },
        ]
      )
    } else {
      // Marking available — no confirmation needed
      toggleAvailability(CURRENT_USER.id, date)
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
          <ActivityIndicator size="large" color="#007AFF" />
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
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor="#007AFF" />
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
            const available = isServantAvailable(CURRENT_USER.id, group.date)

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
  const today = '2026-02-23'
  if (dateStr === today) return 'Today'

  const tomorrow = new Date('2026-02-23T12:00:00')
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow'

  const d = new Date(dateStr + 'T12:00:00')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Summary banner
  summaryBanner: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Date cards
  dateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  dateCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  dateInfo: {
    flex: 1,
    marginRight: 12,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  sessionInfo: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },

  // Toggle button
  toggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    minWidth: 110,
    alignItems: 'center',
  },
  toggleAvailable: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  toggleUnavailable: {
    backgroundColor: '#FFEBEE',
    borderColor: '#f44336',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  toggleTextAvailable: {
    color: '#4CAF50',
  },
  toggleTextUnavailable: {
    color: '#f44336',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
})
