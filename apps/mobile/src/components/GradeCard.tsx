import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Grade } from '../hooks/useGrades'

interface GradeCardProps {
  grade: Grade
  onPress: () => void
}

export function GradeCard({ grade, onPress }: GradeCardProps) {
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
                { color: grade.recent_attendance_rate >= 80 ? '#4CAF50' : '#FF9800' }
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainContent: {
    flex: 1,
    marginRight: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  gradeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  statsValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 24,
    color: '#ccc',
    lineHeight: 24,
  },
})
