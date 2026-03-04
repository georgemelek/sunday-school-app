import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
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
            placeholderTextColor="#999"
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
            placeholderTextColor="#999"
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
            placeholderTextColor="#999"
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
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Location Address (optional)</Text>
          <TextInput
            style={styles.input}
            value={locationAddress}
            onChangeText={setLocationAddress}
            placeholder="Enter address"
            placeholderTextColor="#999"
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
            placeholderTextColor="#999"
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
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>{isEdit ? 'Save Changes' : 'Create Session'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
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
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputError: {
    borderColor: '#f44336',
  },
  textArea: {
    minHeight: 80,
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  servantChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  servantChipText: {
    fontSize: 14,
    color: '#333',
  },
  servantChipTextSelected: {
    color: '#fff',
  },

  // Status
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statusChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  statusChipText: {
    fontSize: 14,
    color: '#333',
  },
  statusChipTextSelected: {
    color: '#fff',
  },

  // Footer
  footer: {
    padding: 16,
    paddingBottom: 34,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  deleteButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: '600',
  },
})
