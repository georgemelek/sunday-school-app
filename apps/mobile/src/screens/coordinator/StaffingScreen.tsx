import React, { useMemo, useState, useCallback } from 'react'
import { format, addDays } from 'date-fns'
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import { useClasses } from '../../hooks/useClasses'
import { useSessions } from '../../hooks/useSessions'
import { useAvailability } from '../../hooks/useAvailability'

function getClassTypeColors(colors: ThemeColors): Record<string, string> {
  return {
    'Sunday School': colors.classSundaySchool,
    'Small Group': colors.classSmallGroup,
    'FNA': colors.classFNA,
    'Bible Study': colors.classBibleStudy,
  }
}

interface DateRow {
  date: string
  dateLabel: string
  classEntries: ClassEntry[]
}

interface ClassEntry {
  classId: string
  className: string
  classTypeName: string
  totalServants: number
  availableCount: number
  servants: { id: string; name: string; available: boolean }[]
}

export default function StaffingScreen() {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const CLASS_TYPE_COLORS = getClassTypeColors(colors)

  const { classes, classTypes, loading: classesLoading, refetch: refetchClasses, getServantsByClassId } = useClasses()
  const { sessions, loading: sessionsLoading, refetch: refetchSessions } = useSessions()
  const { loading: availLoading, refetch: refetchAvail, getUnavailableServantsForDate, toggleAvailability } = useAvailability()

  const loading = classesLoading || sessionsLoading || availLoading
  const [expandedDate, setExpandedDate] = useState<string | null>(null)

  // Build date rows for the next 30 days that have sessions
  const dateRows = useMemo((): DateRow[] => {
    const TODAY = format(new Date(), 'yyyy-MM-dd')
    const end = new Date(TODAY + 'T12:00:00')
    end.setDate(end.getDate() + 30)
    const endStr = format(end, 'yyyy-MM-dd')

    // Get all upcoming session dates
    const upcomingSessions = sessions.filter(
      s => s.date >= TODAY && s.date <= endStr && s.status !== 'canceled'
    )

    // Group by date
    const dateMap = new Map<string, Set<string>>()
    for (const s of upcomingSessions) {
      if (!dateMap.has(s.date)) dateMap.set(s.date, new Set())
      dateMap.get(s.date)!.add(s.classId)
    }

    const rows: DateRow[] = []
    const sortedDates = [...dateMap.keys()].sort()

    for (const date of sortedDates) {
      const classIds = dateMap.get(date)!
      const classEntries: ClassEntry[] = []

      for (const classId of classIds) {
        const cls = classes.find(c => c.id === classId)
        if (!cls) continue

        const classType = classTypes.find(ct => ct.id === cls.classTypeId)
        const unavailableIds = getUnavailableServantsForDate(date, cls.servantIds)
        const allServants = getServantsByClassId(classId)

        classEntries.push({
          classId: cls.id,
          className: cls.name,
          classTypeName: classType?.name || '',
          totalServants: cls.servantIds.length,
          availableCount: cls.servantIds.length - unavailableIds.length,
          servants: allServants.map(s => ({
            id: s.id,
            name: s.fullName,
            available: !unavailableIds.includes(s.id),
          })),
        })
      }

      rows.push({
        date,
        dateLabel: formatDateLabel(date),
        classEntries,
      })
    }

    return rows
  }, [sessions, classes, classTypes, getUnavailableServantsForDate, getServantsByClassId])

  function refetch() {
    refetchClasses()
    refetchSessions()
    refetchAvail()
  }

  const handleToggleServant = useCallback((servantName: string, servantId: string, date: string, currentlyAvailable: boolean) => {
    const action = currentlyAvailable ? 'unavailable' : 'available'
    Alert.alert(
      `Mark ${action}`,
      `Mark ${servantName} as ${action} for ${formatDateLabel(date)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => toggleAvailability(servantId, date),
        },
      ]
    )
  }, [toggleAvailability])

  function coverageColor(availableCount: number, totalCount: number): string {
    const ratio = totalCount > 0 ? availableCount / totalCount : 0
    if (ratio >= 0.7) return colors.success
    if (ratio >= 0.5) return colors.warning
    return colors.error
  }

  function coverageBgColor(availableCount: number, totalCount: number): string {
    const ratio = totalCount > 0 ? availableCount / totalCount : 0
    if (ratio >= 0.7) return colors.alertSuccessBg
    if (ratio >= 0.5) return colors.alertOrangeBg
    return colors.alertDangerBg
  }

  function renderDateRow({ item }: { item: DateRow }) {
    const isExpanded = expandedDate === item.date

    return (
      <View style={styles.dateCard}>
        <TouchableOpacity
          style={styles.dateHeader}
          onPress={() => setExpandedDate(isExpanded ? null : item.date)}
        >
          <Text style={styles.dateLabel}>{item.dateLabel}</Text>
          <Text style={styles.expandIcon}>{isExpanded ? '\u25B2' : '\u25BC'}</Text>
        </TouchableOpacity>

        {/* Class coverage bars */}
        <View style={styles.classEntries}>
          {item.classEntries.map(entry => {
            const tagColor = CLASS_TYPE_COLORS[entry.classTypeName] || colors.primary
            const color = coverageColor(entry.availableCount, entry.totalServants)
            const bgColor = coverageBgColor(entry.availableCount, entry.totalServants)

            return (
              <View key={entry.classId}>
                <View style={styles.classRow}>
                  <View style={styles.classInfo}>
                    <Text style={styles.classNameSmall} numberOfLines={1}>{entry.className}</Text>
                    <View style={[styles.miniTag, { backgroundColor: tagColor + '18' }]}>
                      <Text style={[styles.miniTagText, { color: tagColor }]}>{entry.classTypeName}</Text>
                    </View>
                  </View>
                  <View style={[styles.coverageBadge, { backgroundColor: bgColor }]}>
                    <Text style={[styles.coverageText, { color }]}>
                      {entry.availableCount}/{entry.totalServants}
                    </Text>
                  </View>
                </View>

                {/* Expanded servant list */}
                {isExpanded && (
                  <View style={styles.servantList}>
                    {entry.servants.map(servant => (
                      <TouchableOpacity
                        key={servant.id}
                        style={styles.servantRow}
                        onPress={() => handleToggleServant(servant.name, servant.id, item.date, servant.available)}
                      >
                        <Text style={styles.servantStatusIcon}>
                          {servant.available ? '\u2705' : '\u274C'}
                        </Text>
                        <Text style={[
                          styles.servantName,
                          !servant.available && styles.servantNameUnavailable,
                        ]}>
                          {servant.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )
          })}
        </View>
      </View>
    )
  }

  function renderEmpty() {
    if (loading) return null
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No upcoming sessions</Text>
        <Text style={styles.emptyText}>Staffing data will appear when sessions are scheduled</Text>
      </View>
    )
  }

  if (loading && dateRows.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Staffing</Text>
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
        <Text style={styles.headerTitle}>Staffing</Text>
      </View>

      <FlatList
        data={dateRows}
        keyExtractor={item => item.date}
        renderItem={renderDateRow}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.primary} />
        }
      />
    </View>
  )
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
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

  // Date card
  dateCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden' as const,
  },
  dateHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 14,
    paddingBottom: 10,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  expandIcon: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // Class entries
  classEntries: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  classRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  classInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1 as const,
    gap: 8,
  },
  classNameSmall: {
    fontSize: 14,
    color: colors.textDetail,
    flex: 1 as const,
  },
  miniTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  miniTagText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  coverageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
  },
  coverageText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },

  // Servant list
  servantList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 4,
  },
  servantRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 4,
    paddingLeft: 4,
    gap: 8,
  },
  servantStatusIcon: {
    fontSize: 14,
  },
  servantName: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  servantNameUnavailable: {
    color: colors.textMuted,
    textDecorationLine: 'line-through' as const,
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
