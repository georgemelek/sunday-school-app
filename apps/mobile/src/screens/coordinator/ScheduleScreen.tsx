import React from 'react'
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import { useClasses } from '../../hooks/useClasses'
import { MOCK_CLASS_TYPES } from '../../data/mockData'
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

interface ScheduleScreenProps {
  onClassPress?: (classId: string, className: string) => void
}

export default function ScheduleScreen({ onClassPress }: ScheduleScreenProps) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const CLASS_TYPE_COLORS = getClassTypeColors(colors)

  const { classes, loading, error, refetch } = useClasses()

  function formatTime(time: string): string {
    const [h, m] = time.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return m === 0 ? `${hour} ${period}` : `${hour}:${m.toString().padStart(2, '0')} ${period}`
  }

  function renderClassCard({ item }: { item: ClassInfo }) {
    const classType = MOCK_CLASS_TYPES.find(ct => ct.id === item.classTypeId)
    const tagColor = CLASS_TYPE_COLORS[classType?.name || ''] || colors.primary
    const dayLabel = DAYS[item.defaultDayOfWeek] || ''
    const timeLabel = `${formatTime(item.defaultStartTime)} \u2013 ${formatTime(item.defaultEndTime)}`

    return (
      <TouchableOpacity
        style={styles.classCard}
        activeOpacity={onClassPress ? 0.7 : 1}
        onPress={onClassPress ? () => onClassPress(item.id, item.name) : undefined}
      >
        <View style={styles.cardTop}>
          <Text style={styles.className} numberOfLines={1}>{item.name}</Text>
          {classType && (
            <View style={[styles.tag, { backgroundColor: tagColor + '18' }]}>
              <Text style={[styles.tagText, { color: tagColor }]}>{classType.name}</Text>
            </View>
          )}
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>{'\uD83D\uDCC5'}</Text>
          <Text style={styles.detailText}>{dayLabel} {timeLabel}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>{'\uD83D\uDCCD'}</Text>
          <Text style={styles.detailText} numberOfLines={1}>{item.defaultLocation}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>{'\uD83D\uDC65'}</Text>
          <Text style={styles.detailText}>{item.servantIds.length} servants</Text>
        </View>

        <Text style={styles.chevron}>{'\u203A'}</Text>
      </TouchableOpacity>
    )
  }

  function renderEmpty() {
    if (loading) return null
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No classes found</Text>
        <Text style={styles.emptyText}>Classes will appear here once configured</Text>
      </View>
    )
  }

  if (loading && classes.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Schedule</Text>
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
        <Text style={styles.headerTitle}>Schedule</Text>
      </View>

      <FlatList
        data={classes}
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

  // Class cards
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
    fontSize: 14,
    marginRight: 8,
    width: 20,
  },
  detailText: {
    fontSize: 14,
    color: colors.textDetail,
    flex: 1 as const,
  },
  chevron: {
    position: 'absolute' as const,
    right: 16,
    top: '50%' as const,
    fontSize: 24,
    color: colors.chevron,
    fontWeight: '300' as const,
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
