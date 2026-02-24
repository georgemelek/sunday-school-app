import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native'
import { Session } from '../../hooks/useSessions'
import { useClasses } from '../../hooks/useClasses'
import { useAvailability } from '../../hooks/useAvailability'
import { CURRENT_USER, MOCK_CLASS_TYPES } from '../../data/mockData'

const CLASS_TYPE_COLORS: Record<string, string> = {
  'Sunday School': '#007AFF',
  'Small Group': '#5856D6',
  'FNA': '#FF9500',
  'Bible Study': '#34C759',
}

interface SessionDetailScreenProps {
  session: Session
  onBack: () => void
  onTakeAttendance?: (gradeId: string, gradeName: string) => void
}

export default function SessionDetailScreen({
  session,
  onBack,
  onTakeAttendance,
}: SessionDetailScreenProps) {
  const { getClassById, getServantById, getServantsByClassId } = useClasses()
  const { isServantAvailable } = useAvailability()

  const cls = getClassById(session.classId)
  const classType = cls
    ? MOCK_CLASS_TYPES.find(ct => ct.id === cls.classTypeId)
    : undefined
  const classTypeName = classType?.name || ''
  const tagColor = CLASS_TYPE_COLORS[classTypeName] || '#007AFF'

  const lessonServant = session.lessonServantId
    ? getServantById(session.lessonServantId)
    : undefined
  const classAdmin = session.classAdminId
    ? getServantById(session.classAdminId)
    : undefined

  const allServants = cls ? getServantsByClassId(cls.id) : []

  const isCanceled = session.status === 'canceled'
  const isCompleted = session.status === 'completed'
  const isTeaching = session.lessonServantId === CURRENT_USER.id

  const TODAY = '2026-02-23'
  const canTakeAttendance =
    onTakeAttendance &&
    cls &&
    cls.gradeIds.length > 0 &&
    session.date <= TODAY &&
    !isCanceled

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

  function handleTakeAttendance() {
    if (!cls || !onTakeAttendance) return
    // Use the first grade for this class
    const gradeId = cls.gradeIds[0]
    const gradeNames: Record<string, string> = {
      'grade-5': '5th Grade',
      'grade-6': '6th Grade',
    }
    onTakeAttendance(gradeId, gradeNames[gradeId] || gradeId)
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>{'\u2039'} Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={3}>{session.lessonTopic}</Text>
        <View style={styles.subtitleRow}>
          {cls && <Text style={styles.subtitle}>{cls.name}</Text>}
          {classTypeName ? (
            <View style={[styles.tag, { backgroundColor: tagColor + '18' }]}>
              <Text style={[styles.tagText, { color: tagColor }]}>{classTypeName}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        {/* Status banner */}
        {isCanceled && (
          <View style={styles.canceledBanner}>
            <Text style={styles.canceledBannerText}>Canceled</Text>
            {session.notes ? (
              <Text style={styles.canceledReason}>{session.notes}</Text>
            ) : null}
          </View>
        )}

        {isCompleted && (
          <View style={styles.completedBanner}>
            <Text style={styles.completedBannerText}>Completed</Text>
          </View>
        )}

        {/* You're teaching banner */}
        {isTeaching && !isCanceled && (
          <View style={styles.teachingBanner}>
            <Text style={styles.teachingIcon}>{'\u2B50'}</Text>
            <Text style={styles.teachingText}>You're teaching this session!</Text>
          </View>
        )}

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Date & Time</Text>
          <View style={styles.sectionContent}>
            <Text style={styles.dateText}>{formatFullDate(session.date)}</Text>
            <Text style={styles.timeText}>
              {formatTime(session.startTime)} {'\u2013'} {formatTime(session.endTime)}
            </Text>
          </View>
        </View>

        {/* Location */}
        <TouchableOpacity
          style={styles.section}
          onPress={session.locationAddress ? handleLocationPress : undefined}
          activeOpacity={session.locationAddress ? 0.7 : 1}
        >
          <Text style={styles.sectionLabel}>Location</Text>
          <View style={styles.sectionContent}>
            <Text style={[
              styles.locationName,
              session.locationAddress && styles.locationLink,
            ]}>
              {session.locationName}
            </Text>
            {session.locationAddress ? (
              <Text style={styles.locationAddress}>{session.locationAddress}</Text>
            ) : null}
            {session.locationAddress ? (
              <Text style={styles.mapHint}>Tap to open in Maps</Text>
            ) : null}
          </View>
        </TouchableOpacity>

        {/* Lesson Info */}
        {!isCanceled && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Lesson Details</Text>
            <View style={styles.sectionContent}>
              {session.lessonPage ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Page</Text>
                  <Text style={styles.infoValue}>{session.lessonPage}</Text>
                </View>
              ) : null}
              {session.lessonReference ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Reference</Text>
                  <Text style={styles.infoValue}>{session.lessonReference}</Text>
                </View>
              ) : null}
              {lessonServant && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Teaching</Text>
                  <Text style={styles.infoValue}>{lessonServant.fullName}</Text>
                </View>
              )}
              {classAdmin && classAdmin.id !== lessonServant?.id && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Admin</Text>
                  <Text style={styles.infoValue}>{classAdmin.fullName}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Servant Roster */}
        {allServants.length > 0 && !isCanceled && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Servants ({allServants.length})
            </Text>
            <View style={styles.sectionContent}>
              {allServants.map(servant => {
                const available = isServantAvailable(servant.id, session.date)
                const isLessonServant = servant.id === session.lessonServantId
                const isAdmin = servant.id === session.classAdminId
                return (
                  <View key={servant.id} style={styles.servantRow}>
                    <View style={[
                      styles.availabilityDot,
                      available ? styles.dotAvailable : styles.dotUnavailable,
                    ]} />
                    <Text style={[
                      styles.servantName,
                      !available && styles.servantNameUnavailable,
                    ]}>
                      {servant.fullName}
                    </Text>
                    {isLessonServant && (
                      <View style={[styles.roleBadge, styles.teachingBadge]}>
                        <Text style={styles.teachingBadgeText}>Teaching</Text>
                      </View>
                    )}
                    {isAdmin && !isLessonServant && (
                      <View style={[styles.roleBadge, styles.adminBadge]}>
                        <Text style={styles.adminBadgeText}>Admin</Text>
                      </View>
                    )}
                    {!available && (
                      <Text style={styles.unavailableLabel}>Unavailable</Text>
                    )}
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {/* Notes */}
        {session.notes && !isCanceled ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.notesText}>{session.notes}</Text>
            </View>
          </View>
        ) : null}

        {/* Take Attendance button */}
        {canTakeAttendance && (
          <TouchableOpacity style={styles.attendanceButton} onPress={handleTakeAttendance}>
            <Text style={styles.attendanceButtonText}>Take Attendance</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

// --- Helpers ---

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return m === 0 ? `${hour} ${period}` : `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

// --- Styles ---

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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
    lineHeight: 30,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
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
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
  },

  // Status banners
  canceledBanner: {
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  canceledBannerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#C62828',
  },
  canceledReason: {
    fontSize: 13,
    color: '#D32F2F',
    marginTop: 4,
  },
  completedBanner: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  completedBannerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#757575',
  },

  // Teaching banner
  teachingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  teachingIcon: {
    fontSize: 20,
  },
  teachingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F57F17',
    flex: 1,
  },

  // Sections
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  sectionContent: {},

  // Date & Time
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timeText: {
    fontSize: 15,
    color: '#555',
    marginTop: 4,
  },

  // Location
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  locationLink: {
    color: '#007AFF',
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  mapHint: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 6,
  },

  // Lesson info
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  // Servant roster
  servantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  availabilityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  dotAvailable: {
    backgroundColor: '#4CAF50',
  },
  dotUnavailable: {
    backgroundColor: '#f44336',
  },
  servantName: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  servantNameUnavailable: {
    color: '#999',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  teachingBadge: {
    backgroundColor: '#E3F2FD',
  },
  teachingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1565C0',
  },
  adminBadge: {
    backgroundColor: '#F3E5F5',
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7B1FA2',
  },
  unavailableLabel: {
    fontSize: 11,
    color: '#f44336',
    marginLeft: 8,
  },

  // Notes
  notesText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },

  // Take Attendance button
  attendanceButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  attendanceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
