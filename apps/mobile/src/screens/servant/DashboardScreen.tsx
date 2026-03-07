import React, { useState } from 'react'
import {
  View,
  Text,
  SectionList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import { useClasses } from '../../hooks/useClasses'
import { useSessions, Session } from '../../hooks/useSessions'
import { useAvailability } from '../../hooks/useAvailability'
import { useAuth } from '../../contexts/AuthContext'
import { CURRENT_USER } from '../../data/mockData'
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
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const { profile } = useAuth()
  const { classes, classTypes, servants, loading: classesLoading, refetch: refetchClasses, getClassById, getServantById } = useClasses()
  const classIds = classes.map(c => c.id)
  // Only pass classIds after classes have loaded — prevents premature empty fetch
  const { sessions, loading: sessionsLoading, refetch: refetchSessions, getUpcomingSessions } = useSessions(
    undefined,
    classesLoading ? undefined : classIds.length > 0 ? classIds : undefined,
  )
  const { loading: availLoading, refetch: refetchAvail, getUnavailableServantsForDate, isServantAvailable } = useAvailability()

  const loading = classesLoading || sessionsLoading || availLoading

  const greeting = getGreeting()
  const firstName = profile?.full_name?.split(' ')[0] ?? CURRENT_USER.fullName.split(' ')[0]

  const [visibleDays, setVisibleDays] = useState(14)

  // Get upcoming sessions for current window
  const upcoming = getUpcomingSessions(visibleDays)
  const allSessions = getUpcomingSessions(365)
  const hasMore = allSessions.length > upcoming.length

  // Group sessions by date with week dividers
  const sections = groupSessionsByDate(upcoming)

  // Alerts are scoped to the first 14 days
  const alertWindow = getUpcomingSessions(14)

  // Check if user is unavailable for any upcoming date (14-day window)
  const myUpcomingUnavailable = alertWindow.filter(
    s => !isServantAvailable(CURRENT_USER.id, s.date)
  )

  // Find dates with thin staffing (<=3 available) — consolidate into one alert (14-day window)
  const thinStaffingDates = alertWindow.reduce<{ date: string; label: string; count: number }[]>((acc, s) => {
    const cls = getClassById(s.classId)
    if (!cls) return acc
    const unavailableIds = getUnavailableServantsForDate(s.date, cls.servantIds)
    const availableCount = cls.servantIds.length - unavailableIds.length
    if (availableCount <= 3 && !acc.find(a => a.date === s.date)) {
      acc.push({ date: s.date, label: formatShortDate(s.date), count: availableCount })
    }
    return acc
  }, [])

  // Refetch all data whenever the screen comes into focus (e.g. returning from onboarding)
  useFocusEffect(
    React.useCallback(() => {
      refetchClasses()
      refetchAvail()
      // Sessions refetch is triggered by classIds changing after refetchClasses resolves,
      // but explicitly call it too in case classIds haven't changed (e.g. pull-to-refresh)
      refetchSessions()
    }, [])
  )

  function handleRefresh() {
    refetchClasses()
    refetchAvail()
    refetchSessions()
  }

  function renderHeader() {
    return (
      <View>
        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>{greeting}, {firstName}</Text>
          <Text style={styles.dateText}>{formatTodayDate()}</Text>
        </View>

        {/* Alerts */}
        {renderAlerts()}

        {/* Section title */}
        <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
      </View>
    )
  }

  function renderAlerts() {
    if (thinStaffingDates.length === 0 && myUpcomingUnavailable.length === 0) return null

    return (
      <View style={styles.alertsSection}>
        {thinStaffingDates.length > 0 && (
          <View style={styles.alertCard}>
            <Text style={styles.alertIcon}>{'\u26A0\uFE0F'}</Text>
            <Text style={styles.alertText}>
              {thinStaffingDates.length === 1
                ? `Only ${thinStaffingDates[0].count} servant${thinStaffingDates[0].count !== 1 ? 's' : ''} available on ${thinStaffingDates[0].label}`
                : `Thin staffing on ${thinStaffingDates.length} upcoming dates: ${thinStaffingDates.map(d => d.label).join(', ')}`
              }
            </Text>
          </View>
        )}

        {myUpcomingUnavailable.length > 0 && (
          <View style={[styles.alertCard, styles.alertInfo]}>
            <Text style={styles.alertIcon}>{'\uD83D\uDCCB'}</Text>
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
      ? classTypes.find(ct => ct.id === cls.classTypeId)
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

  function renderSectionHeader({ section }: { section: { title: string; weekStart: boolean } }) {
    return (
      <View>
        {section.weekStart && <View style={styles.weekDivider} />}
        <Text style={styles.dateSectionHeader}>{section.title}</Text>
      </View>
    )
  }

  function renderFooter() {
    if (!hasMore) return null
    return (
      <TouchableOpacity style={styles.loadMoreButton} onPress={() => setVisibleDays(d => d + 14)}>
        <Text style={styles.loadMoreText}>Load more sessions</Text>
      </TouchableOpacity>
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
          <ActivityIndicator size="large" color={colors.primary} />
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
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={colors.primary} />
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
  const d = new Date()
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getMonth()]} ${d.getDate()}`
}

function getISOWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  // Return year+week number as a string key for grouping
  const day = d.getDay() // 0=Sun
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((day + 6) % 7)) // shift to Monday
  return monday.toISOString().split('T')[0]
}

function groupSessionsByDate(sessions: Session[]): Array<{ title: string; weekStart: boolean; data: Session[] }> {
  const groups: Record<string, Session[]> = {}
  for (const session of sessions) {
    if (!groups[session.date]) {
      groups[session.date] = []
    }
    groups[session.date].push(session)
  }

  const sortedDates = Object.keys(groups).sort()
  let prevWeek: string | null = null
  return sortedDates.map(date => {
    const week = getISOWeek(date)
    const weekStart = prevWeek !== null && week !== prevWeek
    prevWeek = week
    return {
      title: formatSectionDate(date),
      weekStart,
      data: groups[date],
    }
  })
}

function formatSectionDate(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0]
  if (dateStr === today) return 'Today'

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow'

  const d = new Date(dateStr + 'T12:00:00')
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },

  // Greeting
  greetingSection: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  dateText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 16,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  quickActionIcon: {
    fontSize: 20,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },

  // Alerts
  alertsSection: {
    marginBottom: 16,
    gap: 8,
  },
  alertCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.alertWarningBg,
    borderRadius: 10,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.alertWarningBorder,
  },
  alertInfo: {
    backgroundColor: colors.alertInfoBg,
    borderColor: colors.alertInfoBorder,
  },
  alertIcon: {
    fontSize: 16,
  },
  alertText: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },

  // Section headers
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  dateSectionHeader: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 8,
    paddingTop: 4,
  },
  weekDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 8,
    marginBottom: 4,
  },
  loadMoreButton: {
    alignItems: 'center' as const,
    paddingVertical: 16,
    marginTop: 4,
    marginBottom: 16,
  },
  loadMoreText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600' as const,
  },

  // Empty
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
