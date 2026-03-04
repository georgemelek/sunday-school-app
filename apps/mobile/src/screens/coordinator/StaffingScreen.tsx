import React, { useMemo, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { useClasses } from '../../hooks/useClasses'
import { useSessions } from '../../hooks/useSessions'
import { useAvailability } from '../../hooks/useAvailability'
import { MOCK_CLASS_TYPES } from '../../data/mockData'

const CLASS_TYPE_COLORS: Record<string, string> = {
  'Sunday School': '#007AFF',
  'Small Group': '#5856D6',
  'FNA': '#FF9500',
  'Bible Study': '#34C759',
}

const TODAY = '2026-02-23'

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
  const { classes, loading: classesLoading, refetch: refetchClasses, getServantsByClassId } = useClasses()
  const { sessions, loading: sessionsLoading, refetch: refetchSessions } = useSessions()
  const { loading: availLoading, refetch: refetchAvail, getUnavailableServantsForDate, toggleAvailability } = useAvailability()

  const loading = classesLoading || sessionsLoading || availLoading
  const [expandedDate, setExpandedDate] = useState<string | null>(null)

  // Build date rows for the next 30 days that have sessions
  const dateRows = useMemo((): DateRow[] => {
    const end = new Date(TODAY)
    end.setDate(end.getDate() + 30)
    const endStr = end.toISOString().split('T')[0]

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

        const classType = MOCK_CLASS_TYPES.find(ct => ct.id === cls.classTypeId)
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
  }, [sessions, classes, getUnavailableServantsForDate, getServantsByClassId])

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
    if (ratio >= 0.7) return '#4CAF50'
    if (ratio >= 0.5) return '#FF9500'
    return '#f44336'
  }

  function coverageBgColor(availableCount: number, totalCount: number): string {
    const ratio = totalCount > 0 ? availableCount / totalCount : 0
    if (ratio >= 0.7) return '#E8F5E9'
    if (ratio >= 0.5) return '#FFF3E0'
    return '#FFEBEE'
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
            const tagColor = CLASS_TYPE_COLORS[entry.classTypeName] || '#007AFF'
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
          <ActivityIndicator size="large" color="#007AFF" />
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
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#007AFF" />
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Date card
  dateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    paddingBottom: 10,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  expandIcon: {
    fontSize: 12,
    color: '#999',
  },

  // Class entries
  classEntries: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  classRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  classNameSmall: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  miniTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  miniTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  coverageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
  },
  coverageText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Servant list
  servantList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 4,
  },
  servantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingLeft: 4,
    gap: 8,
  },
  servantStatusIcon: {
    fontSize: 14,
  },
  servantName: {
    fontSize: 14,
    color: '#333',
  },
  servantNameUnavailable: {
    color: '#999',
    textDecorationLine: 'line-through',
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
