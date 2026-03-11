import React, { useState } from 'react'
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import { useOutreachManagement, PHANTOM_SERVANT_ID } from '../../hooks/useOutreach'
import { studentDisplayName } from '../../hooks/useStudents'
import type { ManageServant, AssignableKid, AssignedKid } from '../../hooks/useOutreach'
import type { Student } from '../../hooks/useStudents'

interface OutreachManageScreenProps {
  onBack: () => void
}

type SectionItem =
  | { kind: 'assigned'; kid: AssignableKid; servant: ManageServant }
  | { kind: 'unassigned'; student: Student }
  | { kind: 'local'; kid: AssignedKid }

interface Section {
  title: string
  type: 'servant' | 'phantom' | 'unassigned' | 'local'
  servantId?: string
  data: SectionItem[]
}

// Returns the stable key used to track selection for any item
function itemKey(item: SectionItem): string {
  if (item.kind === 'assigned') return `a:${item.kid.assignment?.id}`
  if (item.kind === 'unassigned') return `u:${item.student.id}`
  return `l:${item.kid.assignment.id}`
}

export default function OutreachManageScreen({ onBack }: OutreachManageScreenProps) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const {
    servants, unassigned, localFriends,
    loading, error, refetch,
    assignKid, reassignKid, unassignKid,
    markLocalFriend, unmarkLocalFriend, autoAssign,
    bulkReassign, bulkAssign,
  } = useOutreachManagement()

  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male')
  const [localExpanded, setLocalExpanded] = useState(false)
  const [autoAssigning, setAutoAssigning] = useState(false)

  // Bulk selection
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [bulkSubmitting, setBulkSubmitting] = useState(false)

  // Servant picker modal — used for both single and bulk
  const [pickerVisible, setPickerVisible] = useState(false)
  const [pendingAssignmentId, setPendingAssignmentId] = useState<string | null>(null)
  const [pendingStudentId, setPendingStudentId] = useState<string | null>(null)
  // When non-null, picker is in bulk mode
  const [bulkPickerMode, setBulkPickerMode] = useState(false)

  const isSelecting = selectedKeys.size > 0
  const realServantCount = servants.filter(sv => sv.id !== PHANTOM_SERVANT_ID).length

  function toggleItem(item: SectionItem) {
    const key = itemKey(item)
    setSelectedKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function clearSelection() {
    setSelectedKeys(new Set())
  }

  // Filter by selected gender
  const filteredServants = servants.filter(sv => sv.gender === selectedGender || sv.gender === null)

  function buildSections(): Section[] {
    const sections: Section[] = []

    const byName = (a: Student, b: Student) =>
      studentDisplayName(a).localeCompare(studentDisplayName(b))

    for (const servant of filteredServants) {
      const filteredKids = servant.assignedKids
        .filter(k => k.student.gender === selectedGender)
        .sort((a, b) => byName(a.student, b.student))
      const isPhantom = servant.id === PHANTOM_SERVANT_ID
      sections.push({
        title: `${servant.fullName} (${filteredKids.length})`,
        type: isPhantom ? 'phantom' : 'servant',
        servantId: servant.id,
        data: filteredKids.map(kid => ({ kind: 'assigned', kid, servant } as SectionItem)),
      })
    }

    const filteredUnassigned = unassigned
      .filter(s => s.gender === selectedGender)
      .sort(byName)
    sections.push({
      title: `Unassigned (${filteredUnassigned.length})`,
      type: 'unassigned',
      data: filteredUnassigned.map(s => ({ kind: 'unassigned', student: s } as SectionItem)),
    })

    const filteredLocal = localFriends
      .filter(k => k.student.gender === selectedGender)
      .sort((a, b) => byName(a.student, b.student))
    sections.push({
      title: `Local Friends (${filteredLocal.length})`,
      type: 'local',
      data: localExpanded ? filteredLocal.map(k => ({ kind: 'local', kid: k } as SectionItem)) : [],
    })

    return sections
  }

  function handleKidTap(item: SectionItem) {
    // In selection mode, tap always toggles
    if (isSelecting) {
      toggleItem(item)
      return
    }

    if (item.kind === 'assigned') {
      const kidName = studentDisplayName(item.kid.student)
      const assignmentId = item.kid.assignment?.id
      if (!assignmentId) return

      Alert.alert(kidName, 'What would you like to do?', [
        {
          text: 'Reassign to\u2026',
          onPress: () => { setPendingAssignmentId(assignmentId); setPickerVisible(true) },
        },
        {
          text: 'Mark as Local Friend',
          onPress: () => markLocalFriend(assignmentId),
        },
        {
          text: 'Remove Assignment',
          style: 'destructive',
          onPress: () => unassignKid(assignmentId),
        },
        { text: 'Cancel', style: 'cancel' },
      ])
    } else if (item.kind === 'unassigned') {
      const kidName = studentDisplayName(item.student)
      Alert.alert(kidName, 'Assign to a servant?', [
        {
          text: 'Assign to\u2026',
          onPress: () => { setPendingStudentId(item.student.id); setPickerVisible(true) },
        },
        { text: 'Cancel', style: 'cancel' },
      ])
    } else if (item.kind === 'local') {
      const kidName = studentDisplayName(item.kid.student)
      Alert.alert(kidName, 'This kid is a local friend.', [
        {
          text: 'Restore to Active',
          onPress: () => unmarkLocalFriend(item.kid.assignment.id),
        },
        { text: 'Cancel', style: 'cancel' },
      ])
    }
  }

  function handleKidLongPress(item: SectionItem) {
    // Long press enters selection mode
    toggleItem(item)
  }

  async function handlePickServant(servant: ManageServant) {
    setPickerVisible(false)

    if (bulkPickerMode) {
      setBulkPickerMode(false)
      setBulkSubmitting(true)

      // Split selected keys into assignment IDs (assigned/phantom) and student IDs (unassigned)
      const assignmentIds: string[] = []
      const studentIds: string[] = []

      // Walk all sections to resolve keys → IDs
      const sections = buildSections()
      for (const section of sections) {
        for (const item of section.data) {
          const key = itemKey(item)
          if (!selectedKeys.has(key)) continue
          if (item.kind === 'assigned') {
            if (item.kid.assignment?.id) assignmentIds.push(item.kid.assignment.id)
          } else if (item.kind === 'unassigned') {
            studentIds.push(item.student.id)
          }
          // local friends not selectable in bulk (excluded below)
        }
      }

      const results = await Promise.all([
        assignmentIds.length ? bulkReassign(assignmentIds, servant.id) : Promise.resolve({ error: null }),
        studentIds.length ? bulkAssign(studentIds, servant.id) : Promise.resolve({ error: null }),
      ])
      setBulkSubmitting(false)
      clearSelection()

      const err = results.find(r => r.error)?.error
      if (err) Alert.alert('Error', err.message || 'Something went wrong')
    } else {
      if (pendingAssignmentId) {
        reassignKid(pendingAssignmentId, servant.id)
        setPendingAssignmentId(null)
      } else if (pendingStudentId) {
        assignKid(pendingStudentId, servant.id)
        setPendingStudentId(null)
      }
    }
  }

  function handleBulkAssignPress() {
    setBulkPickerMode(true)
    setPickerVisible(true)
  }

  async function handleAutoAssign() {
    setAutoAssigning(true)
    await autoAssign(selectedGender)
    setAutoAssigning(false)
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const sections = buildSections()
  const pickerServants = filteredServants

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>{'\u2039'} Back</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Manage Assignments</Text>
          {isSelecting ? (
            <TouchableOpacity style={styles.cancelSelectButton} onPress={clearSelection}>
              <Text style={styles.cancelSelectText}>Cancel</Text>
            </TouchableOpacity>
          ) : realServantCount > 1 ? (
            <TouchableOpacity
              style={[styles.autoAssignButton, autoAssigning && { opacity: 0.6 }]}
              onPress={handleAutoAssign}
              disabled={autoAssigning}
            >
              {autoAssigning
                ? <ActivityIndicator size="small" color={colors.primaryText} />
                : <Text style={styles.autoAssignText}>Auto-Assign</Text>
              }
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Gender toggle */}
      <View style={styles.genderControl}>
        {(['male', 'female'] as const).map(g => (
          <TouchableOpacity
            key={g}
            style={[styles.genderTab, selectedGender === g && styles.genderTabActive]}
            onPress={() => { setSelectedGender(g); clearSelection() }}
          >
            <Text style={[styles.genderTabText, selectedGender === g && styles.genderTabTextActive]}>
              {g === 'male' ? 'Boys' : 'Girls'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => {
          if (item.kind === 'assigned') return item.kid.assignment?.id ?? `a-${index}`
          if (item.kind === 'unassigned') return `u-${item.student.id}`
          return `l-${item.kid.assignment.id}`
        }}
        contentContainerStyle={[styles.list, isSelecting && styles.listWithBar]}
        renderSectionHeader={({ section }) => {
          if (section.type === 'local') {
            return (
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => setLocalExpanded(e => !e)}
              >
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionChevron}>{localExpanded ? '\u25B2' : '\u25BC'}</Text>
              </TouchableOpacity>
            )
          }
          return (
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, section.type === 'phantom' && styles.sectionTitlePhantom]}>
                {section.title}
              </Text>
            </View>
          )
        }}
        renderItem={({ item }) => {
          const key = itemKey(item)
          const checked = selectedKeys.has(key)
          const isLocal = item.kind === 'local'
          const name = item.kind === 'unassigned'
            ? studentDisplayName(item.student)
            : studentDisplayName(item.kind === 'assigned' ? item.kid.student : item.kid.student)

          return (
            <TouchableOpacity
              style={[styles.kidRow, checked && styles.kidRowSelected]}
              onPress={() => handleKidTap(item)}
              onLongPress={() => handleKidLongPress(item)}
              disabled={isLocal && isSelecting}
            >
              {!isLocal && (
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                  {checked && <Text style={styles.checkmark}>✓</Text>}
                </View>
              )}
              <Text style={[styles.kidName, checked && styles.kidNameSelected]}>{name}</Text>
            </TouchableOpacity>
          )
        }}
        stickySectionHeadersEnabled={false}
      />

      {/* Bulk action bar */}
      {isSelecting && (
        <View style={styles.bulkBar}>
          <Text style={styles.bulkCount}>{selectedKeys.size} selected</Text>
          <TouchableOpacity
            style={[styles.bulkAssignButton, bulkSubmitting && { opacity: 0.6 }]}
            onPress={handleBulkAssignPress}
            disabled={bulkSubmitting}
          >
            {bulkSubmitting
              ? <ActivityIndicator size="small" color={colors.primaryText} />
              : <Text style={styles.bulkAssignText}>Assign to…</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Servant picker modal */}
      <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => {
        setPickerVisible(false)
        setBulkPickerMode(false)
        setPendingAssignmentId(null)
        setPendingStudentId(null)
      }}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>
              {bulkPickerMode
                ? `Assign ${selectedKeys.size} kids to\u2026`
                : pendingAssignmentId ? 'Reassign to\u2026' : 'Assign to\u2026'
              }
            </Text>
            <FlatList
              data={pickerServants}
              keyExtractor={sv => sv.id}
              renderItem={({ item: sv }) => (
                <TouchableOpacity style={styles.pickerRow} onPress={() => handlePickServant(sv)}>
                  <Text style={[styles.pickerServantName, sv.id === PHANTOM_SERVANT_ID && styles.pickerServantNamePhantom]}>
                    {sv.fullName}
                  </Text>
                  <Text style={styles.pickerKidCount}>{sv.assignedKids.filter(k => k.student.gender === selectedGender).length} kids</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.pickerEmpty}>No servants available</Text>
              }
            />
            <TouchableOpacity
              style={styles.pickerCancel}
              onPress={() => {
                setPickerVisible(false)
                setBulkPickerMode(false)
                setPendingAssignmentId(null)
                setPendingStudentId(null)
              }}
            >
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const createStyles = (colors: ThemeColors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.background,
    padding: 24,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 12,
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
  headerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    flex: 1,
  },
  autoAssignButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 96,
    alignItems: 'center' as const,
  },
  autoAssignText: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  cancelSelectButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelSelectText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600' as const,
  },
  genderControl: {
    flexDirection: 'row' as const,
    margin: 16,
    backgroundColor: colors.border,
    borderRadius: 10,
    padding: 2,
  },
  genderTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center' as const,
    borderRadius: 8,
  },
  genderTabActive: {
    backgroundColor: colors.card,
  },
  genderTabText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  genderTabTextActive: {
    color: colors.textPrimary,
    fontWeight: '600' as const,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  listWithBar: {
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 10,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  sectionTitlePhantom: {
    color: colors.textMuted,
    fontStyle: 'italic' as const,
  },
  sectionChevron: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  kidRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  kidRowSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EAF2FF',
  },
  kidName: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  kidNameSelected: {
    color: colors.primary,
    fontWeight: '500' as const,
  },
  kidChevron: {
    fontSize: 18,
    color: colors.textMuted,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700' as const,
    lineHeight: 16,
  },
  bulkBar: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 30 : 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 8,
  },
  bulkCount: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  bulkAssignButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center' as const,
  },
  bulkAssignText: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  errorText: {
    fontSize: 15,
    color: colors.error,
    textAlign: 'center' as const,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end' as const,
  },
  pickerSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '60%' as const,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  pickerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  pickerServantName: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  pickerServantNamePhantom: {
    color: colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  pickerKidCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  pickerEmpty: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center' as const,
    paddingVertical: 20,
  },
  pickerCancel: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },
  pickerCancelText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600' as const,
  },
})
