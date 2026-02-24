import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { useClasses } from '../../hooks/useClasses'
import { useSessions, Session } from '../../hooks/useSessions'
import { useAvailability } from '../../hooks/useAvailability'
import { CURRENT_USER, MOCK_CLASS_TYPES } from '../../data/mockData'
import { SessionCard } from '../../components/SessionCard'

interface DashboardScreenProps {
  onNavigateToGrades?: () => void
  onNavigateToAvailability?: () => void
  onSessionPress?: (session: Session) => void
}

export default function DashboardScreen({
  onNavigateToGrades,
  onNavigateToAvailability,
  onSessionPress,
}: DashboardScreenProps) {
  const { classes, classTypes, servants, loading: classesLoading, refetch: refetchClasses, getClassById, getServantById } = useClasses()
  const { sessions, loading: sessionsLoading, refetch: refetchSessions, getUpcomingSessions } = useSessions()
  const { loading: availLoading, refetch: refetchAvail, getUnavailableServantsForDate, isServantAvailable } = useAvailability()

  const loading = classesLoading || sessionsLoading || availLoading

  const greeting = getGreeting()
  const firstName = CURRENT_USER.fullName.split(' ')[0]

  // Get upcoming sessions for next 14 days
  const upcoming = getUpcomingSessions(14)

  // Group sessions by date
  const sections = groupSessionsByDate(upcoming)

  // Check if user is unavailable for any upcoming date
  const myUpcomingUnavailable = upcoming.filter(
    s => !isServantAvailable(CURRENT_USER.id, s.date)
  )

  // Find sessions with thin staffing (<=3 available)
  const thinStaffingSessions = upcoming.filter(s => {
    const cls = getClassById(s.classId)
    if (!cls) return false
    const unavailableIds = getUnavailableServantsForDate(s.date, cls.servantIds)
    const availableCount = cls.servantIds.length - unavailableIds.length
    return availableCount <= 3
  })

  function handleRefresh() {
    refetchClasses()
    refetchSessions()
    refetchAvail()
  }

  function renderHeader() {
    return (
      <View>
        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>{greeting}, {firstName}</Text>
          <Text style={styles.dateText}>{formatTodayDate()}</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {onNavigateToGrades && (
            <TouchableOpacity style={styles.quickAction} onPress={onNavigateToGrades}>
              <Text style={styles.quickActionIcon}>{'\u{1F4DA}'}</Text>
              <Text style={styles.quickActionLabel}>My Grades</Text>
            </TouchableOpacity>
          )}
          {onNavigateToAvailability && (
            <TouchableOpacity style={styles.quickAction} onPress={onNavigateToAvailability}>
              <Text style={styles.quickActionIcon}>{'\u{1F4C5}'}</Text>
              <Text style={styles.quickActionLabel}>My Availability</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Alerts */}
        {renderAlerts()}

        {/* Section title */}
        <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
      </View>
    )
  }

  function renderAlerts() {
    if (thinStaffingSessions.length === 0 && myUpcomingUnavailable.length === 0) return null

    return (
      <View style={styles.alertsSection}>
        {thinStaffingSessions.map(s => {
          const cls = getClassById(s.classId)
          if (!cls) return null
          const unavailableIds = getUnavailableServantsForDate(s.date, cls.servantIds)
          const availableCount = cls.servantIds.length - unavailableIds.length
          const dateLabel = formatShortDate(s.date)
          return (
            <View key={s.id} style={styles.alertCard}>
              <Text style={styles.alertIcon}>{'\u{26A0}\u{FE0F}'}</Text>
              <Text style={styles.alertText}>
                Only {availableCount} servant{availableCount !== 1 ? 's' : ''} available {dateLabel} for {cls.name}
              </Text>
            </View>
          )
        })}

        {myUpcomingUnavailable.length > 0 && (
          <View style={[styles.alertCard, styles.alertInfo]}>
            <Text style={styles.alertIcon}>{'\u{1F4CB}'}</Text>
            <Text style={styles.alertText}>
              You're marked unavailable for {myUpcomingUnavailable.length} upcoming session{myUpcomingUnavailable.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>
    )
  }

  function renderSessionItem({ item: session }: { item: Session }) {
    const cls = getClassById(session.classId)
    const classType = cls
      ? MOCK_CLASS_TYPES.find(ct => ct.id === cls.classTypeId)
      : undefined
    const lessonServant = session.lessonServantId
      ? getServantById(session.lessonServantId)
      : undefined

    const unavailableIds = cls
      ? getUnavailableServantsForDate(session.date, cls.servantIds)
      : []
    const unavailableServants = unavailableIds
      .map(id => getServantById(id))
      .filter((s): s is NonNullable<typeof s> => s !== undefined)

    return (
      <SessionCard
        session={session}
        classInfo={cls}
        classType={classType}
        lessonServant={lessonServant}
        unavailableServants={unavailableServants}
        totalServants={cls?.servantIds.length || 0}
        onPress={onSessionPress ? () => onSessionPress(session) : undefined}
      />
    )
  }

  function renderSectionHeader({ section }: { section: { title: string } }) {
    return (
      <Text style={styles.dateSectionHeader}>{section.title}</Text>
    )
  }

  function renderEmpty() {
    if (loading) return null
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No upcoming sessions</Text>
        <Text style={styles.emptyText}>Check back later for schedule updates</Text>
      </View>
    )
  }

  if (loading && upcoming.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Fixed header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderSessionItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor="#007AFF" />
        }
      />
    </View>
  )
}

// --- Helpers ---

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatTodayDate(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const d = new Date('2026-02-23T12:00:00')
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getMonth()]} ${d.getDate()}`
}

function groupSessionsByDate(sessions: Session[]): Array<{ title: string; data: Session[] }> {
  const groups: Record<string, Session[]> = {}
  for (const session of sessions) {
    if (!groups[session.date]) {
      groups[session.date] = []
    }
    groups[session.date].push(session)
  }

  const sortedDates = Object.keys(groups).sort()
  return sortedDates.map(date => ({
    title: formatSectionDate(date),
    data: groups[date],
  }))
}

function formatSectionDate(dateStr: string): string {
  const today = '2026-02-23'
  if (dateStr === today) return 'Today'

  const tomorrow = new Date('2026-02-23T12:00:00')
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow'

  const d = new Date(dateStr + 'T12:00:00')
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Greeting
  greetingSection: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  quickActionIcon: {
    fontSize: 20,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  // Alerts
  alertsSection: {
    marginBottom: 16,
    gap: 8,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  alertInfo: {
    backgroundColor: '#E3F2FD',
    borderColor: '#90CAF9',
  },
  alertIcon: {
    fontSize: 16,
  },
  alertText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    lineHeight: 18,
  },

  // Section headers
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  dateSectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 8,
    paddingTop: 4,
  },

  // Empty
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
