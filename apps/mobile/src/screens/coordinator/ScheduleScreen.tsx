import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { useClasses } from '../../hooks/useClasses'
import { MOCK_CLASS_TYPES } from '../../data/mockData'
import type { ClassInfo } from '../../data/mockData'

const DAYS = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays']

const CLASS_TYPE_COLORS: Record<string, string> = {
  'Sunday School': '#007AFF',
  'Small Group': '#5856D6',
  'FNA': '#FF9500',
  'Bible Study': '#34C759',
}

interface ScheduleScreenProps {
  onClassPress?: (classId: string, className: string) => void
}

export default function ScheduleScreen({ onClassPress }: ScheduleScreenProps) {
  const { classes, loading, error, refetch } = useClasses()

  function formatTime(time: string): string {
    const [h, m] = time.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return m === 0 ? `${hour} ${period}` : `${hour}:${m.toString().padStart(2, '0')} ${period}`
  }

  function renderClassCard({ item }: { item: ClassInfo }) {
    const classType = MOCK_CLASS_TYPES.find(ct => ct.id === item.classTypeId)
    const tagColor = CLASS_TYPE_COLORS[classType?.name || ''] || '#007AFF'
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
          <ActivityIndicator size="large" color="#007AFF" />
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
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#007AFF" />
        }
      />
    </View>
  )
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

  // Class cards
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  className: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  chevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
    fontSize: 24,
    color: '#ccc',
    fontWeight: '300',
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
