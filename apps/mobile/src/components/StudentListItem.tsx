import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Student } from '../hooks/useStudents'

interface StudentListItemProps {
  student: Student
  onPress: () => void
}

export function StudentListItem({ student, onPress }: StudentListItemProps) {
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

  const age = getAge(student.date_of_birth)

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{student.name.charAt(0).toUpperCase()}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>{student.name}</Text>
        <View style={styles.detailsRow}>
          {age !== null && (
            <Text style={styles.detail}>{age} years old</Text>
          )}
          {student.parent_name && (
            <>
              {age !== null && <Text style={styles.separator}>•</Text>}
              <Text style={styles.detail}>{student.parent_name}</Text>
            </>
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  detail: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 6,
  },
  notes: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 4,
    fontStyle: 'italic',
  },
  chevron: {
    fontSize: 20,
    color: '#ccc',
  },
})
