import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from 'react-native'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import { Session } from '../../hooks/useSessions'
import { useClasses } from '../../hooks/useClasses'
import { logger } from '../../lib/logger'
import { useAvailability } from '../../hooks/useAvailability'
import { useAuth } from '../../contexts/AuthContext'
import { useTour } from '../../contexts/TourContext'
import { CURRENT_USER, MOCK_CLASS_TYPES } from '../../data/mockData'

function getClassTypeColors(colors: ThemeColors): Record<string, string> {
  return {
    'Sunday School': colors.classSundaySchool,
    'Small Group': colors.classSmallGroup,
    'FNA': colors.classFNA,
    'Bible Study': colors.classBibleStudy,
  }
}

interface SessionDetailScreenProps {
  session: Session
  onBack: () => void
  onTakeAttendance?: (gradeId: string, gradeName: string) => void
  onCancelSession?: (sessionId: string, reason: string) => Promise<{ error: string | null }>
  onUpdateLessonTopic?: (sessionId: string, topic: string) => Promise<{ error: string | null }>
  onImportCurriculum?: (classId: string, className: string) => void
}

export default function SessionDetailScreen({
  session,
  onBack,
  onTakeAttendance,
  onCancelSession,
  onUpdateLessonTopic,
  onImportCurriculum,
}: SessionDetailScreenProps) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const { profile } = useAuth()
  const { isTourMode } = useTour()
  const { getClassById, getServantById, getServantsByClassId } = useClasses()
  const { isServantAvailable } = useAvailability()

  // Keep a local copy of the session so mutations (topic edit, cancel) reflect immediately
  const [localSession, setLocalSession] = useState(session)
  const [editingTopic, setEditingTopic] = useState(false)
  const [topicDraft, setTopicDraft] = useState(session.lessonTopic)
  const [savingTopic, setSavingTopic] = useState(false)

  const classTypeColors = getClassTypeColors(colors)

  const cls = getClassById(localSession.classId)
  const classType = cls
    ? MOCK_CLASS_TYPES.find(ct => ct.id === cls.classTypeId)
    : undefined
  const classTypeName = classType?.name || ''
  const tagColor = classTypeColors[classTypeName] || colors.primary

  const lessonServant = localSession.lessonServantId
    ? getServantById(localSession.lessonServantId)
    : undefined
  const classAdmin = localSession.classAdminId
    ? getServantById(localSession.classAdminId)
    : undefined

  const allServants = cls ? getServantsByClassId(cls.id) : []

  const isCanceled = localSession.status === 'canceled'
  const isCompleted = localSession.status === 'completed'
  const currentUserId = isTourMode ? CURRENT_USER.id : (profile?.id ?? '')
  const isTeaching = localSession.lessonServantId === currentUserId

  const TODAY = new Date().toISOString().split('T')[0]
  const canTakeAttendance =
    onTakeAttendance &&
    cls &&
    cls.gradeIds.length > 0 &&
    localSession.date <= TODAY &&
    !isCanceled

  function handleLocationPress() {
    if (!localSession.locationAddress) return
    const query = encodeURIComponent(localSession.locationAddress)
    const url = Platform.OS === 'ios'
      ? `maps:?q=${query}`
      : `geo:0,0?q=${query}`
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://maps.google.com/?q=${query}`)
    })
  }

  function handleTakeAttendance() {
    if (!cls || !onTakeAttendance) return
    const gradeId = cls.gradeIds[0]
    const gradeNames: Record<string, string> = {
      'grade-5': '5th Grade',
      'grade-6': '6th Grade',
    }
    onTakeAttendance(gradeId, gradeNames[gradeId] || gradeId)
  }

  function handleCancelSession() {
    if (!onCancelSession) return
    Alert.prompt(
      'Cancel Session',
      'Reason for cancellation (optional):',
      [
        { text: 'Never mind', style: 'cancel' },
        {
          text: 'Cancel Session',
          style: 'destructive',
          onPress: async (reason: string | undefined) => {
            const { error } = await onCancelSession(localSession.id, reason ?? '')
            if (error) {
              logger.error('SessionDetailScreen.cancelSession', error)
              Alert.alert('Could not cancel session', 'Please try again.')
            } else {
              setLocalSession(prev => ({ ...prev, status: 'canceled', notes: reason || prev.notes }))
            }
          },
        },
      ],
      'plain-text',
    )
  }

  async function handleSaveTopic() {
    if (!onUpdateLessonTopic) return
    setSavingTopic(true)
    const { error } = await onUpdateLessonTopic(localSession.id, topicDraft)
    setSavingTopic(false)
    if (error) {
      logger.error('SessionDetailScreen.updateLessonTopic', error)
      Alert.alert('Could not update topic', 'Please try again.')
    } else {
      setLocalSession(prev => ({ ...prev, lessonTopic: topicDraft }))
      setEditingTopic(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>{'\u2039'} Dashboard</Text>
        </TouchableOpacity>
        {editingTopic ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <TextInput
              style={[styles.title, { flex: 1, borderBottomWidth: 1, borderBottomColor: colors.primary, paddingVertical: 2 }]}
              value={topicDraft}
              onChangeText={setTopicDraft}
              autoFocus
              multiline
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={handleSaveTopic}
            />
            <TouchableOpacity onPress={handleSaveTopic} disabled={savingTopic} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>
                {savingTopic ? '…' : 'Save'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setEditingTopic(false); setTopicDraft(localSession.lessonTopic) }} style={{ paddingHorizontal: 4 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 15 }}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => !isCanceled && setEditingTopic(true)} activeOpacity={isCanceled ? 1 : 0.7}>
            <Text style={styles.title} numberOfLines={3}>{localSession.lessonTopic || 'TBD'}</Text>
            {!isCanceled && (
              <Text style={{ fontSize: 11, color: colors.primary, marginTop: 2 }}>Tap to edit topic</Text>
            )}
          </TouchableOpacity>
        )}
        <View style={styles.subtitleRow}>
          {cls && <Text style={styles.subtitle}>{cls.name}</Text>}
          {classTypeName ? (
            <View style={[styles.tag, { backgroundColor: tagColor + '18' }]}>
              <Text style={[styles.tagText, { color: tagColor }]}>{classTypeName}</Text>
            </View>
          ) : null}
          {onImportCurriculum && cls && (
            <TouchableOpacity
              style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.inputBackground }}
              onPress={() => onImportCurriculum(localSession.classId, cls.name)}
            >
              <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>⬆ Import CSV</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        {/* Status banner */}
        {isCanceled && (
          <View style={styles.canceledBanner}>
            <Text style={styles.canceledBannerText}>Canceled</Text>
            {localSession.notes ? (
              <Text style={styles.canceledReason}>{localSession.notes}</Text>
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
            <Text style={styles.dateText}>{formatFullDate(localSession.date)}</Text>
            <Text style={styles.timeText}>
              {formatTime(localSession.startTime)} {'\u2013'} {formatTime(localSession.endTime)}
            </Text>
          </View>
        </View>

        {/* Location */}
        <TouchableOpacity
          style={styles.section}
          onPress={localSession.locationAddress ? handleLocationPress : undefined}
          activeOpacity={localSession.locationAddress ? 0.7 : 1}
        >
          <Text style={styles.sectionLabel}>Location</Text>
          <View style={styles.sectionContent}>
            <Text style={[
              styles.locationName,
              localSession.locationAddress && styles.locationLink,
            ]}>
              {localSession.locationName}
            </Text>
            {localSession.locationAddress ? (
              <Text style={styles.locationAddress}>{localSession.locationAddress}</Text>
            ) : null}
            {localSession.locationAddress ? (
              <Text style={styles.mapHint}>Tap to open in Maps</Text>
            ) : null}
          </View>
        </TouchableOpacity>

        {/* Lesson Info */}
        {!isCanceled && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Lesson Details</Text>
            <View style={styles.sectionContent}>
              {localSession.lessonPage ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Page</Text>
                  <Text style={styles.infoValue}>{localSession.lessonPage}</Text>
                </View>
              ) : null}
              {localSession.lessonReference ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Reference</Text>
                  <Text style={styles.infoValue}>{localSession.lessonReference}</Text>
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
                const available = isServantAvailable(servant.id, localSession.date)
                const isLessonServant = servant.id === localSession.lessonServantId
                const isAdmin = servant.id === localSession.classAdminId
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
        {localSession.notes && !isCanceled ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.notesText}>{localSession.notes}</Text>
            </View>
          </View>
        ) : null}

        {/* Take Attendance button */}
        {canTakeAttendance && (
          <TouchableOpacity style={styles.attendanceButton} onPress={handleTakeAttendance}>
            <Text style={styles.attendanceButtonText}>Take Attendance</Text>
          </TouchableOpacity>
        )}

        {/* Cancel session */}
        {!isCanceled && !isCompleted && onCancelSession && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelSession}>
            <Text style={styles.cancelButtonText}>Cancel This Session</Text>
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
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginTop: 4,
    lineHeight: 30,
  },
  subtitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 8,
    gap: 10,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
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
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
  },

  // Status banners
  canceledBanner: {
    backgroundColor: colors.alertDangerBg,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.error,
  },
  canceledBannerText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.alertDangerText,
  },
  canceledReason: {
    fontSize: 13,
    color: colors.error,
    marginTop: 4,
  },
  completedBanner: {
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  completedBannerText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textMuted,
  },

  // Teaching banner
  teachingBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.alertWarningBg,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.alertWarningBorder,
  },
  teachingIcon: {
    fontSize: 20,
  },
  teachingText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.warning,
    flex: 1,
  },

  // Sections
  section: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  sectionContent: {},

  // Date & Time
  dateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  timeText: {
    fontSize: 15,
    color: colors.textDetail,
    marginTop: 4,
  },

  // Location
  locationName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  locationLink: {
    color: colors.onPrimaryText,
  },
  locationAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  mapHint: {
    fontSize: 12,
    color: colors.onPrimaryText,
    marginTop: 6,
  },

  // Lesson info
  infoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },

  // Servant roster
  servantRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  availabilityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  dotAvailable: {
    backgroundColor: colors.success,
  },
  dotUnavailable: {
    backgroundColor: colors.error,
  },
  servantName: {
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  servantNameUnavailable: {
    color: colors.textMuted,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  teachingBadge: {
    backgroundColor: colors.alertInfoBg,
  },
  teachingBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.onPrimaryText,
  },
  adminBadge: {
    backgroundColor: '#F3E5F5',
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#7B1FA2',
  },
  unavailableLabel: {
    fontSize: 11,
    color: colors.error,
    marginLeft: 8,
  },

  // Notes
  notesText: {
    fontSize: 14,
    color: colors.textDetail,
    lineHeight: 20,
  },

  // Take Attendance button
  attendanceButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center' as const,
    marginTop: 4,
  },
  attendanceButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600' as const,
  },

  // Cancel session button
  cancelButton: {
    borderRadius: 10,
    padding: 16,
    alignItems: 'center' as const,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
  cancelButtonText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600' as const,
  },
})
