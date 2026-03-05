import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Grade } from '../hooks/useGrades'
import { useThemedStyles, useTheme, ThemeColors } from '../theme'

interface GradeCardProps {
  grade: Grade
  onPress: () => void
}

export function GradeCard({ grade, onPress }: GradeCardProps) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={styles.mainContent}>
          <View style={styles.header}>
            <Text style={styles.gradeName}>{grade.name}</Text>
            {grade.student_count !== undefined && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{grade.student_count} students</Text>
              </View>
            )}
          </View>

          {grade.recent_attendance_rate !== undefined && (
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Recent Attendance:</Text>
              <Text style={[
                styles.statsValue,
                { color: grade.recent_attendance_rate >= 80 ? colors.success : colors.warning }
              ]}>
                {grade.recent_attendance_rate}%
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  )
}

const createStyles = (colors: ThemeColors) => ({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  content: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  mainContent: {
    flex: 1,
    marginRight: 12,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  gradeName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginRight: 8,
  },
  badge: {
    backgroundColor: colors.alertInfoBg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: colors.onPrimaryText,
    fontWeight: '500' as const,
  },
  statsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  statsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
  },
  statsValue: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  chevron: {
    fontSize: 24,
    color: colors.chevron,
    lineHeight: 24,
  },
})
