import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native'
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
            placeholderTextColor="#999"
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
          <ActivityIndicator size="large" color="#007AFF" />
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
              <ActivityIndicator color="#fff" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerContent: {
    marginTop: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  dateBanner: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  alreadyRecorded: {
    fontSize: 13,
    color: '#FF9800',
    marginTop: 4,
    fontStyle: 'italic',
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e0e0e0',
  },
  presentColor: {
    color: '#4CAF50',
  },
  absentColor: {
    color: '#f44336',
  },
  listContainer: {
    padding: 16,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 8,
    overflow: 'hidden',
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarAbsent: {
    backgroundColor: '#ccc',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  studentInfo: {
    flex: 1,
    marginRight: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  studentDetail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  statusToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  presentToggle: {
    backgroundColor: '#E8F5E9',
  },
  absentToggle: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  presentText: {
    color: '#4CAF50',
  },
  absentText: {
    color: '#f44336',
  },
  notesToggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  notesToggleText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  notesInput: {
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
