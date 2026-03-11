import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import type { AssignedKid, OutreachVisit } from '../../hooks/useOutreach'
import { studentDisplayName } from '../../hooks/useStudents'
import { fillTemplate, DEFAULT_MESSAGE_TEMPLATE } from '../../utils/outreachTemplates'

interface OutreachDetailScreenProps {
  assignedKid: AssignedKid
  // Live lists so the screen reflects optimistic updates (visits added/deleted)
  assignedKids: AssignedKid[]
  localFriends: AssignedKid[]
  servantName: string
  onBack: () => void
  onLogVisit: (assignmentId: string, date: string, notes?: string) => void
  onDeleteVisit?: (visitId: string, assignmentId: string) => Promise<{ error: any }>
}

export default function OutreachDetailScreen({
  assignedKid,
  assignedKids,
  localFriends,
  servantName,
  onBack,
  onLogVisit,
  onDeleteVisit,
}: OutreachDetailScreenProps) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()

  // Derive live kid so visits update after log/delete without navigating back
  const liveKid =
    [...assignedKids, ...localFriends].find(k => k.assignment.id === assignedKid.assignment.id)
    ?? assignedKid
  const { student, assignment, visits } = liveKid
  const displayName = studentDisplayName(student)

  const motherPhone = student.mother_phone
  const fatherPhone = student.father_phone
  const primaryPhone = motherPhone || fatherPhone

  const motherName = [student.mother_first_name, student.mother_last_name].filter(Boolean).join(' ') || null
  const fatherName = [student.father_first_name, student.father_last_name].filter(Boolean).join(' ') || null

  const [modalVisible, setModalVisible] = useState(false)
  const [visitDate, setVisitDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [visitNotes, setVisitNotes] = useState('')

  const initial = displayName.charAt(0).toUpperCase()

  function handleCallMom() {
    if (!motherPhone) { Alert.alert('No Phone', "No mother's phone on file."); return }
    Linking.openURL(`tel:${motherPhone}`)
  }

  function handleCallDad() {
    if (!fatherPhone) { Alert.alert('No Phone', "No father's phone on file."); return }
    Linking.openURL(`tel:${fatherPhone}`)
  }

  function handleCall() {
    if (!primaryPhone) { Alert.alert('No Phone', 'No phone number on file.'); return }
    Linking.openURL(`tel:${primaryPhone}`)
  }

  function handleMap() {
    const query = student.street || student.city
    if (!query) { Alert.alert('No Address', 'No address or city on file.'); return }
    const full = student.street && student.city ? `${student.street}, ${student.city}` : query
    Linking.openURL(`maps://?q=${encodeURIComponent(full)}`)
  }

  function handleMessage() {
    if (!primaryPhone) { Alert.alert('No Phone', 'No phone number on file.'); return }
    const body = fillTemplate(DEFAULT_MESSAGE_TEMPLATE, displayName, servantName)
    Linking.openURL(`sms:${primaryPhone}?body=${encodeURIComponent(body)}`)
  }

  function handleSaveVisit() {
    const dateStr = visitDate.toISOString().split('T')[0]
    onLogVisit(assignment.id, dateStr, visitNotes.trim() || undefined)
    setModalVisible(false)
    setVisitDate(new Date())
    setVisitNotes('')
  }

  const hasBothPhones = !!(motherPhone && fatherPhone)

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>{'\u2039'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{displayName}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Info Section */}
        <View style={styles.infoCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.infoName}>{displayName}</Text>
          <Text style={styles.infoGrade}>{assignment.gradeName}</Text>

          {/* Parents */}
          {motherName && (
            <View style={styles.parentRow}>
              <Text style={styles.parentLabel}>Mother:</Text>
              <Text style={styles.parentName}>{motherName}</Text>
              {motherPhone && (
                <TouchableOpacity onPress={handleCallMom} style={styles.parentCallBtn}>
                  <Text style={styles.parentCallText}>{'📞'}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {fatherName && (
            <View style={styles.parentRow}>
              <Text style={styles.parentLabel}>Father:</Text>
              <Text style={styles.parentName}>{fatherName}</Text>
              {fatherPhone && (
                <TouchableOpacity onPress={handleCallDad} style={styles.parentCallBtn}>
                  <Text style={styles.parentCallText}>{'📞'}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Contact Actions */}
        <View style={styles.contactRow}>
          {hasBothPhones ? (
            <>
              <TouchableOpacity style={styles.contactButton} onPress={handleCallMom}>
                <Text style={styles.contactIcon}>{'📞'}</Text>
                <Text style={styles.contactLabel}>Call Mom</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactButton} onPress={handleCallDad}>
                <Text style={styles.contactIcon}>{'📞'}</Text>
                <Text style={styles.contactLabel}>Call Dad</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
              <Text style={styles.contactIcon}>{'📞'}</Text>
              <Text style={styles.contactLabel}>Call</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.contactButton} onPress={handleMap}>
            <Text style={styles.contactIcon}>{'📍'}</Text>
            <Text style={styles.contactLabel}>Map</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton} onPress={handleMessage}>
            <Text style={styles.contactIcon}>{'💬'}</Text>
            <Text style={styles.contactLabel}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Visit History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visit History</Text>
          {visits.length === 0 ? (
            <Text style={styles.noVisits}>No visits yet</Text>
          ) : (
            visits.map(visit => (
              <SwipeableVisitItem
                key={visit.id}
                visit={visit}
                onDelete={onDeleteVisit ? () => {
                  Alert.alert('Delete Visit', 'Remove this visit from history?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => onDeleteVisit(visit.id, assignment.id),
                    },
                  ])
                } : undefined}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Log Visit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.logButtonText}>Log Visit</Text>
        </TouchableOpacity>
      </View>

      {/* Log Visit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Visit</Text>

            {/* Date picker */}
            <Text style={styles.inputLabel}>Date</Text>
            <TouchableOpacity
              style={styles.dateDisplayButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateDisplayText}>{formatDate(visitDate.toISOString().split('T')[0])}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={visitDate}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={(_, selected) => {
                    if (selected) setVisitDate(selected)
                    if (Platform.OS === 'android') setShowDatePicker(false)
                  }}
                  textColor={colors.textPrimary}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.datePickerDone}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <Text style={styles.inputLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={visitNotes}
              onChangeText={setVisitNotes}
              placeholder="Where did you go? How was it?"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false)
                  setShowDatePicker(false)
                  setVisitDate(new Date())
                  setVisitNotes('')
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveVisit}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

function SwipeableVisitItem({
  visit,
  onDelete,
}: {
  visit: OutreachVisit
  onDelete?: () => void
}) {
  const styles = useThemedStyles(createStyles)
  const swipeRef = useRef<Swipeable>(null)

  function renderRightActions() {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => {
          swipeRef.current?.close()
          onDelete?.()
        }}
      >
        <Text style={styles.deleteActionText}>Delete</Text>
      </TouchableOpacity>
    )
  }

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      containerStyle={styles.swipeContainer}
    >
      <View style={styles.visitItem}>
        <Text style={styles.visitDate}>{formatDate(visit.visitDate)}</Text>
        {visit.notes ? <Text style={styles.visitNotes}>{visit.notes}</Text> : null}
      </View>
    </Swipeable>
  )
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const createStyles = (colors: ThemeColors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: colors.onPrimaryText,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center' as const,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  avatarText: {
    color: colors.primaryText,
    fontSize: 28,
    fontWeight: '700' as const,
  },
  infoName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  infoGrade: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 8,
  },
  parentRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 6,
    gap: 6,
  },
  parentLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500' as const,
    minWidth: 50,
  },
  parentName: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  parentCallBtn: {
    padding: 2,
  },
  parentCallText: {
    fontSize: 16,
  },
  contactRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    marginBottom: 24,
  },
  contactButton: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  contactIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  contactLabel: {
    fontSize: 13,
    color: colors.onPrimaryText,
    fontWeight: '600' as const,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  noVisits: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic' as const,
  },
  swipeContainer: {
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden' as const,
  },
  visitItem: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  deleteAction: {
    backgroundColor: '#f44336',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginLeft: 8,
  },
  deleteActionText: {
    color: '#fff',
    fontWeight: '600' as const,
    fontSize: 14,
  },
  visitDate: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  visitNotes: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  footer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center' as const,
  },
  logButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  dateDisplayButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dateDisplayText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  datePickerContainer: {
    marginBottom: 12,
  },
  datePickerDone: {
    alignItems: 'flex-end' as const,
    padding: 8,
  },
  datePickerDoneText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top' as const,
  },
  modalActions: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center' as const,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600' as const,
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center' as const,
  },
  saveButtonText: {
    fontSize: 16,
    color: colors.primaryText,
    fontWeight: '600' as const,
  },
})
