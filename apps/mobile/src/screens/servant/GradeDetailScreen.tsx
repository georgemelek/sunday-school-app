import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import { useStudents, studentDisplayName } from '../../hooks/useStudents'
import { StudentListItem } from '../../components/StudentListItem'
import AttendanceHistoryView from '../../components/AttendanceHistoryView'
import { logger } from '../../lib/logger'

type Tab = 'students' | 'attendance'

interface GradeDetailScreenProps {
  gradeId: string
  gradeName: string
  onBack?: () => void
  onAddStudent?: () => void
  onEditStudent?: (student: any) => void
  onTakeAttendance?: () => void
  onImportStudents?: () => void
}

export default function GradeDetailScreen({
  gradeId,
  gradeName,
  onBack,
  onAddStudent,
  onEditStudent,
  onTakeAttendance,
  onImportStudents,
}: GradeDetailScreenProps) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const { students, loading, error, refetch, deleteStudent } = useStudents(gradeId)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('students')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Silent background refetch on focus — does not show the pull-to-refresh spinner
  useFocusEffect(
    useCallback(() => {
      refetch()
    }, [gradeId])
  )

  const handlePullToRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
  }, [refetch])

  const filteredStudents = students.filter(student =>
    studentDisplayName(student).toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleStudentPress = useCallback((studentId: string) => {
    const student = students.find(s => s.id === studentId)
    if (student && onEditStudent) {
      onEditStudent(student)
    } else {
      Alert.alert('Navigation', 'Edit student functionality coming soon')
    }
  }, [students, onEditStudent])

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
              logger.error('GradeDetailScreen.deleteStudent', error)
              Alert.alert('Could not remove student', 'Please try again.')
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

  const keyExtractor = useCallback((item: { id: string }) => item.id, [])

  const renderStudentItem = useCallback(({ item }: { item: any }) => (
    <StudentListItem
      student={item}
      onPress={() => handleStudentPress(item.id)}
    />
  ), [handleStudentPress])

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyTitle}>No Students Yet</Text>
      <Text style={styles.emptyText}>
        Add students one by one or import a CSV file to get started quickly.
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleAddStudentPress}>
        <Text style={styles.emptyButtonText}>Add Student</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.emptyButtonSecondary} onPress={() => onImportStudents?.()}>
        <Text style={styles.emptyButtonSecondaryText}>⬆ Import from CSV</Text>
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
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )
    }

    if (error) {
      return renderError()
    }

    return (
      <FlatList
        data={filteredStudents}
        keyExtractor={keyExtractor}
        renderItem={renderStudentItem}
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
          <RefreshControl refreshing={isRefreshing} onRefresh={handlePullToRefresh} tintColor={colors.primary} />
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
                placeholderTextColor={colors.textMuted}
              />
            </View>
          )}

          {/* Action Buttons */}
          {students.length > 0 && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleTakeAttendance}
              >
                <Text style={styles.actionButtonText} numberOfLines={1}>✓ Attendance</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleAddStudentPress}
              >
                <Text style={styles.actionButtonText} numberOfLines={1}>+ Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onImportStudents?.()}
              >
                <Text style={styles.actionButtonText} numberOfLines={1}>⬆ Import</Text>
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
  tabContainer: {
    flexDirection: 'row' as const,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center' as const,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.onPrimaryText,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  actionButtons: {
    flexDirection: 'row' as const,
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center' as const,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingHorizontal: 40,
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
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  emptyButtonSecondary: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  emptyButtonSecondaryText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600' as const,
  },
})
