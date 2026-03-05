import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import { useGrades } from '../../hooks/useGrades'
import { useStudents } from '../../hooks/useStudents'
import { useAttendance } from '../../hooks/useAttendance'

interface AttendanceReportScreenProps {
  onBack: () => void
}

type DateRange = 'last30' | 'last90' | 'all'

export default function AttendanceReportScreen({ onBack }: AttendanceReportScreenProps) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()

  const { grades, loading: gradesLoading } = useGrades()
  const [selectedGradeId, setSelectedGradeId] = useState<string>(grades[0]?.id || '1')
  const [dateRange, setDateRange] = useState<DateRange>('last30')

  const { students, loading: studentsLoading } = useStudents(selectedGradeId)
  const { records, loading: attendanceLoading, getStudentAttendanceRate } = useAttendance(selectedGradeId)

  const loading = gradesLoading || studentsLoading || attendanceLoading

  // Filter records by date range
  const filteredRecords = useMemo(() => {
    if (dateRange === 'all') return records
    const today = new Date('2026-02-23')
    const days = dateRange === 'last30' ? 30 : 90
    const cutoff = new Date(today)
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffStr = cutoff.toISOString().split('T')[0]
    return records.filter(r => r.date >= cutoffStr)
  }, [records, dateRange])

  // Summary stats
  const summary = useMemo(() => {
    const totalRecords = filteredRecords.length
    const present = filteredRecords.filter(r => r.present).length
    const absent = totalRecords - present
    const rate = totalRecords > 0 ? Math.round((present / totalRecords) * 100) : 0
    const uniqueDates = new Set(filteredRecords.map(r => r.date)).size
    return { totalSessions: uniqueDates, rate, present, absent }
  }, [filteredRecords])

  // Student list sorted by attendance rate
  const studentStats = useMemo(() => {
    return students
      .map(s => ({
        ...s,
        attendanceRate: getStudentAttendanceRate(s.id),
      }))
      .sort((a, b) => (a.attendanceRate ?? 100) - (b.attendanceRate ?? 100))
  }, [students, getStudentAttendanceRate])

  function rateColor(rate: number | null): string {
    if (rate == null) return colors.textMuted
    if (rate >= 80) return colors.success
    if (rate >= 60) return colors.warning
    return colors.error
  }

  function rateBgColor(rate: number | null): string {
    if (rate == null) return colors.borderLight
    if (rate >= 80) return colors.alertSuccessBg
    if (rate >= 60) return colors.alertOrangeBg
    return colors.alertDangerBg
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>{'\u2039'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance Report</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Grade picker */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow} contentContainerStyle={styles.pickerContent}>
          {grades.map(g => (
            <TouchableOpacity
              key={g.id}
              style={[styles.pill, selectedGradeId === g.id && styles.pillSelected]}
              onPress={() => setSelectedGradeId(g.id)}
            >
              <Text style={[styles.pillText, selectedGradeId === g.id && styles.pillTextSelected]}>{g.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Date range picker */}
        <View style={styles.dateRangeRow}>
          {([
            { key: 'last30' as DateRange, label: 'Last 30 days' },
            { key: 'last90' as DateRange, label: 'Last 90 days' },
            { key: 'all' as DateRange, label: 'All time' },
          ]).map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.rangePill, dateRange === opt.key && styles.rangePillSelected]}
              onPress={() => setDateRange(opt.key)}
            >
              <Text style={[styles.rangePillText, dateRange === opt.key && styles.rangePillTextSelected]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* Summary card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{summary.totalSessions}</Text>
                  <Text style={styles.summaryLabel}>Sessions</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryNumber, { color: rateColor(summary.rate) }]}>{summary.rate}%</Text>
                  <Text style={styles.summaryLabel}>Avg. Attendance</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryNumber, { color: colors.success }]}>{summary.present}</Text>
                  <Text style={styles.summaryLabel}>Present</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryNumber, { color: colors.error }]}>{summary.absent}</Text>
                  <Text style={styles.summaryLabel}>Absent</Text>
                </View>
              </View>
            </View>

            {/* Student list */}
            <Text style={styles.sectionTitle}>Students</Text>
            {studentStats.map(student => (
              <View key={student.id} style={styles.studentRow}>
                <Text style={styles.studentName} numberOfLines={1}>{student.name}</Text>
                <View style={[styles.rateBadge, { backgroundColor: rateBgColor(student.attendanceRate) }]}>
                  <Text style={[styles.rateBadgeText, { color: rateColor(student.attendanceRate) }]}>
                    {student.attendanceRate != null ? `${student.attendanceRate}%` : 'N/A'}
                  </Text>
                </View>
              </View>
            ))}

            {studentStats.length === 0 && (
              <Text style={styles.emptyText}>No students in this grade</Text>
            )}
          </>
        )}
      </ScrollView>
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
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center' as const,
  },

  // Pickers
  pickerRow: {
    marginBottom: 12,
  },
  pickerContent: {
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textPrimary,
  },
  pillTextSelected: {
    color: colors.primaryText,
  },
  dateRangeRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 16,
  },
  rangePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rangePillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rangePillText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  rangePillTextSelected: {
    color: colors.primaryText,
  },

  // Summary
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  summaryRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
  },
  summaryItem: {
    alignItems: 'center' as const,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },

  // Students
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  studentRow: {
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
  studentName: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.textPrimary,
    flex: 1 as const,
    marginRight: 12,
  },
  rateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rateBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center' as const,
    paddingVertical: 20,
  },
})
