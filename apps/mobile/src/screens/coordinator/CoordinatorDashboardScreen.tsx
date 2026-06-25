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
import { useCoordinatorStats } from '../../hooks/useCoordinatorStats'
import type { GradeWithStats } from '../../hooks/useGrades'

interface CoordinatorDashboardScreenProps {
  onGradePress?: (gradeId: string, gradeName: string) => void
  onViewReport?: () => void
  onViewStaffing?: () => void
}

export default function CoordinatorDashboardScreen({
  onGradePress,
  onViewReport,
  onViewStaffing,
}: CoordinatorDashboardScreenProps) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()

  const {
    totalStudents,
    totalClasses,
    overallAttendanceRate,
    grades,
    upcomingGaps,
    loading,
    error,
    refetch,
  } = useCoordinatorStats()

  const greeting = getGreeting()

  function renderHeader() {
    const attendanceColor =
      overallAttendanceRate >= 80 ? colors.success
      : overallAttendanceRate >= 60 ? colors.warning
      : colors.error

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
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalClasses}</Text>
            <Text style={styles.statLabel}>Classes</Text>
          </View>
          <TouchableOpacity style={styles.statCard} onPress={onViewReport}>
            <Text style={[styles.statNumber, { color: attendanceColor }]}>{overallAttendanceRate}%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} onPress={onViewStaffing}>
            <Text style={[styles.statNumber, upcomingGaps.length > 0 && { color: colors.error }]}>
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

        <Text style={styles.sectionTitle}>Grades</Text>
      </View>
    )
  }

  function renderGradeCard({ item }: { item: GradeWithStats }) {
    const rate = item.recent_attendance_rate
    const rateColor =
      rate == null ? colors.textMuted
      : rate >= 80 ? colors.success
      : rate >= 60 ? colors.warning
      : colors.error
    const rateBg =
      rate == null ? colors.borderLight
      : rate >= 80 ? colors.alertSuccessBg
      : rate >= 60 ? colors.alertOrangeBg
      : colors.alertDangerBg

    return (
      <TouchableOpacity
        style={styles.gradeCard}
        activeOpacity={onGradePress ? 0.7 : 1}
        onPress={onGradePress ? () => onGradePress(item.id, item.name) : undefined}
      >
        <View style={styles.gradeCardLeft}>
          <Text style={styles.gradeName}>{item.name}</Text>
          <Text style={styles.gradeDetail}>
            {item.student_count} student{item.student_count !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.gradeCardRight}>
          {rate != null && (
            <View style={[styles.rateBadge, { backgroundColor: rateBg }]}>
              <Text style={[styles.rateText, { color: rateColor }]}>{rate}%</Text>
            </View>
          )}
          <Text style={styles.chevron}>{'\u203A'}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  function renderEmpty() {
    if (loading) return null
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No grades found</Text>
        <Text style={styles.emptyText}>Grades will appear here once servants set them up</Text>
      </View>
    )
  }

  if (loading && grades.length === 0) {
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
      </View>

      <FlatList
        data={grades}
        keyExtractor={item => item.id}
        renderItem={renderGradeCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.primary} />
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
  const d = new Date()
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getMonth()]} ${d.getDate()}`
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
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1 as const,
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

  // Stats
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '47%' as const,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
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
  alertIcon: {
    fontSize: 16,
  },
  alertText: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1 as const,
    lineHeight: 18,
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 12,
  },

  // Grade cards
  gradeCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  gradeCardLeft: {
    flex: 1 as const,
  },
  gradeCardRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  gradeName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 3,
  },
  gradeDetail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  rateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  rateText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  chevron: {
    fontSize: 22,
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
