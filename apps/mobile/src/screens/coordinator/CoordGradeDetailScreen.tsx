import React, { useMemo } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import { useClasses } from '../../hooks/useClasses'
import { useSessions } from '../../hooks/useSessions'
import type { ClassInfo } from '../../data/mockData'

const DAYS = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays']

function getClassTypeColors(colors: ThemeColors): Record<string, string> {
  return {
    'Sunday School': colors.classSundaySchool,
    'Small Group': colors.classSmallGroup,
    'FNA': colors.classFNA,
    'Bible Study': colors.classBibleStudy,
  }
}

interface CoordGradeDetailScreenProps {
  gradeId: string
  gradeName: string
  onBack: () => void
  onClassPress: (classId: string, className: string) => void
}

export default function CoordGradeDetailScreen({
  gradeId,
  gradeName,
  onBack,
  onClassPress,
}: CoordGradeDetailScreenProps) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const CLASS_TYPE_COLORS = getClassTypeColors(colors)

  const { classes, classTypes, loading: classesLoading, error, refetch: refetchClasses } = useClasses()

  // Filter classes to only those that include this grade
  const gradeClasses = useMemo(
    () => classes.filter(c => c.gradeIds.includes(gradeId)),
    [classes, gradeId]
  )

  const classIds = useMemo(() => gradeClasses.map(c => c.id), [gradeClasses])
  const { sessions, loading: sessionsLoading, refetch: refetchSessions } = useSessions(undefined, classIds)

  const loading = classesLoading || sessionsLoading

  function refetch() {
    refetchClasses()
    refetchSessions()
  }

  function formatTime(time: string | null | undefined): string {
    if (!time) return '—'
    const [h, m] = time.split(':').map(Number)
    if (isNaN(h)) return '—'
    const period = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return m === 0 ? `${hour} ${period}` : `${hour}:${m.toString().padStart(2, '0')} ${period}`
  }

  function getNextSession(classId: string) {
    const today = new Date().toISOString().split('T')[0]
    return sessions
      .filter(s => s.classId === classId && s.date >= today && s.status !== 'canceled')
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
  }

  function formatShortDate(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[d.getMonth()]} ${d.getDate()}`
  }

  function renderClassCard({ item }: { item: ClassInfo }) {
    const classType = classTypes.find(ct => ct.id === item.classTypeId)
    const tagColor = CLASS_TYPE_COLORS[classType?.name || ''] || colors.primary
    const dayLabel = item.defaultDayOfWeek != null ? DAYS[item.defaultDayOfWeek] : ''
    const timeLabel = (item.defaultStartTime && item.defaultEndTime)
      ? `${formatTime(item.defaultStartTime)} – ${formatTime(item.defaultEndTime)}`
      : null
    const next = getNextSession(item.id)

    return (
      <TouchableOpacity
        style={styles.classCard}
        activeOpacity={0.7}
        onPress={() => onClassPress(item.id, item.name)}
      >
        <View style={styles.cardTop}>
          <Text style={styles.className} numberOfLines={1}>{item.name}</Text>
          {classType && (
            <View style={[styles.tag, { backgroundColor: tagColor + '18' }]}>
              <Text style={[styles.tagText, { color: tagColor }]}>{classType.name}</Text>
            </View>
          )}
        </View>

        {(dayLabel || timeLabel) && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>{'\uD83D\uDCC5'}</Text>
            <Text style={styles.detailText}>
              {[dayLabel, timeLabel].filter(Boolean).join(' · ')}
            </Text>
          </View>
        )}

        {item.defaultLocation ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>{'\uD83D\uDCCD'}</Text>
            <Text style={styles.detailText} numberOfLines={1}>{item.defaultLocation}</Text>
          </View>
        ) : null}

        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>{'\uD83D\uDC65'}</Text>
          <Text style={styles.detailText}>{item.servantIds.length} servant{item.servantIds.length !== 1 ? 's' : ''}</Text>
        </View>

        {next ? (
          <View style={styles.nextSession}>
            <Text style={styles.nextSessionText}>
              Next: {formatShortDate(next.date)}{next.lessonTopic ? ` — ${next.lessonTopic}` : ''}
            </Text>
          </View>
        ) : (
          <Text style={styles.noSessions}>No upcoming sessions</Text>
        )}

        <Text style={styles.chevron}>{'\u203A'}</Text>
      </TouchableOpacity>
    )
  }

  function renderEmpty() {
    if (loading) return null
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No classes for this grade</Text>
        <Text style={styles.emptyText}>Classes will appear here once configured</Text>
      </View>
    )
  }

  if (loading && gradeClasses.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backButton}>{'\u2039'} Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{gradeName}</Text>
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
        <Text style={styles.headerTitle}>{gradeName}</Text>
      </View>

      <FlatList
        data={gradeClasses}
        keyExtractor={item => item.id}
        renderItem={renderClassCard}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.primary} />
        }
      />
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
  classCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
    gap: 10,
  },
  className: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    flex: 1 as const,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  detailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  detailIcon: {
    fontSize: 13,
    marginRight: 8,
    width: 20,
  },
  detailText: {
    fontSize: 14,
    color: colors.textDetail,
    flex: 1 as const,
  },
  nextSession: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  nextSessionText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  noSessions: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic' as const,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  chevron: {
    position: 'absolute' as const,
    right: 16,
    top: '50%' as const,
    fontSize: 24,
    color: colors.chevron,
    fontWeight: '300' as const,
  },
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
