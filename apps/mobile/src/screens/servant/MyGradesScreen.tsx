import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import { useGrades, GradeWithStats } from '../../hooks/useGrades'
import { GradeCard } from '../../components/GradeCard'

interface MyGradesScreenProps {
  onGradePress?: (gradeId: string, gradeName: string) => void
  onBack?: () => void
  onStartOnboarding?: () => void
}

export default function MyGradesScreen({ onGradePress, onBack, onStartOnboarding }: MyGradesScreenProps) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const { grades, loading, error, refetch, deleteGrade } = useGrades()

  const handleGradePress = (gradeId: string, gradeName: string) => {
    if (onGradePress) {
      onGradePress(gradeId, gradeName)
    } else {
      Alert.alert('Navigation', `Would navigate to ${gradeName} detail screen`)
    }
  }

  const handleDeleteGrade = (grade: GradeWithStats) => {
    Alert.alert(
      'Remove Grade',
      `Remove "${grade.name}" from your ministry? You'll no longer see its sessions on your dashboard. The grade and its students remain in the system for other servants.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteGrade(grade.id)
            if (error) Alert.alert('Error', error)
          },
        },
      ]
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📚</Text>
      <Text style={styles.emptyTitle}>No Grades Yet</Text>
      <Text style={styles.emptyText}>
        Set up your grades and classes to get started.
      </Text>
      {onStartOnboarding && (
        <TouchableOpacity style={styles.setupButton} onPress={onStartOnboarding}>
          <Text style={styles.setupButtonText}>Set Up My Ministry</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  const renderError = () => (
    <View style={styles.errorState}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Error Loading Grades</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.setupButton} onPress={refetch}>
        <Text style={styles.setupButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>{'\u2039'} Dashboard</Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>My Grades</Text>
            <Text style={styles.subtitle}>
              {loading ? 'Loading...' : `${grades.length} grade${grades.length !== 1 ? 's' : ''}`}
            </Text>
          </View>
          {onStartOnboarding && (
            <TouchableOpacity style={styles.headerSetupButton} onPress={onStartOnboarding}>
              <Text style={styles.headerSetupButtonText}>+ Set Up Ministry</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && grades.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        renderError()
      ) : (
        <FlatList
          data={grades}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.gradeRow}>
              <View style={styles.gradeCardWrap}>
                <GradeCard
                  grade={item}
                  onPress={() => handleGradePress(item.id, item.name)}
                />
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteGrade(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.deleteIcon}>🗑</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={grades.length === 0 ? styles.emptyListContainer : styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.primary} />
          }
        />
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginBottom: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.onPrimaryText,
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
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  headerSetupButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  headerSetupButtonText: {
    color: colors.primaryText,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  gradeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  gradeCardWrap: {
    flex: 1,
  },
  deleteButton: {
    padding: 12,
    marginLeft: 4,
  },
  deleteIcon: {
    fontSize: 20,
  },
  listContainer: {
    paddingVertical: 8,
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
  setupButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  setupButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600' as const,
  },
})
