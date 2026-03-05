import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import { useStudents, Student } from '../../hooks/useStudents'
import { useAttendance, AttendanceEntry } from '../../hooks/useAttendance'

interface TakeAttendanceScreenProps {
  gradeId: string
  gradeName: string
  onBack: () => void
}

interface StudentAttendance {
  student_id: string
  present: boolean
  notes: string
}

function getTodayString(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function TakeAttendanceScreen({
  gradeId,
  gradeName,
  onBack,
}: TakeAttendanceScreenProps) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const { students, loading: studentsLoading } = useStudents(gradeId)
  const { submitAttendance, hasAttendanceForDate } = useAttendance(gradeId)
  const [submitting, setSubmitting] = useState(false)
  const [attendance, setAttendance] = useState<Record<string, StudentAttendance>>({})
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null)

  const today = getTodayString()
  const alreadyRecorded = hasAttendanceForDate(today)

  // Initialize attendance state when students load
  useMemo(() => {
    if (students.length > 0 && Object.keys(attendance).length === 0) {
      const initial: Record<string, StudentAttendance> = {}
      students.forEach(s => {
        initial[s.id] = { student_id: s.id, present: true, notes: '' }
      })
      setAttendance(initial)
    }
  }, [students])

  const togglePresent = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        present: !prev[studentId]?.present,
      },
    }))
  }

  const updateNotes = (studentId: string, notes: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes,
      },
    }))
  }

  const toggleNotesExpanded = (studentId: string) => {
    setExpandedNotes(prev => (prev === studentId ? null : studentId))
  }

  const presentCount = Object.values(attendance).filter(a => a.present).length
  const absentCount = Object.values(attendance).filter(a => !a.present).length

  const handleSubmit = async () => {
    if (alreadyRecorded) {
      Alert.alert(
        'Already Recorded',
        'Attendance has already been recorded for today. Do you want to replace it?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace', onPress: doSubmit },
        ]
      )
      return
    }
    doSubmit()
  }

  const doSubmit = async () => {
    setSubmitting(true)

    const entries: AttendanceEntry[] = Object.values(attendance)
    const { error } = await submitAttendance(today, entries)

    setSubmitting(false)

    if (error) {
      Alert.alert('Error', error)
    } else {
      Alert.alert(
        'Attendance Recorded',
        `${presentCount} present, ${absentCount} absent`,
        [{ text: 'OK', onPress: onBack }]
      )
    }
  }

  const renderStudentItem = ({ item }: { item: Student }) => {
    const entry = attendance[item.id]
    if (!entry) return null

    const isPresent = entry.present
    const isNotesExpanded = expandedNotes === item.id

    return (
      <View style={styles.studentCard}>
        <View style={styles.studentRow}>
          {/* Avatar */}
          <View style={[styles.avatar, !isPresent && styles.avatarAbsent]}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>

          {/* Name */}
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.name}</Text>
            {item.parent_name && (
              <Text style={styles.studentDetail}>{item.parent_name}</Text>
            )}
          </View>

          {/* Present/Absent Toggle */}
          <TouchableOpacity
            style={[styles.statusToggle, isPresent ? styles.presentToggle : styles.absentToggle]}
            onPress={() => togglePresent(item.id)}
            disabled={submitting}
          >
            <Text style={[styles.statusText, isPresent ? styles.presentText : styles.absentText]}>
              {isPresent ? 'Present' : 'Absent'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notes toggle */}
        <TouchableOpacity
          style={styles.notesToggle}
          onPress={() => toggleNotesExpanded(item.id)}
        >
          <Text style={styles.notesToggleText}>
            {entry.notes ? `Note: ${entry.notes}` : '+ Add note'}
          </Text>
        </TouchableOpacity>

        {/* Expanded notes input */}
        {isNotesExpanded && (
          <TextInput
            style={styles.notesInput}
            placeholder="e.g., Arrived late, Left early, Sick..."
            value={entry.notes}
            onChangeText={text => updateNotes(item.id, text)}
            editable={!submitting}
            placeholderTextColor={colors.textMuted}
            autoFocus
          />
        )}
      </View>
    )
  }

  if (studentsLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>‹ Cancel</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Take Attendance</Text>
            <Text style={styles.subtitle}>{gradeName}</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>‹ Cancel</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Take Attendance</Text>
          <Text style={styles.subtitle}>{gradeName}</Text>
        </View>
      </View>

      {/* Date Banner */}
      <View style={styles.dateBanner}>
        <Text style={styles.dateLabel}>Date</Text>
        <Text style={styles.dateText}>{formatDateDisplay(today)}</Text>
        {alreadyRecorded && (
          <Text style={styles.alreadyRecorded}>Attendance already recorded for today</Text>
        )}
      </View>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryCount}>{students.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, styles.presentColor]}>{presentCount}</Text>
          <Text style={styles.summaryLabel}>Present</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, styles.absentColor]}>{absentCount}</Text>
          <Text style={styles.summaryLabel}>Absent</Text>
        </View>
      </View>

      {/* Student List */}
      <FlatList
        data={students}
        keyExtractor={item => item.id}
        renderItem={renderStudentItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No Students</Text>
            <Text style={styles.emptyText}>
              Add students to this grade before taking attendance.
            </Text>
          </View>
        }
      />

      {/* Submit Button */}
      {students.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={styles.submitButtonText}>
                Submit Attendance
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const createStyles = (colors: ThemeColors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.card,
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 18,
    color: colors.onPrimaryText,
    fontWeight: '600' as const,
  },
  headerContent: {
    marginTop: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  dateBanner: {
    backgroundColor: colors.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  alreadyRecorded: {
    fontSize: 13,
    color: colors.warning,
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  summaryBar: {
    flexDirection: 'row' as const,
    backgroundColor: colors.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  presentColor: {
    color: colors.success,
  },
  absentColor: {
    color: colors.error,
  },
  listContainer: {
    padding: 16,
  },
  studentCard: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 8,
    overflow: 'hidden' as const,
  },
  studentRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 12,
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
  avatarAbsent: {
    backgroundColor: colors.chevron,
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
  studentDetail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center' as const,
  },
  presentToggle: {
    backgroundColor: colors.alertSuccessBg,
  },
  absentToggle: {
    backgroundColor: colors.alertDangerBg,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  presentText: {
    color: colors.success,
  },
  absentText: {
    color: colors.error,
  },
  notesToggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  notesToggleText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic' as const,
  },
  notesInput: {
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: colors.background,
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingHorizontal: 40,
    paddingTop: 60,
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
  footer: {
    backgroundColor: colors.card,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.success,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center' as const,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600' as const,
  },
})
