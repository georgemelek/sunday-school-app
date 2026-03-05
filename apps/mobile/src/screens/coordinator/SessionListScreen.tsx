import React, { useMemo } from 'react'
import {
  View,
  Text,
  SectionList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import { useSessions, Session } from '../../hooks/useSessions'
import { useClasses } from '../../hooks/useClasses'

interface SessionListScreenProps {
  classId: string
  className: string
  onBack: () => void
  onSessionPress?: (session: Session) => void
  onAddSession?: (classId: string) => void
}

function getStatusColors(colors: ThemeColors): Record<string, { bg: string; text: string }> {
  return {
    scheduled: { bg: colors.alertInfoBg, text: colors.onPrimaryText },
    completed: { bg: colors.alertSuccessBg, text: colors.alertSuccessText },
    canceled: { bg: colors.alertDangerBg, text: colors.alertDangerText },
  }
}

export default function SessionListScreen({
  classId,
  className,
  onBack,
  onSessionPress,
  onAddSession,
}: SessionListScreenProps) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const STATUS_COLORS = getStatusColors(colors)

  const { sessions, loading, refetch } = useSessions(classId)
  const { getServantById } = useClasses()

  // Group sessions by month
  const sections = useMemo(() => {
    const groups: Record<string, Session[]> = {}
    const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date))

    for (const session of sorted) {
      const d = new Date(session.date + 'T12:00:00')
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`
      if (!groups[key]) groups[key] = []
      groups[key].push(session)
    }

    return Object.entries(groups).map(([title, data]) => ({ title, data }))
  }, [sessions])

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00')
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
  }

  function renderSession({ item }: { item: Session }) {
    const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS.scheduled
    const lessonServant = item.lessonServantId ? getServantById(item.lessonServantId) : undefined

    return (
      <TouchableOpacity
        style={styles.sessionRow}
        activeOpacity={onSessionPress ? 0.7 : 1}
        onPress={onSessionPress ? () => onSessionPress(item) : undefined}
      >
        <View style={styles.sessionLeft}>
          <Text style={styles.sessionDate}>{formatDate(item.date)}</Text>
          <Text style={styles.sessionTopic} numberOfLines={2}>{item.lessonTopic}</Text>
          {lessonServant && (
            <Text style={styles.sessionServant}>{lessonServant.fullName}</Text>
          )}
        </View>

        <View style={styles.sessionRight}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  function renderSectionHeader({ section }: { section: { title: string } }) {
    return <Text style={styles.sectionHeader}>{section.title}</Text>
  }

  function renderEmpty() {
    if (loading) return null
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No sessions</Text>
        <Text style={styles.emptyText}>Tap + to create a session for this class</Text>
      </View>
    )
  }

  if (loading && sessions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backButton}>{'\u2039'} Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{className}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>{'\u2039'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{className}</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderSession}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.primary} />
        }
      />

      {/* Floating add button */}
      {onAddSession && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => onAddSession(classId)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
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
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1 as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },

  // Section headers
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 4,
  },

  // Session rows
  sessionRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sessionLeft: {
    flex: 1 as const,
    marginRight: 12,
  },
  sessionDate: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  sessionTopic: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.textPrimary,
  },
  sessionServant: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  sessionRight: {
    alignItems: 'flex-end' as const,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },

  // FAB
  fab: {
    position: 'absolute' as const,
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  fabText: {
    fontSize: 28,
    color: colors.primaryText,
    fontWeight: '400' as const,
    marginTop: -2,
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
