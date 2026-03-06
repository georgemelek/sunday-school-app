import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Student, studentDisplayName } from '../hooks/useStudents'
import { useThemedStyles, ThemeColors } from '../theme'

interface StudentListItemProps {
  student: Student
  onPress: () => void
}

export function StudentListItem({ student, onPress }: StudentListItemProps) {
  const styles = useThemedStyles(createStyles)

  const getAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const age = getAge(student.date_of_birth ?? undefined)

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{studentDisplayName(student).charAt(0).toUpperCase()}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>{studentDisplayName(student)}</Text>
        <View style={styles.detailsRow}>
          {age !== null && (
            <Text style={styles.detail}>{age} years old</Text>
          )}
        </View>
        {student.notes && (
          <Text style={styles.notes} numberOfLines={1}>
            Note: {student.notes}
          </Text>
        )}
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  )
}

const createStyles = (colors: ThemeColors) => ({
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.card,
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  avatarText: {
    color: colors.primaryText,
    fontSize: 18,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flexWrap: 'wrap' as const,
  },
  detail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  separator: {
    fontSize: 14,
    color: colors.textSecondary,
    marginHorizontal: 6,
  },
  notes: {
    fontSize: 12,
    color: colors.warning,
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  chevron: {
    fontSize: 20,
    color: colors.chevron,
  },
})
