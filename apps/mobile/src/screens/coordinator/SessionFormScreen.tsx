import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import type { Session } from '../../hooks/useSessions'
import type { Servant } from '../../data/mockData'

interface SessionFormScreenProps {
  classId: string
  session?: Session
  servants: Servant[]
  defaultLocation?: string
  defaultLocationAddress?: string
  onBack: () => void
  onSave: (data: Partial<Session>) => void
  onDelete?: (sessionId: string) => void
}

export default function SessionFormScreen({
  classId,
  session,
  servants,
  defaultLocation = '',
  defaultLocationAddress = '',
  onBack,
  onSave,
  onDelete,
}: SessionFormScreenProps) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()

  const isEdit = !!session

  const [date, setDate] = useState(session?.date || '')
  const [lessonTopic, setLessonTopic] = useState(session?.lessonTopic || '')
  const [lessonPage, setLessonPage] = useState(session?.lessonPage || '')
  const [locationName, setLocationName] = useState(session?.locationName || defaultLocation)
  const [locationAddress, setLocationAddress] = useState(session?.locationAddress || defaultLocationAddress)
  const [lessonServantId, setLessonServantId] = useState<string | null>(session?.lessonServantId || null)
  const [classAdminId, setClassAdminId] = useState<string | null>(session?.classAdminId || null)
  const [status, setStatus] = useState<'scheduled' | 'canceled' | 'completed'>(session?.status || 'scheduled')
  const [notes, setNotes] = useState(session?.notes || '')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      newErrors.date = 'Enter a valid date (YYYY-MM-DD)'
    }
    if (!lessonTopic.trim()) {
      newErrors.lessonTopic = 'Lesson topic is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      onSave({
        id: session?.id,
        classId,
        date,
        startTime: session?.startTime || '11:30',
        endTime: session?.endTime || '12:30',
        lessonTopic: lessonTopic.trim(),
        lessonPage,
        lessonReference: session?.lessonReference || '',
        locationName,
        locationAddress,
        lessonServantId,
        classAdminId,
        status,
        notes: notes.trim(),
      })
    } finally {
      setSaving(false)
    }
  }

  function handleDelete() {
    if (!session || !onDelete) return
    Alert.alert(
      'Delete Session',
      `Are you sure you want to delete the session on ${session.date}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(session.id) },
      ]
    )
  }

  function renderServantPicker(label: string, selectedId: string | null, onSelect: (id: string | null) => void) {
    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servantPicker}>
          <TouchableOpacity
            style={[styles.servantChip, selectedId === null && styles.servantChipSelected]}
            onPress={() => onSelect(null)}
          >
            <Text style={[styles.servantChipText, selectedId === null && styles.servantChipTextSelected]}>None</Text>
          </TouchableOpacity>
          {servants.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.servantChip, selectedId === s.id && styles.servantChipSelected]}
              onPress={() => onSelect(s.id)}
            >
              <Text style={[styles.servantChipText, selectedId === s.id && styles.servantChipTextSelected]}>
                {s.fullName.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.cancelButton}>{'\u2039'} Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Session' : 'Add Session'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        {/* Date */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Date</Text>
          <TextInput
            style={[styles.input, errors.date && styles.inputError]}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
          />
          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
        </View>

        {/* Lesson Topic */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Lesson Topic</Text>
          <TextInput
            style={[styles.input, errors.lessonTopic && styles.inputError]}
            value={lessonTopic}
            onChangeText={setLessonTopic}
            placeholder="Enter lesson topic"
            placeholderTextColor={colors.textMuted}
          />
          {errors.lessonTopic && <Text style={styles.errorText}>{errors.lessonTopic}</Text>}
        </View>

        {/* Lesson Page */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Lesson Page (optional)</Text>
          <TextInput
            style={styles.input}
            value={lessonPage}
            onChangeText={setLessonPage}
            placeholder="e.g., 45"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
          />
        </View>

        {/* Location */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Location Name</Text>
          <TextInput
            style={styles.input}
            value={locationName}
            onChangeText={setLocationName}
            placeholder="Enter location"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Location Address (optional)</Text>
          <TextInput
            style={styles.input}
            value={locationAddress}
            onChangeText={setLocationAddress}
            placeholder="Enter address"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Servant pickers */}
        {renderServantPicker('Lesson Servant', lessonServantId, setLessonServantId)}
        {renderServantPicker('Class Admin', classAdminId, setClassAdminId)}

        {/* Status */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Status</Text>
          <View style={styles.statusRow}>
            {(['scheduled', 'completed', 'canceled'] as const).map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.statusChip, status === s && styles.statusChipSelected]}
                onPress={() => setStatus(s)}
              >
                <Text style={[styles.statusChipText, status === s && styles.statusChipTextSelected]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {isEdit && onDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete Session</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primaryText} />
          ) : (
            <Text style={styles.saveButtonText}>{isEdit ? 'Save Changes' : 'Create Session'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const createStyles = (colors: ThemeColors) => ({
  container: {
    flex: 1 as const,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelButton: {
    fontSize: 16,
    color: colors.primary,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  form: {
    padding: 16,
    paddingBottom: 120,
  },

  // Fields
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.error,
  },
  textArea: {
    minHeight: 80,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },

  // Servant picker
  servantPicker: {
    gap: 8,
  },
  servantChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  servantChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  servantChipText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  servantChipTextSelected: {
    color: colors.primaryText,
  },

  // Status
  statusRow: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusChipText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  statusChipTextSelected: {
    color: colors.primaryText,
  },

  // Footer
  footer: {
    padding: 16,
    paddingBottom: 34,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center' as const,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  deleteButton: {
    borderRadius: 10,
    padding: 14,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600' as const,
  },
})
