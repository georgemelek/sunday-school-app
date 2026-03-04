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
import { useCoordinatorStats, ClassSummary } from '../../hooks/useCoordinatorStats'

const CLASS_TYPE_COLORS: Record<string, string> = {
  'Sunday School': '#007AFF',
  'Small Group': '#5856D6',
  'FNA': '#FF9500',
  'Bible Study': '#34C759',
}

interface CoordinatorDashboardScreenProps {
  onClassPress?: (classId: string) => void
  onViewReport?: () => void
  onViewStaffing?: () => void
}

export default function CoordinatorDashboardScreen({
  onClassPress,
  onViewReport,
  onViewStaffing,
}: CoordinatorDashboardScreenProps) {
  const {
    totalStudents,
    totalClasses,
    overallAttendanceRate,
    classSummaries,
    upcomingGaps,
    loading,
    error,
    refetch,
  } = useCoordinatorStats()

  const greeting = getGreeting()

  function renderHeader() {
    const attendanceColor = overallAttendanceRate >= 80 ? '#4CAF50' : overallAttendanceRate >= 60 ? '#FF9500' : '#f44336'

    return (
      <View>
        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.dateText}>{formatTodayDate()}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalStudents}</Text>
            <Text style={styles.statLabel}>Total Students</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalClasses}</Text>
            <Text style={styles.statLabel}>Total Classes</Text>
          </View>
          <TouchableOpacity style={styles.statCard} onPress={onViewReport}>
            <Text style={[styles.statNumber, { color: attendanceColor }]}>{overallAttendanceRate}%</Text>
            <Text style={styles.statLabel}>Attendance Rate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} onPress={onViewStaffing}>
            <Text style={[styles.statNumber, upcomingGaps.length > 0 && { color: '#f44336' }]}>
              {upcomingGaps.length}
            </Text>
            <Text style={styles.statLabel}>Staffing Gaps</Text>
          </TouchableOpacity>
        </View>

        {/* Staffing Alerts */}
        {upcomingGaps.length > 0 && (
          <View style={styles.alertsSection}>
            {upcomingGaps.map((gap, i) => (
              <View key={`${gap.classId}-${gap.date}-${i}`} style={styles.alertCard}>
                <Text style={styles.alertIcon}>{'\u26A0\uFE0F'}</Text>
                <Text style={styles.alertText}>
                  Only {gap.availableCount}/{gap.totalCount} servants available {formatShortDate(gap.date)} for {gap.className}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Section title */}
        <Text style={styles.sectionTitle}>Your Classes</Text>
      </View>
    )
  }

  function renderClassCard({ item }: { item: ClassSummary }) {
    const tagColor = CLASS_TYPE_COLORS[item.classTypeName] || '#007AFF'

    return (
      <TouchableOpacity
        style={styles.classCard}
        activeOpacity={onClassPress ? 0.7 : 1}
        onPress={onClassPress ? () => onClassPress(item.classId) : undefined}
      >
        <View style={styles.classCardTop}>
          <Text style={styles.className} numberOfLines={1}>{item.className}</Text>
          {item.classTypeName ? (
            <View style={[styles.tag, { backgroundColor: tagColor + '18' }]}>
              <Text style={[styles.tagText, { color: tagColor }]}>{item.classTypeName}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.classCardDetails}>
          <Text style={styles.classDetailText}>
            {item.servantCount} servant{item.servantCount !== 1 ? 's' : ''}
          </Text>
          {item.nextSessionDate && (
            <Text style={styles.classDetailText} numberOfLines={1}>
              Next: {formatShortDate(item.nextSessionDate)} — {item.nextSessionTopic}
            </Text>
          )}
          {!item.nextSessionDate && (
            <Text style={styles.classDetailMuted}>No upcoming sessions</Text>
          )}
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

  if (loading && classSummaries.length === 0) {
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
      </View>

      <FlatList
        data={classSummaries}
        keyExtractor={item => item.classId}
        renderItem={renderClassCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#007AFF" />
        }
      />
    </View>
  )
}

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

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
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
  alertIcon: {
    fontSize: 16,
  },
  alertText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    lineHeight: 18,
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
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
  classCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  className: {
    fontSize: 16,
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
  classCardDetails: {
    gap: 4,
  },
  classDetailText: {
    fontSize: 14,
    color: '#555',
  },
  classDetailMuted: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
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
