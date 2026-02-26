import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import type { AssignedKid } from '../hooks/useOutreach'

interface OutreachKidCardProps {
  assignedKid: AssignedKid
  onPress: () => void
  onCall?: (phone: string) => void
  onMap?: (address?: string, city?: string) => void
  onMessage?: (kidName: string, phone: string) => void
}

export function OutreachKidCard({
  assignedKid,
  onPress,
  onCall,
  onMap,
  onMessage,
}: OutreachKidCardProps) {
  const { student, assignment, lastVisit } = assignedKid
  const initial = student.name.charAt(0).toUpperCase()
  const hasVisit = !!lastVisit

  const visitLabel = hasVisit
    ? `Visited ${formatShortDate(lastVisit.visitDate)}`
    : 'Not yet visited'

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{student.name}</Text>
          <Text style={styles.grade}>{assignment.gradeName}</Text>
          <View style={[styles.badge, hasVisit ? styles.badgeGreen : styles.badgeGray]}>
            <Text style={[styles.badgeText, hasVisit ? styles.badgeTextGreen : styles.badgeTextGray]}>
              {visitLabel}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => student.parent_phone && onCall?.(student.parent_phone)}
            >
              <Text style={styles.actionIcon}>{'📞'}</Text>
              <Text style={styles.actionLabel}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onMap?.(student.address, student.city)}
            >
              <Text style={styles.actionIcon}>{'📍'}</Text>
              <Text style={styles.actionLabel}>Map</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => student.parent_phone && onMessage?.(student.name, student.parent_phone)}
            >
              <Text style={styles.actionIcon}>{'💬'}</Text>
              <Text style={styles.actionLabel}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.chevron}>{'›'}</Text>
      </View>
    </TouchableOpacity>
  )
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  grade: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6,
  },
  badgeGreen: {
    backgroundColor: '#E8F5E9',
  },
  badgeGray: {
    backgroundColor: '#F5F5F5',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  badgeTextGreen: {
    color: '#4CAF50',
  },
  badgeTextGray: {
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 14,
  },
  actionLabel: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 24,
    color: '#ccc',
    lineHeight: 24,
    marginLeft: 8,
  },
})
