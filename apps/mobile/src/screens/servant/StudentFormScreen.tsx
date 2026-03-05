import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import { Student } from '../../hooks/useStudents'

interface StudentFormScreenProps {
  mode: 'add' | 'edit'
  gradeId: string
  gradeName: string
  student?: Student
  onSave: (studentData: Partial<Student>) => Promise<{ error: string | null }>
  onBack: () => void
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
  const [formData, setFormData] = useState({
    name: student?.name || '',
    date_of_birth: student?.date_of_birth || '',
    parent_name: student?.parent_name || '',
    parent_phone: student?.parent_phone || '',
    parent_email: student?.parent_email || '',
    address: student?.address || '',
    city: student?.city || '',
    notes: student?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Student name is required'
    }

    // Validate date format if provided (YYYY-MM-DD)
    if (formData.date_of_birth) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(formData.date_of_birth)) {
        newErrors.date_of_birth = 'Date must be in YYYY-MM-DD format'
      } else {
        const date = new Date(formData.date_of_birth)
        if (isNaN(date.getTime())) {
          newErrors.date_of_birth = 'Invalid date'
        }
      }
    }

    // Validate email format if provided
    if (formData.parent_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.parent_email)) {
        newErrors.parent_email = 'Invalid email format'
      }
    }

    // Validate phone format if provided (simple validation)
    if (formData.parent_phone) {
      const phoneRegex = /^[\d\s\-\(\)]+$/
      if (!phoneRegex.test(formData.parent_phone)) {
        newErrors.parent_phone = 'Invalid phone format'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    setSaving(true)
    const { error } = await onSave(formData)
    setSaving(false)

    if (error) {
      Alert.alert('Error', error)
    } else {
      Alert.alert(
        'Success',
        mode === 'add' ? 'Student added successfully!' : 'Student updated successfully!',
        [{ text: 'OK', onPress: onBack }]
      )
    }
  }

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>‹ Cancel</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>
            {mode === 'add' ? 'Add Student' : 'Edit Student'}
          </Text>
          <Text style={styles.subtitle}>{gradeName}</Text>
        </View>
      </View>

      {/* Form */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.formContainer}>
        {/* Student Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Student Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Enter student's full name"
            value={formData.name}
            onChangeText={value => updateField('name', value)}
            editable={!saving}
            autoCapitalize="words"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Date of Birth */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={[styles.input, errors.date_of_birth && styles.inputError]}
            placeholder="YYYY-MM-DD (e.g., 2010-05-15)"
            value={formData.date_of_birth}
            onChangeText={value => updateField('date_of_birth', value)}
            editable={!saving}
          />
          {errors.date_of_birth && (
            <Text style={styles.errorText}>{errors.date_of_birth}</Text>
          )}
        </View>

        {/* Parent Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Parent/Guardian Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter parent's name"
            value={formData.parent_name}
            onChangeText={value => updateField('parent_name', value)}
            editable={!saving}
            autoCapitalize="words"
          />
        </View>

        {/* Parent Phone */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Parent Phone</Text>
          <TextInput
            style={[styles.input, errors.parent_phone && styles.inputError]}
            placeholder="555-123-4567"
            value={formData.parent_phone}
            onChangeText={value => updateField('parent_phone', value)}
            editable={!saving}
            keyboardType="phone-pad"
          />
          {errors.parent_phone && (
            <Text style={styles.errorText}>{errors.parent_phone}</Text>
          )}
        </View>

        {/* Parent Email */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Parent Email</Text>
          <TextInput
            style={[styles.input, errors.parent_email && styles.inputError]}
            placeholder="parent@example.com"
            value={formData.parent_email}
            onChangeText={value => updateField('parent_email', value)}
            editable={!saving}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.parent_email && (
            <Text style={styles.errorText}>{errors.parent_email}</Text>
          )}
        </View>

        {/* Address */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Street address"
            value={formData.address}
            onChangeText={value => updateField('address', value)}
            editable={!saving}
            autoCapitalize="words"
          />
        </View>

        {/* City */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            placeholder="City"
            value={formData.city}
            onChangeText={value => updateField('city', value)}
            editable={!saving}
            autoCapitalize="words"
          />
        </View>

        {/* Notes */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any special notes (allergies, medical conditions, etc.)"
            value={formData.notes}
            onChangeText={value => updateField('notes', value)}
            editable={!saving}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Required fields note */}
        <Text style={styles.requiredNote}>
          <Text style={styles.required}>*</Text> Required fields
        </Text>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Text style={styles.saveButtonText}>
              {mode === 'add' ? 'Add Student' : 'Save Changes'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

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
  headerContent: {
    marginTop: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  required: {
    color: colors.error,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.error,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  requiredNote: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
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
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600' as const,
  },
})
