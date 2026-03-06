import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import { Student, StudentFormData, EMPTY_FORM } from '../../hooks/useStudents'

interface StudentFormScreenProps {
  mode: 'add' | 'edit'
  gradeId: string
  gradeName: string
  student?: Student
  onSave: (formData: StudentFormData) => Promise<{ error: string | null }>
  onBack: () => void
}

function formDataFromStudent(s: Student): StudentFormData {
  return {
    first_name: s.first_name ?? '',
    last_name: s.last_name ?? '',
    date_of_birth: s.date_of_birth ?? '',
    gender: s.gender ?? '',
    student_phone: s.student_phone ?? '',
    mother_first_name: s.mother_first_name ?? '',
    mother_last_name: s.mother_last_name ?? '',
    mother_phone: s.mother_phone ?? '',
    mother_email: s.mother_email ?? '',
    father_first_name: s.father_first_name ?? '',
    father_last_name: s.father_last_name ?? '',
    father_phone: s.father_phone ?? '',
    father_email: s.father_email ?? '',
    street: s.street ?? '',
    city: s.city ?? '',
    state: s.state ?? '',
    zip: s.zip ?? '',
    country: s.country ?? 'USA',
    notes: s.notes ?? '',
  }
}

export default function StudentFormScreen({
  mode,
  gradeId,
  gradeName,
  student,
  onSave,
  onBack,
}: StudentFormScreenProps) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const [formData, setFormData] = useState<StudentFormData>(
    student ? formDataFromStudent(student) : EMPTY_FORM
  )
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormData, string>>>({})

  function updateField(field: keyof StudentFormData, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  function validate() {
    const e: Partial<Record<keyof StudentFormData, string>> = {}

    if (!formData.first_name.trim()) e.first_name = 'First name is required'
    if (!formData.last_name.trim()) e.last_name = 'Last name is required'

    if (formData.date_of_birth) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(formData.date_of_birth)) e.date_of_birth = 'Use YYYY-MM-DD format'
      else if (isNaN(new Date(formData.date_of_birth).getTime())) e.date_of_birth = 'Invalid date'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.mother_email && !emailRegex.test(formData.mother_email)) e.mother_email = 'Invalid email'
    if (formData.father_email && !emailRegex.test(formData.father_email)) e.father_email = 'Invalid email'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    const { error } = await onSave(formData)
    setSaving(false)
    if (error) {
      Alert.alert('Error', error)
    } else {
      Alert.alert(
        'Success',
        mode === 'add' ? 'Student added!' : 'Student updated!',
        [{ text: 'OK', onPress: onBack }]
      )
    }
  }

  function field(
    label: string,
    key: keyof StudentFormData,
    opts?: {
      required?: boolean
      placeholder?: string
      keyboardType?: 'default' | 'phone-pad' | 'email-address'
      autoCapitalize?: 'none' | 'words' | 'sentences'
    }
  ) {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>
          {label}{opts?.required && <Text style={styles.required}> *</Text>}
        </Text>
        <TextInput
          style={[styles.input, errors[key] && styles.inputError]}
          placeholder={opts?.placeholder ?? ''}
          placeholderTextColor={colors.textSecondary}
          value={formData[key]}
          onChangeText={v => updateField(key, v)}
          editable={!saving}
          keyboardType={opts?.keyboardType ?? 'default'}
          autoCapitalize={opts?.autoCapitalize ?? 'sentences'}
        />
        {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButtonText}>‹ Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{mode === 'add' ? 'Add Student' : 'Edit Student'}</Text>
        <Text style={styles.subtitle}>{gradeName}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">

        {/* Student */}
        <Text style={styles.sectionHeader}>Student</Text>
        {field('First Name', 'first_name', { required: true, placeholder: 'First name', autoCapitalize: 'words' })}
        {field('Last Name', 'last_name', { required: true, placeholder: 'Last name', autoCapitalize: 'words' })}
        {field('Date of Birth', 'date_of_birth', { placeholder: 'YYYY-MM-DD' })}

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            {(['male', 'female'] as const).map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.genderChip, formData.gender === g && styles.genderChipSelected]}
                onPress={() => updateField('gender', formData.gender === g ? '' : g)}
                disabled={saving}
              >
                <Text style={[styles.genderChipText, formData.gender === g && styles.genderChipTextSelected]}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {field('Student Phone', 'student_phone', { placeholder: '555-123-4567', keyboardType: 'phone-pad' })}

        {/* Mother */}
        <Text style={styles.sectionHeader}>Mother / Guardian</Text>
        {field('Mother First Name', 'mother_first_name', { placeholder: 'First name', autoCapitalize: 'words' })}
        {field('Mother Last Name', 'mother_last_name', { placeholder: 'Last name', autoCapitalize: 'words' })}
        {field('Mother Phone', 'mother_phone', { placeholder: '555-123-4567', keyboardType: 'phone-pad' })}
        {field('Mother Email', 'mother_email', { placeholder: 'mother@example.com', keyboardType: 'email-address', autoCapitalize: 'none' })}

        {/* Father */}
        <Text style={styles.sectionHeader}>Father / Guardian</Text>
        {field('Father First Name', 'father_first_name', { placeholder: 'First name', autoCapitalize: 'words' })}
        {field('Father Last Name', 'father_last_name', { placeholder: 'Last name', autoCapitalize: 'words' })}
        {field('Father Phone', 'father_phone', { placeholder: '555-123-4567', keyboardType: 'phone-pad' })}
        {field('Father Email', 'father_email', { placeholder: 'father@example.com', keyboardType: 'email-address', autoCapitalize: 'none' })}

        {/* Address */}
        <Text style={styles.sectionHeader}>Address</Text>
        {field('Street', 'street', { placeholder: '123 Main St', autoCapitalize: 'words' })}
        {field('City', 'city', { placeholder: 'Naperville', autoCapitalize: 'words' })}
        {field('State', 'state', { placeholder: 'IL', autoCapitalize: 'words' })}
        {field('Zip', 'zip', { placeholder: '60540', keyboardType: 'phone-pad' })}
        {field('Country', 'country', { placeholder: 'USA', autoCapitalize: 'words' })}

        {/* Notes */}
        <Text style={styles.sectionHeader}>Notes</Text>
        <View style={styles.fieldContainer}>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Allergies, medical conditions, anything useful…"
            placeholderTextColor={colors.textSecondary}
            value={formData.notes}
            onChangeText={v => updateField('notes', v)}
            editable={!saving}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <Text style={styles.requiredNote}><Text style={styles.required}>*</Text> Required</Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color={colors.primaryText} />
            : <Text style={styles.saveButtonText}>{mode === 'add' ? 'Add Student' : 'Save Changes'}</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  )
}

const createStyles = (colors: ThemeColors) => ({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.card,
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButtonText: { fontSize: 18, color: colors.primary, fontWeight: '600' as const, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  scrollView: { flex: 1 },
  formContainer: { padding: 20, paddingBottom: 40 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 12,
  },
  fieldContainer: { marginBottom: 16 },
  label: { fontSize: 15, fontWeight: '600' as const, color: colors.textPrimary, marginBottom: 6 },
  required: { color: colors.error },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  inputError: { borderColor: colors.error },
  textArea: { height: 100, paddingTop: 12 },
  errorText: { color: colors.error, fontSize: 12, marginTop: 4 },
  genderRow: { flexDirection: 'row' as const, gap: 12 },
  genderChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    alignItems: 'center' as const,
  },
  genderChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  genderChipText: { fontSize: 15, fontWeight: '600' as const, color: colors.textSecondary },
  genderChipTextSelected: { color: colors.primaryText },
  requiredNote: { fontSize: 13, color: colors.textSecondary, marginTop: 8 },
  footer: {
    backgroundColor: colors.card,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center' as const,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: colors.primaryText, fontSize: 16, fontWeight: '600' as const },
})
