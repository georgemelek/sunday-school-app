import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native'
import { Session } from '../hooks/useSessions'
import { ClassInfo, ClassType, Servant } from '../data/mockData'

interface SessionCardProps {
  session: Session
  classInfo?: ClassInfo
  classType?: ClassType
  lessonServant?: Servant
  unavailableServants?: Servant[]
  totalServants?: number
  onPress?: () => void
}

export function SessionCard({
  session,
  classInfo,
  classType,
  lessonServant,
  unavailableServants = [],
  totalServants = 0,
  onPress,
}: SessionCardProps) {
  const isToday = session.date === '2026-02-23'
  const isCanceled = session.status === 'canceled'

  const dayLabel = formatDayLabel(session.date)
  const timeLabel = formatTimeRange(session.startTime, session.endTime)

  const availableCount = totalServants - unavailableServants.length

  const classTypeName = classType?.name || ''
  const tagColor = CLASS_TYPE_COLORS[classTypeName] || '#007AFF'

  function handleLocationPress() {
    if (!session.locationAddress) return
    const query = encodeURIComponent(session.locationAddress)
    const url = Platform.OS === 'ios'
      ? `maps:?q=${query}`
      : `geo:0,0?q=${query}`
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://maps.google.com/?q=${query}`)
    })
  }

  return (
    <TouchableOpacity
      style={[styles.card, isToday && styles.cardToday, isCanceled && styles.cardCanceled]}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
    >
      {/* Date + Class type tag */}
      <View style={styles.topRow}>
        <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
          {dayLabel}
        </Text>
        {classTypeName ? (
          <View style={[styles.tag, { backgroundColor: tagColor + '18' }]}>
            <Text style={[styles.tagText, { color: tagColor }]}>{classTypeName}</Text>
          </View>
        ) : null}
      </View>

      {/* Lesson topic */}
      <Text style={[styles.topic, isCanceled && styles.topicCanceled]} numberOfLines={2}>
        {session.lessonTopic}
      </Text>

      {isCanceled && (
        <View style={styles.canceledBadge}>
          <Text style={styles.canceledText}>Canceled</Text>
          {session.notes ? <Text style={styles.canceledNotes}> — {session.notes}</Text> : null}
        </View>
      )}

      {!isCanceled && (
        <>
          {/* Time + Location */}
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>{'clock' === 'clock' ? '\u{1F552}' : ''}</Text>
            <Text style={styles.detailText}>{timeLabel}</Text>
          </View>

          <TouchableOpacity
            style={styles.detailRow}
            onPress={session.locationAddress ? handleLocationPress : undefined}
            activeOpacity={session.locationAddress ? 0.6 : 1}
          >
            <Text style={styles.detailIcon}>{'\u{1F4CD}'}</Text>
            <Text style={[styles.detailText, session.locationAddress && styles.locationLink]} numberOfLines={1}>
              {session.locationName}
            </Text>
          </TouchableOpacity>

          {/* Teaching servant */}
          {lessonServant && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>{'\u{1F4D6}'}</Text>
              <Text style={styles.detailText}>
                {lessonServant.fullName} teaching
              </Text>
              {session.lessonPage ? (
                <Text style={styles.pageText}> (p. {session.lessonPage})</Text>
              ) : null}
            </View>
          )}

          {/* Staffing info */}
          {totalServants > 0 && (
            <View style={styles.staffingRow}>
              {unavailableServants.length > 0 ? (
                <>
                  <View style={[
                    styles.staffingBadge,
                    availableCount <= 3 ? styles.staffingDanger : styles.staffingWarning,
                  ]}>
                    <Text style={[
                      styles.staffingBadgeText,
                      availableCount <= 3 ? styles.staffingDangerText : styles.staffingWarningText,
                    ]}>
                      {availableCount}/{totalServants} available
                    </Text>
                  </View>
                  <Text style={styles.unavailableNames} numberOfLines={1}>
                    {unavailableServants.map(s => s.fullName.split(' ')[0]).join(', ')} out
                  </Text>
                </>
              ) : (
                <View style={styles.staffingOk}>
                  <Text style={styles.staffingOkText}>All {totalServants} servants available</Text>
                </View>
              )}
            </View>
          )}

          {/* Notes */}
          {session.notes ? (
            <Text style={styles.notes} numberOfLines={1}>{session.notes}</Text>
          ) : null}
        </>
      )}
    </TouchableOpacity>
  )
}

const CLASS_TYPE_COLORS: Record<string, string> = {
  'Sunday School': '#007AFF',
  'Small Group': '#5856D6',
  'FNA': '#FF9500',
  'Bible Study': '#34C759',
}

function formatDayLabel(dateStr: string): string {
  const today = new Date('2026-02-23T12:00:00')
  const date = new Date(dateStr + 'T12:00:00')
  const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dayName = dayNames[date.getDay()]
  const monthName = monthNames[date.getMonth()]
  const dayNum = date.getDate()

  if (diffDays > 1 && diffDays <= 6) {
    return `${dayName}, ${monthName} ${dayNum}`
  }

  return `${dayName}, ${monthName} ${dayNum}`
}

function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return m === 0 ? `${hour} ${period}` : `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardToday: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  cardCanceled: {
    opacity: 0.6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayLabelToday: {
    color: '#007AFF',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  topic: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    lineHeight: 22,
  },
  topicCanceled: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  canceledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  canceledText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f44336',
  },
  canceledNotes: {
    fontSize: 13,
    color: '#999',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  locationLink: {
    color: '#007AFF',
  },
  pageText: {
    fontSize: 13,
    color: '#999',
  },
  staffingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  staffingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  staffingWarning: {
    backgroundColor: '#FFF3E0',
  },
  staffingWarningText: {
    color: '#E65100',
  },
  staffingDanger: {
    backgroundColor: '#FFEBEE',
  },
  staffingDangerText: {
    color: '#C62828',
  },
  staffingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  unavailableNames: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },
  staffingOk: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
  },
  staffingOkText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2E7D32',
  },
  notes: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 6,
  },
})
