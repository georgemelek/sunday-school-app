import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native'
import { useStudents } from '../../hooks/useStudents'
import { StudentListItem } from '../../components/StudentListItem'
import AttendanceHistoryView from '../../components/AttendanceHistoryView'

type Tab = 'students' | 'attendance'

interface GradeDetailScreenProps {
  gradeId: string
  gradeName: string
  onBack?: () => void
  onAddStudent?: () => void
  onEditStudent?: (student: any) => void
  onTakeAttendance?: () => void
}

export default function GradeDetailScreen({
  gradeId,
  gradeName,
  onBack,
  onAddStudent,
  onEditStudent,
  onTakeAttendance,
}: GradeDetailScreenProps) {
  const { students, loading, error, refetch, deleteStudent } = useStudents(gradeId)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('students')

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleStudentPress = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    if (student && onEditStudent) {
      onEditStudent(student)
    } else {
      Alert.alert('Navigation', 'Edit student functionality coming soon')
    }
  }

  const handleDeleteStudent = (studentId: string, studentName: string) => {
    Alert.alert(
      'Delete Student',
      `Are you sure you want to remove ${studentName} from this grade?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteStudent(studentId)
            if (error) {
              Alert.alert('Error', error)
            }
          },
        },
      ]
    )
  }

  const handleAddStudentPress = () => {
    if (onAddStudent) {
      onAddStudent()
    } else {
      Alert.alert('Navigation', 'Add student functionality coming soon')
    }
  }

  const handleTakeAttendance = () => {
    if (onTakeAttendance) {
      onTakeAttendance()
    } else {
      Alert.alert('Navigation', 'Take attendance functionality coming soon')
    }
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyTitle}>No Students Yet</Text>
      <Text style={styles.emptyText}>
        Add your first student to start tracking attendance
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleAddStudentPress}>
        <Text style={styles.emptyButtonText}>Add Student</Text>
      </TouchableOpacity>
    </View>
  )

  const renderError = () => (
    <View style={styles.errorState}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Error Loading Students</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={refetch}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  )

  const renderStudentsTab = () => {
    if (loading && students.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )
    }

    if (error) {
      return renderError()
    }

    return (
      <FlatList
        data={filteredStudents}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <StudentListItem
            student={item}
            onPress={() => handleStudentPress(item.id)}
          />
        )}
        contentContainerStyle={
          filteredStudents.length === 0
            ? styles.emptyListContainer
            : styles.listContainer
        }
        ListEmptyComponent={
          searchQuery ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No Results</Text>
              <Text style={styles.emptyText}>
                No students found matching "{searchQuery}"
              </Text>
            </View>
          ) : (
            renderEmptyState()
          )
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#007AFF" />
        }
      />
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerContent}>
          <Text style={styles.title}>{gradeName}</Text>
          <Text style={styles.subtitle}>
            {loading ? 'Loading...' : `${students.length} student${students.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'students' && styles.tabActive]}
          onPress={() => setActiveTab('students')}
        >
          <Text style={[styles.tabText, activeTab === 'students' && styles.tabTextActive]}>
            Students
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'attendance' && styles.tabActive]}
          onPress={() => setActiveTab('attendance')}
        >
          <Text style={[styles.tabText, activeTab === 'attendance' && styles.tabTextActive]}>
            Attendance
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'students' ? (
        <>
          {/* Search Bar */}
          {students.length > 0 && (
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search students..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
            </View>
          )}

          {/* Action Buttons */}
          {students.length > 0 && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={handleTakeAttendance}
              >
                <Text style={styles.primaryButtonText}>✓ Take Attendance</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={handleAddStudentPress}
              >
                <Text style={styles.secondaryButtonText}>+ Add Student</Text>
              </TouchableOpacity>
            </View>
          )}

          {renderStudentsTab()}
        </>
      ) : (
        <AttendanceHistoryView gradeId={gradeId} students={students} />
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#007AFF',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
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
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
