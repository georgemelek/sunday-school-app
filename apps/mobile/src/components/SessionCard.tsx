import React from 'react'
import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native'
import { Session } from '../hooks/useSessions'
import { ClassInfo, ClassType, Servant } from '../data/mockData'
import { useThemedStyles, useTheme, ThemeColors } from '../theme'

interface SessionCardProps {
  session: Session
  classInfo?: ClassInfo
  classType?: ClassType
  lessonServant?: Servant
  unavailableServants?: Servant[]
  totalServants?: number
  onPress?: () => void
}

const getClassTypeColors = (colors: ThemeColors): Record<string, string> => ({
  'Sunday School': colors.classSundaySchool,
  'Small Group': colors.classSmallGroup,
  'FNA': colors.classFNA,
  'Bible Study': colors.classBibleStudy,
})

export function SessionCard({
  session,
  classInfo,
  classType,
  lessonServant,
  unavailableServants = [],
  totalServants = 0,
  onPress,
}: SessionCardProps) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()

  const isToday = session.date === new Date().toISOString().split('T')[0]
  const isCanceled = session.status === 'canceled'

  const timeLabel = formatTimeRange(session.startTime, session.endTime)

  const availableCount = totalServants - unavailableServants.length

  const classTypeName = classType?.name || ''
  const classTypeColors = getClassTypeColors(colors)
  const tagColor = classTypeColors[classTypeName] || colors.primary

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
      {/* Lesson topic + class type tag */}
      <View style={styles.topRow}>
        <View style={styles.topicWrapper}>
          <Text style={[styles.topic, isCanceled && styles.topicCanceled]} numberOfLines={3}>
            {session.lessonTopic}
          </Text>
        </View>
        {classTypeName ? (
          <View style={[styles.tag, { backgroundColor: tagColor + '18' }]}>
            <Text style={[styles.tagText, { color: tagColor }]}>{classTypeName}</Text>
          </View>
        ) : null}
      </View>

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
            <Text style={styles.detailIcon}>{'\u{1F552}'}</Text>
            <Text style={styles.detailText}>{timeLabel}</Text>
          </View>

          <TouchableOpacity
            style={styles.detailRow}
            onPress={session.locationAddress ? handleLocationPress : undefined}
            activeOpacity={session.locationAddress ? 0.6 : 1}
          >
            <Text style={styles.detailIcon}>{'\u{1F4CD}'}</Text>
            <Text style={[styles.detailText, session.locationAddress && styles.locationLink]} numberOfLines={1}>
              {session.locationName || 'TBD'}
            </Text>
            {(!session.locationName || session.locationName === 'TBD') && (
              <Text style={{ fontSize: 14, color: colors.warning, marginLeft: 4, fontWeight: '700' }}>!</Text>
            )}
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

function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return m === 0 ? `${hour} ${period}` : `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

const createStyles = (colors: ThemeColors) => ({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardToday: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  cardCanceled: {
    opacity: 0.6,
  },
  topRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 10,
    gap: 10,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  topicWrapper: {
    flex: 1,
  },
  topic: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  topicCanceled: {
    textDecorationLine: 'line-through' as const,
    color: colors.textMuted,
  },
  canceledBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 4,
  },
  canceledText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.error,
  },
  canceledNotes: {
    fontSize: 13,
    color: colors.textMuted,
  },
  detailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
  },
  detailText: {
    fontSize: 14,
    color: colors.textDetail,
    flex: 1,
  },
  locationLink: {
    color: colors.primary,
  },
  pageText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  staffingRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 8,
    gap: 8,
  },
  staffingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  staffingWarning: {
    backgroundColor: colors.alertOrangeBg,
  },
  staffingWarningText: {
    color: colors.alertOrangeText,
  },
  staffingDanger: {
    backgroundColor: colors.alertDangerBg,
  },
  staffingDangerText: {
    color: colors.alertDangerText,
  },
  staffingBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  unavailableNames: {
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
  },
  staffingOk: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: colors.alertSuccessBg,
  },
  staffingOkText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.alertSuccessText,
  },
  notes: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic' as const,
    marginTop: 6,
  },
})
