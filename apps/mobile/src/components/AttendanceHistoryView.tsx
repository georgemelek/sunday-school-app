import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native'
import { useAttendance } from '../hooks/useAttendance'
import { Student } from '../hooks/useStudents'
import { useThemedStyles, ThemeColors } from '../theme'

interface AttendanceHistoryViewProps {
  gradeId: string
  students: Student[]
}

type ViewMode = 'byDate' | 'byStudent'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export default function AttendanceHistoryView({
  gradeId,
  students,
}: AttendanceHistoryViewProps) {
  const styles = useThemedStyles(createStyles)

  const {
    records,
    loading,
    getUniqueDates,
    getAttendanceForDate,
    getStudentAttendanceRate,
    getDateSummary,
  } = useAttendance(gradeId)

  const [viewMode, setViewMode] = useState<ViewMode>('byDate')
  const [expandedDate, setExpandedDate] = useState<string | null>(null)

  const dates = getUniqueDates()

  const getStudentName = (studentId: string) => {
    return students.find(s => s.id === studentId)?.name || 'Unknown'
  }

  const toggleDateExpand = (date: string) => {
    setExpandedDate(prev => (prev === date ? null : date))
  }

  const renderDateItem = ({ item: date }: { item: string }) => {
    const summary = getDateSummary(date)
    const isExpanded = expandedDate === date
    const dateRecords = getAttendanceForDate(date)
    const rate = summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0

    return (
      <View style={styles.dateCard}>
        <TouchableOpacity style={styles.dateHeader} onPress={() => toggleDateExpand(date)}>
          <View style={styles.dateInfo}>
            <Text style={styles.dateText}>{formatDate(date)}</Text>
            <Text style={styles.dateSummary}>
              {summary.present}/{summary.total} present
            </Text>
          </View>
          <View style={styles.dateRight}>
            <View style={[styles.rateBadge, rate === 100 ? styles.ratePerfect : rate >= 75 ? styles.rateGood : styles.rateLow]}>
              <Text style={[styles.rateText, rate === 100 ? styles.ratePerfectText : rate >= 75 ? styles.rateGoodText : styles.rateLowText]}>
                {rate}%
              </Text>
            </View>
            <Text style={styles.expandIcon}>{isExpanded ? '▾' : '▸'}</Text>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.dateDetails}>
            {dateRecords.map(record => (
              <View key={record.id} style={styles.recordRow}>
                <View style={[styles.statusDot, record.present ? styles.presentDot : styles.absentDot]} />
                <Text style={styles.recordName}>{getStudentName(record.student_id)}</Text>
                <Text style={[styles.recordStatus, record.present ? styles.presentLabel : styles.absentLabel]}>
                  {record.present ? 'Present' : 'Absent'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    )
  }

  const renderStudentItem = ({ item: student }: { item: Student }) => {
    const rate = getStudentAttendanceRate(student.id)
    const studentRecords = records.filter(r => r.student_id === student.id)
    const presentCount = studentRecords.filter(r => r.present).length

    return (
      <View style={styles.studentCard}>
        <View style={styles.studentRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{student.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{student.name}</Text>
            <Text style={styles.studentStat}>
              {presentCount}/{studentRecords.length} sessions attended
            </Text>
          </View>
          {rate !== null && (
            <View style={[styles.rateBadge, rate === 100 ? styles.ratePerfect : rate >= 75 ? styles.rateGood : styles.rateLow]}>
              <Text style={[styles.rateText, rate === 100 ? styles.ratePerfectText : rate >= 75 ? styles.rateGoodText : styles.rateLowText]}>
                {rate}%
              </Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Loading attendance...</Text>
      </View>
    )
  }

  if (records.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>No Attendance Records</Text>
        <Text style={styles.emptyText}>
          Take attendance to start tracking student participation.
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* View Mode Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'byDate' && styles.toggleActive]}
          onPress={() => setViewMode('byDate')}
        >
          <Text style={[styles.toggleText, viewMode === 'byDate' && styles.toggleActiveText]}>
            By Date
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'byStudent' && styles.toggleActive]}
          onPress={() => setViewMode('byStudent')}
        >
          <Text style={[styles.toggleText, viewMode === 'byStudent' && styles.toggleActiveText]}>
            By Student
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {viewMode === 'byDate' ? (
        <FlatList
          data={dates}
          keyExtractor={item => item}
          renderItem={renderDateItem}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <FlatList
          data={students}
          keyExtractor={item => item.id}
          renderItem={renderStudentItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  )
}

const createStyles = (colors: ThemeColors) => ({
  container: {
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row' as const,
    margin: 16,
    backgroundColor: colors.borderLight,
    borderRadius: 8,
    padding: 3,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center' as const,
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  toggleActiveText: {
    color: colors.primary,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  // By Date view
  dateCard: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 8,
    overflow: 'hidden' as const,
  },
  dateHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 14,
  },
  dateInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  dateSummary: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dateRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  expandIcon: {
    fontSize: 14,
    color: colors.textMuted,
  },
  dateDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  recordRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  presentDot: {
    backgroundColor: colors.success,
  },
  absentDot: {
    backgroundColor: colors.error,
  },
  recordName: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  recordStatus: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  presentLabel: {
    color: colors.success,
  },
  absentLabel: {
    color: colors.error,
  },
  // By Student view
  studentCard: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 8,
    padding: 12,
  },
  studentRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  avatarText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  studentInfo: {
    flex: 1,
    marginRight: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  studentStat: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Rate badges
  rateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratePerfect: {
    backgroundColor: colors.alertSuccessBg,
  },
  rateGood: {
    backgroundColor: colors.alertOrangeBg,
  },
  rateLow: {
    backgroundColor: colors.alertDangerBg,
  },
  rateText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  ratePerfectText: {
    color: colors.success,
  },
  rateGoodText: {
    color: colors.warning,
  },
  rateLowText: {
    color: colors.error,
  },
  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
})
