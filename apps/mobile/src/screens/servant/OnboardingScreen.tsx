import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import { supabase } from '../../lib/supabase'
import { TABLES } from '../../lib/tables'
import { useAuth } from '../../contexts/AuthContext'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GradeEntry {
  id: string  // temp local id for UI tracking
  name: string
}

interface ClassDefinition {
  id: string  // temp local id
  name: string
  classTypeName: string
  gradeIds: string[]  // which of the entered grades participate (temp local ids)
}

interface OnboardingScreenProps {
  onComplete: () => void
  onSkip: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GRADE_OPTIONS = [
  'Kindergarten',
  '1st Grade',
  '2nd Grade',
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
  '7th Grade',
  '8th Grade',
  '9th Grade',
  '10th Grade',
  '11th Grade',
  '12th Grade',
]

const CLASS_TYPE_OPTIONS = [
  'Sunday School',
  'Small Group',
  'FNA',
  'Bible Study',
]

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  const { colors } = useTheme()
  return (
    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === current ? colors.primary : colors.border,
          }}
        />
      ))}
    </View>
  )
}

// ─── Grade picker ─────────────────────────────────────────────────────────────

function GradePicker({
  value,
  onChange,
  exclude,
}: {
  value: string
  onChange: (name: string) => void
  exclude: string[]
}) {
  const { colors } = useTheme()
  const [open, setOpen] = useState(false)
  const available = GRADE_OPTIONS.filter(g => !exclude.includes(g))

  return (
    <>
      <TouchableOpacity
        style={{
          backgroundColor: colors.inputBackground,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          padding: 14,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
        onPress={() => setOpen(true)}
      >
        <Text style={{ fontSize: 16, color: value ? colors.textPrimary : colors.textSecondary }}>
          {value || 'Select a grade…'}
        </Text>
        <Text style={{ fontSize: 16, color: colors.textSecondary }}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 32 }}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={{ backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              Select Grade
            </Text>
            <ScrollView>
              {available.map(grade => (
                <TouchableOpacity
                  key={grade}
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.borderLight,
                    backgroundColor: grade === value ? colors.alertInfoBg : colors.card,
                  }}
                  onPress={() => { onChange(grade); setOpen(false) }}
                >
                  <Text style={{ fontSize: 16, color: grade === value ? colors.primary : colors.textPrimary }}>
                    {grade}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OnboardingScreen({ onComplete, onSkip }: OnboardingScreenProps) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const { profile } = useAuth()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [grades, setGrades] = useState<GradeEntry[]>([{ id: 'g0', name: '' }])
  const [classes, setClasses] = useState<ClassDefinition[]>([])
  const [myClassIds, setMyClassIds] = useState<Set<string>>(new Set())

  const isMultiGrade = grades.length > 1

  // ── Step 1 ──────────────────────────────────────────────────────────────────

  function addGrade() {
    setGrades(prev => [...prev, { id: `g${Date.now()}`, name: '' }])
  }

  function updateGrade(id: string, name: string) {
    // When a grade name changes, reset classes since selections may no longer make sense
    setGrades(prev => prev.map(g => g.id === id ? { ...g, name } : g))
    setClasses([])
    setMyClassIds(new Set())
  }

  function removeGrade(id: string) {
    setGrades(prev => prev.filter(g => g.id !== id))
    setClasses(prev =>
      prev
        .map(c => ({ ...c, gradeIds: c.gradeIds.filter(gid => gid !== id) }))
        .filter(c => c.gradeIds.length > 0)
    )
    setMyClassIds(prev => {
      const removedClassIds = classes
        .filter(c => c.gradeIds.length === 1 && c.gradeIds[0] === id)
        .map(c => c.id)
      const next = new Set(prev)
      removedClassIds.forEach(cid => next.delete(cid))
      return next
    })
  }

  function step1Valid() {
    return grades.length > 0 && grades.every(g => g.name.trim().length > 0)
  }

  // ── Step 2 ──────────────────────────────────────────────────────────────────

  // Single-grade: toggle the class type on/off for the only grade
  function toggleClassSingleGrade(classTypeName: string) {
    const gradeId = grades[0].id
    const existing = classes.find(c => c.classTypeName === classTypeName)
    if (existing) {
      setClasses(prev => prev.filter(c => c.id !== existing.id))
      setMyClassIds(prev => { const n = new Set(prev); n.delete(existing.id); return n })
    } else {
      const newClass: ClassDefinition = {
        id: `c${Date.now()}`,
        name: classTypeName,
        classTypeName,
        gradeIds: [gradeId],
      }
      setClasses(prev => [...prev, newClass])
    }
  }

  function isClassTypeToggled(classTypeName: string) {
    return classes.some(c => c.classTypeName === classTypeName)
  }

  // Multi-grade: toggle a specific grade into/out of a class type
  function toggleClassMultiGrade(classTypeName: string, gradeId: string) {
    const existing = classes.find(c => c.classTypeName === classTypeName)
    if (existing) {
      const hasGrade = existing.gradeIds.includes(gradeId)
      if (hasGrade) {
        const newGradeIds = existing.gradeIds.filter(id => id !== gradeId)
        if (newGradeIds.length === 0) {
          setClasses(prev => prev.filter(c => c.id !== existing.id))
          setMyClassIds(prev => { const n = new Set(prev); n.delete(existing.id); return n })
        } else {
          setClasses(prev => prev.map(c => c.id === existing.id ? { ...c, gradeIds: newGradeIds } : c))
        }
      } else {
        setClasses(prev => prev.map(c => c.id === existing.id ? { ...c, gradeIds: [...c.gradeIds, gradeId] } : c))
      }
    } else {
      setClasses(prev => [...prev, {
        id: `c${Date.now()}`,
        name: classTypeName,
        classTypeName,
        gradeIds: [gradeId],
      }])
    }
  }

  function isGradeInClass(classTypeName: string, gradeId: string) {
    return classes.some(c => c.classTypeName === classTypeName && c.gradeIds.includes(gradeId))
  }

  function step2Valid() {
    return classes.length > 0
  }

  // ── Step 3 ──────────────────────────────────────────────────────────────────

  function toggleMyClass(classId: string) {
    setMyClassIds(prev => {
      const next = new Set(prev)
      next.has(classId) ? next.delete(classId) : next.add(classId)
      return next
    })
  }

  // ── Save ─────────────────────────────────────────────────────────────────────

  async function handleFinish() {
    if (!profile) return
    setSaving(true)

    try {
      const { data: classTypes, error: ctError } = await supabase
        .from(TABLES.CLASS_TYPES)
        .select('id, name')
      if (ctError) throw ctError

      const classTypeMap = Object.fromEntries(
        (classTypes ?? []).map((ct: { id: string; name: string }) => [ct.name, ct.id])
      )

      const gradeIdMap: Record<string, string> = {}

      for (const grade of grades) {
        const { data: gradeRow, error: gradeError } = await supabase
          .from(TABLES.GRADES)
          .insert({ name: grade.name.trim(), created_by: profile.id })
          .select()
          .single()
        if (gradeError) throw gradeError

        gradeIdMap[grade.id] = gradeRow.id

        await supabase
          .from(TABLES.SERVANT_GRADES)
          .insert({ servant_id: profile.id, grade_id: gradeRow.id })
      }

      for (const cls of classes) {
        const classTypeId = classTypeMap[cls.classTypeName]
        if (!classTypeId) continue

        const { data: classRow, error: classError } = await supabase
          .from(TABLES.CLASSES)
          .insert({ name: cls.name, class_type_id: classTypeId, created_by: profile.id })
          .select()
          .single()
        if (classError) throw classError

        for (const localGradeId of cls.gradeIds) {
          const realGradeId = gradeIdMap[localGradeId]
          if (!realGradeId) continue
          await supabase
            .from(TABLES.CLASS_GRADES)
            .insert({ class_id: classRow.id, grade_id: realGradeId })
        }

        if (myClassIds.has(cls.id)) {
          await supabase
            .from(TABLES.CLASS_SERVANTS)
            .insert({ class_id: classRow.id, servant_id: profile.id })
        }
      }

      onComplete()
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Render steps ─────────────────────────────────────────────────────────────

  function renderStep1() {
    const selectedNames = grades.map(g => g.name).filter(Boolean)

    return (
      <>
        <Text style={styles.stepTitle}>What grade(s) are you responsible for?</Text>
        <Text style={styles.stepSubtitle}>
          Select the grade(s) whose kids you manage — meaning you track their attendance, outreach, and student info.{'\n\n'}
          <Text style={styles.stepExample}>
            At a larger church: select just one grade (e.g. "6th Grade").{'\n'}
            At a smaller church where one servant covers multiple grades: add each grade separately (e.g. "5th Grade" + "6th Grade").{'\n\n'}
            Note: if you co-teach a combined class like FNA with another grade's servants, only add the grade(s) whose kids are your responsibility. You'll set up the combined class in the next step.
          </Text>
        </Text>

        {grades.map((grade, index) => (
          <View key={grade.id} style={styles.gradeRow}>
            <View style={{ flex: 1 }}>
              <GradePicker
                value={grade.name}
                onChange={name => updateGrade(grade.id, name)}
                exclude={selectedNames.filter(n => n !== grade.name)}
              />
            </View>
            {grades.length > 1 && (
              <TouchableOpacity style={styles.removeButton} onPress={() => removeGrade(grade.id)}>
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.addMoreButton} onPress={addGrade}>
          <Text style={styles.addMoreButtonText}>+ Add another grade</Text>
        </TouchableOpacity>
      </>
    )
  }

  function renderStep2() {
    return (
      <>
        <Text style={styles.stepTitle}>What classes does your grade have?</Text>
        <Text style={styles.stepSubtitle}>
          Select all classes that exist for your grade(s), including combined ones.{'\n\n'}
          <Text style={styles.stepExample}>
            Example at a large church: Sunday School, Small Group, and FNA — even if FNA includes 5th graders from another servant's roster.{'\n\n'}
            Example at a small church (covering 5th + 6th): you might select Sunday School for both grades — tap each grade chip to include it.{'\n\n'}
            Combined classes shared with other servants (like FNA) will be merged automatically when they set up their grade.
          </Text>
        </Text>

        {CLASS_TYPE_OPTIONS.map(classTypeName => (
          <View key={classTypeName} style={styles.classTypeSection}>
            <Text style={styles.classTypeLabel}>{classTypeName}</Text>

            {isMultiGrade ? (
              // Multi-grade: show a chip per grade
              <View style={styles.gradeChips}>
                {grades.map(grade => {
                  const checked = isGradeInClass(classTypeName, grade.id)
                  return (
                    <TouchableOpacity
                      key={grade.id}
                      style={[styles.chip, checked && styles.chipSelected]}
                      onPress={() => toggleClassMultiGrade(classTypeName, grade.id)}
                    >
                      <Text style={[styles.chipText, checked && styles.chipTextSelected]}>
                        {grade.name || 'Unnamed grade'}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            ) : (
              // Single-grade: just one on/off toggle for the class type
              <TouchableOpacity
                style={[styles.chip, isClassTypeToggled(classTypeName) && styles.chipSelected]}
                onPress={() => toggleClassSingleGrade(classTypeName)}
              >
                <Text style={[styles.chipText, isClassTypeToggled(classTypeName) && styles.chipTextSelected]}>
                  {isClassTypeToggled(classTypeName) ? 'Yes' : 'No'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </>
    )
  }

  function renderStep3() {
    return (
      <>
        <Text style={styles.stepTitle}>Which classes do YOU personally serve?</Text>
        <Text style={styles.stepSubtitle}>
          Select only the classes you actually teach or help with. Other servants can be added to a class later.{'\n\n'}
          <Text style={styles.stepExample}>
            Example: you serve Sunday School and FNA, but not Small Group — only check those two.
          </Text>
        </Text>

        {classes.map(cls => {
          const selected = myClassIds.has(cls.id)
          const gradeNames = cls.gradeIds
            .map(lid => grades.find(g => g.id === lid)?.name ?? '')
            .filter(Boolean)
            .join(', ')
          return (
            <TouchableOpacity
              key={cls.id}
              style={[styles.classCard, selected && styles.classCardSelected]}
              onPress={() => toggleMyClass(cls.id)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.classCardTitle, selected && styles.classCardTitleSelected]}>
                  {cls.classTypeName}
                </Text>
                {isMultiGrade && (
                  <Text style={styles.classCardSubtitle}>{gradeNames}</Text>
                )}
              </View>
              <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                {selected && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          )
        })}
      </>
    )
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  function handleNext() {
    if (step === 0 && !step1Valid()) {
      Alert.alert('Required', 'Please select a grade for each entry.')
      return
    }
    if (step === 1 && !step2Valid()) {
      Alert.alert('Required', 'Please select at least one class.')
      return
    }
    setStep(s => s + 1)
  }

  const stepContent = [renderStep1, renderStep2, renderStep3]
  const isLastStep = step === stepContent.length - 1

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Set Up Your Ministry</Text>
          <TouchableOpacity onPress={onSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <StepIndicator current={step} total={stepContent.length} />
          {stepContent[step]()}
        </ScrollView>

        <View style={styles.footer}>
          {step > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={() => setStep(s => s - 1)} disabled={saving}>
              <Text style={styles.backButtonText}>‹ Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextButton, saving && { opacity: 0.6 }]}
            onPress={isLastStep ? handleFinish : handleNext}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={colors.primaryText} />
              : <Text style={styles.nextButtonText}>{isLastStep ? 'Finish' : 'Next →'}</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (colors: ThemeColors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  skipText: {
    fontSize: 16,
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 28,
  },
  stepExample: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic' as const,
    lineHeight: 19,
  },
  gradeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  removeButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  addMoreButton: {
    marginTop: 4,
    paddingVertical: 8,
  },
  addMoreButtonText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '500' as const,
  },
  classTypeSection: {
    marginBottom: 24,
  },
  classTypeLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  gradeChips: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primaryText,
    fontWeight: '600' as const,
  },
  classCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  classCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.alertInfoBg,
  },
  classCardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  classCardTitleSelected: {
    color: colors.primary,
  },
  classCardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    fontSize: 14,
    color: colors.primaryText,
    fontWeight: '700' as const,
  },
  footer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'flex-end' as const,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  nextButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center' as const,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.primaryText,
  },
})
