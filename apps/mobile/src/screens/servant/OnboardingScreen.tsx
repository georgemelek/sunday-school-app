import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { format } from 'date-fns'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import { supabase } from '../../lib/supabase'
import { TABLES } from '../../lib/tables'
import { useAuth } from '../../contexts/AuthContext'
import ImportStudentsScreen from './ImportStudentsScreen'

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
  // Schedule fields
  dayOfWeek: number | null  // 0=Sun … 6=Sat
  startTime: string  // 'HH:MM'
  endTime: string    // 'HH:MM'
  location: string   // 'Church' | 'Rotating (Parent Home)' | 'TBD' | 'Other'
  // Start/end date are shared across all classes — stored top-level in component state
}

interface OnboardingScreenProps {
  onComplete: () => void
  onSkip: () => void
  onGoToAvailability?: () => void
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

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const LOCATION_OPTIONS = ['Church', 'Rotating (Parent Home)', 'TBD', 'Other']

// ─── Session generation ────────────────────────────────────────────────────────

function buildSessionRows(
  cls: ClassDefinition,
  classId: string,
  createdBy: string,
  startDate: string,
  endDate: string,
) {
  if (cls.dayOfWeek === null || !startDate || !endDate) return []

  const rows = []
  const end = new Date(endDate + 'T12:00:00')
  let current = new Date(startDate + 'T12:00:00')

  // Advance to the first occurrence of the target day
  while (current.getDay() !== cls.dayOfWeek) {
    current.setDate(current.getDate() + 1)
  }

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    rows.push({
      class_id: classId,
      date: dateStr,
      start_time: cls.startTime || null,
      end_time: cls.endTime || null,
      location_name: cls.location !== 'TBD' && cls.location !== 'Other' ? cls.location : null,
      lesson_topic: 'TBD',
      status: 'scheduled',
      created_by: createdBy,
    })
    current.setDate(current.getDate() + 7)
  }

  return rows
}

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

export default function OnboardingScreen({ onComplete, onSkip, onGoToAvailability }: OnboardingScreenProps) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const { profile } = useAuth()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [grades, setGrades] = useState<GradeEntry[]>([{ id: 'g0', name: '' }])
  const [classes, setClasses] = useState<ClassDefinition[]>([])
  const [myClassIds, setMyClassIds] = useState<Set<string>>(new Set())

  // Set after save completes — used by step 4 (import students)
  const [savedGradeIds, setSavedGradeIds] = useState<{ id: string; name: string }[]>([])

  // Shared date range for all classes
  const [scheduleStartDate, setScheduleStartDate] = useState(new Date().toISOString().split('T')[0])
  const [scheduleEndDate, setScheduleEndDate] = useState('')

  // Date/time picker state
  const [activeDatePicker, setActiveDatePicker] = useState<'startDate' | 'endDate' | null>(null)
  const [activeTimePicker, setActiveTimePicker] = useState<{ classId: string; field: 'startTime' | 'endTime' } | null>(null)

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

  const DEFAULT_DAY_OF_WEEK: Record<string, number> = {
    'Sunday School': 0,
    'FNA': 5,
  }

  function makeClassDef(classTypeName: string, gradeIds: string[]): ClassDefinition {
    return {
      id: `c${Date.now()}`,
      name: classTypeName,
      classTypeName,
      gradeIds,
      dayOfWeek: DEFAULT_DAY_OF_WEEK[classTypeName] ?? null,
      startTime: '',
      endTime: '',
      location: 'TBD',
    }
  }

  function updateClassField<K extends keyof ClassDefinition>(classId: string, field: K, value: ClassDefinition[K]) {
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, [field]: value } : c))
  }

  // Single-grade: toggle the class type on/off for the only grade
  function toggleClassSingleGrade(classTypeName: string) {
    const gradeId = grades[0].id
    const existing = classes.find(c => c.classTypeName === classTypeName)
    if (existing) {
      setClasses(prev => prev.filter(c => c.id !== existing.id))
      setMyClassIds(prev => { const n = new Set(prev); n.delete(existing.id); return n })
    } else {
      setClasses(prev => [...prev, makeClassDef(classTypeName, [gradeId])])
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
      setClasses(prev => [...prev, makeClassDef(classTypeName, [gradeId])])
    }
  }

  function isGradeInClass(classTypeName: string, gradeId: string) {
    return classes.some(c => c.classTypeName === classTypeName && c.gradeIds.includes(gradeId))
  }

  function step2Valid() {
    return classes.length > 0
  }

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
          .insert({
            name: cls.name,
            class_type_id: classTypeId,
            created_by: profile.id,
            day_of_week: cls.dayOfWeek,
            start_time: cls.startTime || null,
            end_time: cls.endTime || null,
            default_location: cls.location !== 'TBD' ? cls.location : null,
          })
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

        // Bulk-insert sessions only for classes the servant personally teaches
        if (myClassIds.has(cls.id) && cls.dayOfWeek !== null && scheduleStartDate && scheduleEndDate) {
          const sessionRows = buildSessionRows(cls, classRow.id, profile.id, scheduleStartDate, scheduleEndDate)
          if (sessionRows.length > 0) {
            await supabase.from(TABLES.SESSIONS).insert(sessionRows)
          }
        }
      }

      // Advance to step 2 (confirmation) with the real grade IDs
      const savedGrades = grades.map(g => ({ id: gradeIdMap[g.id], name: g.name.trim() }))
      setSavedGradeIds(savedGrades)
      setStep(2)
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

  function formatDateDisplay(dateStr: string): string {
    if (!dateStr) return 'Select date'
    return format(new Date(dateStr + 'T12:00:00'), 'MMMM do, yyyy')
  }

  function formatTimeDisplay(time: string): string {
    if (!time) return 'Set time'
    const [h, m] = time.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return m === 0 ? `${hour} ${period}` : `${hour}:${m.toString().padStart(2, '0')} ${period}`
  }

  function renderStep2() {
    return (
      <>
        <Text style={styles.stepTitle}>What classes does your grade have?</Text>
        <Text style={styles.stepSubtitle}>
          Select all classes that exist for your grade(s). For the ones you personally teach, fill in the schedule so your dashboard is populated automatically.{'\n\n'}
          <Text style={styles.stepExample}>
            Combined classes (like FNA) will be merged when other servants set up their grades.
          </Text>
        </Text>

        {/* Shared date range */}
        <View style={styles.sharedDateSection}>
          <Text style={styles.scheduleFieldLabel}>Schedule Date Range (applies to all classes)</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.scheduleFieldLabel}>From</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setActiveDatePicker('startDate')}
              >
                <Text style={[styles.dateButtonText, !scheduleStartDate && { color: colors.textMuted }]}>
                  {formatDateDisplay(scheduleStartDate)}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.timeField}>
              <Text style={styles.scheduleFieldLabel}>To</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setActiveDatePicker('endDate')}
              >
                <Text style={[styles.dateButtonText, !scheduleEndDate && { color: colors.textMuted }]}>
                  {formatDateDisplay(scheduleEndDate)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {CLASS_TYPE_OPTIONS.map(classTypeName => {
          const cls = classes.find(c => c.classTypeName === classTypeName)
          const toggled = !!cls
          const isMyClass = toggled && cls && myClassIds.has(cls.id)

          return (
            <View key={classTypeName} style={styles.classTypeSection}>
              {/* Row 1: Does your grade have this class? */}
              <View style={styles.classTypeToggleRow}>
                <Text style={styles.classTypeLabel}>{classTypeName}</Text>
                {isMultiGrade ? (
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
                  <TouchableOpacity
                    style={[styles.chip, toggled && styles.chipSelected]}
                    onPress={() => toggleClassSingleGrade(classTypeName)}
                  >
                    <Text style={[styles.chipText, toggled && styles.chipTextSelected]}>
                      {toggled ? 'Yes' : 'No'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Row 2: Do you personally teach it? (only shown when toggled on) */}
              {toggled && cls && (
                <View style={styles.teachToggleRow}>
                  <Text style={styles.teachToggleLabel}>Do you personally teach this?</Text>
                  <View style={styles.gradeChips}>
                    {['Yes', 'No'].map(opt => {
                      const selected = opt === 'Yes' ? myClassIds.has(cls.id) : !myClassIds.has(cls.id)
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.chip, selected && styles.chipSelected]}
                          onPress={() => {
                            if (opt === 'Yes' && !myClassIds.has(cls.id)) toggleMyClass(cls.id)
                            if (opt === 'No' && myClassIds.has(cls.id)) toggleMyClass(cls.id)
                          }}
                        >
                          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{opt}</Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>
              )}

              {/* Schedule card — only when toggled on AND servant teaches it */}
              {isMyClass && cls && (
                <View style={styles.scheduleCard}>
                  {/* Day of week */}
                  <Text style={styles.scheduleFieldLabel}>Day of Week</Text>
                  <View style={styles.dayChips}>
                    {DAYS_OF_WEEK.map((day, i) => (
                      <TouchableOpacity
                        key={day}
                        style={[styles.dayChip, cls.dayOfWeek === i && styles.chipSelected]}
                        onPress={() => updateClassField(cls.id, 'dayOfWeek', i)}
                      >
                        <Text style={[styles.dayChipText, cls.dayOfWeek === i && styles.chipTextSelected]}>
                          {day.slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Start / End time */}
                  <View style={styles.timeRow}>
                    <View style={styles.timeField}>
                      <Text style={styles.scheduleFieldLabel}>Start Time</Text>
                      <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setActiveTimePicker({ classId: cls.id, field: 'startTime' })}
                      >
                        <Text style={[styles.dateButtonText, !cls.startTime && { color: colors.textMuted }]}>
                          {formatTimeDisplay(cls.startTime)}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.timeField}>
                      <Text style={styles.scheduleFieldLabel}>End Time</Text>
                      <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setActiveTimePicker({ classId: cls.id, field: 'endTime' })}
                      >
                        <Text style={[styles.dateButtonText, !cls.endTime && { color: colors.textMuted }]}>
                          {formatTimeDisplay(cls.endTime)}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Location */}
                  <Text style={styles.scheduleFieldLabel}>Default Location</Text>
                  <View style={styles.locationChips}>
                    {LOCATION_OPTIONS.map(loc => (
                      <TouchableOpacity
                        key={loc}
                        style={[styles.chip, cls.location === loc && styles.chipSelected]}
                        onPress={() => updateClassField(cls.id, 'location', loc)}
                      >
                        <Text style={[styles.chipText, cls.location === loc && styles.chipTextSelected]}>
                          {loc}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

            </View>
          )
        })}

        {/* Date picker modal */}
        {activeDatePicker && (
          <Modal visible transparent animationType="fade" onRequestClose={() => setActiveDatePicker(null)}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
              activeOpacity={1}
              onPress={() => setActiveDatePicker(null)}
            >
              <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 40 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>
                    {activeDatePicker === 'startDate' ? 'Start Date' : 'End Date'}
                  </Text>
                  <TouchableOpacity onPress={() => setActiveDatePicker(null)}>
                    <Text style={{ fontSize: 16, color: colors.primary, fontWeight: '600' }}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={(() => {
                    const val = activeDatePicker === 'startDate' ? scheduleStartDate : scheduleEndDate
                    return val ? new Date(val + 'T12:00:00') : new Date()
                  })()}
                  mode="date"
                  display="spinner"
                  onChange={(_, selected) => {
                    if (selected) {
                      const str = selected.toISOString().split('T')[0]
                      if (activeDatePicker === 'startDate') setScheduleStartDate(str)
                      else setScheduleEndDate(str)
                    }
                  }}
                  textColor={colors.textPrimary}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {/* Time picker modal */}
        {activeTimePicker && (() => {
          const cls = classes.find(c => c.id === activeTimePicker.classId)
          if (!cls) return null
          const currentVal = cls[activeTimePicker.field]
          const date = currentVal
            ? (() => { const d = new Date(); const [h, m] = currentVal.split(':').map(Number); d.setHours(h, m, 0, 0); return d })()
            : new Date()
          return (
            <Modal visible transparent animationType="fade" onRequestClose={() => setActiveTimePicker(null)}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
                activeOpacity={1}
                onPress={() => setActiveTimePicker(null)}
              >
                <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 40 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>
                      {activeTimePicker.field === 'startTime' ? 'Start Time' : 'End Time'}
                    </Text>
                    <TouchableOpacity onPress={() => setActiveTimePicker(null)}>
                      <Text style={{ fontSize: 16, color: colors.primary, fontWeight: '600' }}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={date}
                    mode="time"
                    display="spinner"
                    onChange={(_, selected) => {
                      if (selected) {
                        const h = selected.getHours().toString().padStart(2, '0')
                        const m = selected.getMinutes().toString().padStart(2, '0')
                        updateClassField(activeTimePicker.classId, activeTimePicker.field, `${h}:${m}`)
                      }
                    }}
                    textColor={colors.textPrimary}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          )
        })()}
      </>
    )
  }


  // ── Step 2 (post-save): Confirmation ─────────────────────────────────────────

  function renderConfirmation() {
    const sessionCount = classes
      .filter(c => myClassIds.has(c.id) && c.dayOfWeek !== null && scheduleStartDate && scheduleEndDate)
      .reduce((total, cls) => total + buildSessionRows(cls, '', '', scheduleStartDate, scheduleEndDate).length, 0)

    return (
      <View style={styles.confirmationContainer}>
        <Text style={styles.confirmationIcon}>🎉</Text>
        <Text style={styles.confirmationTitle}>You're all set!</Text>
        <Text style={styles.confirmationText}>
          Your grades and classes have been created.
          {sessionCount > 0 ? ` ${sessionCount} sessions have been automatically scheduled on your dashboard.` : ''}
        </Text>

        <TouchableOpacity style={styles.confirmationPrimaryButton} onPress={() => setStep(3)}>
          <Text style={styles.confirmationPrimaryButtonText}>Assign Kids →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.confirmationSecondaryButton} onPress={() => setStep(4)}>
          <Text style={styles.confirmationSecondaryButtonText}>Skip to Add Students</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.confirmationSecondaryButton} onPress={onComplete}>
          <Text style={styles.confirmationSecondaryButtonText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // ── Step 4: Import students ──────────────────────────────────────────────────

  // ── Step 3: Assign Kids ──────────────────────────────────────────────────────

  interface OnboardingStudent {
    id: string
    first_name: string | null
    last_name: string | null
    gender: string | null
    grade_id: string | null
  }

  interface OnboardingServant {
    id: string
    full_name: string
    gender: string | null
  }

  const [outreachStudents, setOutreachStudents] = useState<OnboardingStudent[]>([])
  const [outreachServants, setOutreachServants] = useState<OnboardingServant[]>([])
  const [outreachAssignments, setOutreachAssignments] = useState<{ studentId: string; servantId: string }[]>([])
  const [outreachGender, setOutreachGender] = useState<'male' | 'female'>('male')
  const [loadingOutreach, setLoadingOutreach] = useState(false)

  useEffect(() => {
    if (step === 3 && savedGradeIds.length > 0) {
      fetchOutreachData()
    }
  }, [step])

  async function fetchOutreachData() {
    if (!profile) return
    setLoadingOutreach(true)
    try {
      const gradeIds = savedGradeIds.map(g => g.id)

      const { data: studentRows } = await supabase
        .from(TABLES.STUDENTS)
        .select('id, first_name, last_name, gender, grade_id')
        .in('grade_id', gradeIds)

      type SgWithProfile = {
        servant_id: string | null
        profiles: { id: string; full_name: string | null; gender: string | null } | null
      }

      const { data: sgRows } = await supabase
        .from(TABLES.SERVANT_GRADES)
        .select('servant_id, profiles!servant_id(id, full_name, gender)')
        .in('grade_id', gradeIds)

      setOutreachStudents(studentRows ?? [])

      const typedSgRows = (sgRows ?? []) as SgWithProfile[]
      const servantMap = new Map<string, OnboardingServant>()
      for (const r of typedSgRows) {
        const p = r.profiles
        if (p?.id && !servantMap.has(p.id)) {
          servantMap.set(p.id, { id: p.id, full_name: p.full_name ?? '', gender: p.gender ?? null })
        }
      }
      setOutreachServants(Array.from(servantMap.values()))
    } catch {
      // non-fatal — servant can skip
    } finally {
      setLoadingOutreach(false)
    }
  }

  function getAssignedServantId(studentId: string): string | undefined {
    return outreachAssignments.find(a => a.studentId === studentId)?.servantId
  }

  function assignStudentInOnboarding(studentId: string, servantId: string) {
    setOutreachAssignments(prev => {
      const filtered = prev.filter(a => a.studentId !== studentId)
      return servantId ? [...filtered, { studentId, servantId }] : filtered
    })
  }

  function autoAssignOnboarding() {
    const genderStudents = outreachStudents.filter(s => s.gender === outreachGender)
    const genderServants = outreachServants.filter(sv => sv.gender === outreachGender)
    if (!genderStudents.length || !genderServants.length) return

    const unassigned = genderStudents.filter(s => !getAssignedServantId(s.id))
    if (!unassigned.length) return

    const counts = new Map(genderServants.map(sv => [sv.id, outreachAssignments.filter(a => a.servantId === sv.id).length]))
    const sorted = [...genderServants].sort((a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0))

    const newAssigns = unassigned.map((student, i) => ({
      studentId: student.id,
      servantId: sorted[i % sorted.length].id,
    }))
    setOutreachAssignments(prev => [...prev, ...newAssigns])
  }

  async function handleFinishAssignKids() {
    if (outreachAssignments.length === 0) {
      setStep(4)
      return
    }

    setSaving(true)
    try {
      const rows = outreachAssignments.map(a => ({
        student_id: a.studentId,
        servant_id: a.servantId,
        status: 'active',
      }))
      const { error } = await supabase.from(TABLES.OUTREACH_ASSIGNMENTS).insert(rows)
      if (error) throw error
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save assignments.')
    } finally {
      setSaving(false)
    }
    setStep(4)
  }

  function renderAssignKids() {
    const filteredStudents = outreachStudents.filter(s => s.gender === outreachGender)
    const filteredServants = outreachServants.filter(sv => sv.gender === outreachGender)

    return (
      <>
        <Text style={styles.stepTitle}>Assign Kids</Text>
        <Text style={styles.stepSubtitle}>
          Assign each kid to a servant for 1:1 outreach. You can auto-assign to distribute evenly.
        </Text>

        {/* Gender toggle */}
        <View style={{ flexDirection: 'row', marginBottom: 16, backgroundColor: colors.border, borderRadius: 10, padding: 2 }}>
          {(['male', 'female'] as const).map(g => (
            <TouchableOpacity
              key={g}
              style={{
                flex: 1,
                paddingVertical: 8,
                alignItems: 'center',
                borderRadius: 8,
                backgroundColor: outreachGender === g ? colors.card : 'transparent',
              }}
              onPress={() => setOutreachGender(g)}
            >
              <Text style={{ fontSize: 15, color: outreachGender === g ? colors.textPrimary : colors.textSecondary, fontWeight: outreachGender === g ? '600' : '400' }}>
                {g === 'male' ? 'Boys' : 'Girls'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Auto-assign button */}
        <TouchableOpacity
          style={{ backgroundColor: colors.primary, borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 16 }}
          onPress={autoAssignOnboarding}
        >
          <Text style={{ color: colors.primaryText, fontWeight: '600', fontSize: 15 }}>Auto-Assign</Text>
        </TouchableOpacity>

        {loadingOutreach ? (
          <ActivityIndicator color={colors.primary} />
        ) : filteredStudents.length === 0 ? (
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 20 }}>No {outreachGender === 'male' ? 'boys' : 'girls'} in your grades yet.</Text>
        ) : (
          filteredStudents.map(student => {
            const assignedId = getAssignedServantId(student.id)
            const assignedName = filteredServants.find(sv => sv.id === assignedId)?.full_name ?? 'Unassigned'
            return (
              <View key={student.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.borderLight }}>
                <Text style={{ fontSize: 15, color: colors.textPrimary }}>
                  {[student.first_name, student.last_name].filter(Boolean).join(' ')}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const options = filteredServants.map(sv => ({
                      text: sv.full_name,
                      onPress: () => assignStudentInOnboarding(student.id, sv.id),
                    }))
                    Alert.alert(`Assign ${student.first_name ?? 'Student'}`, 'Choose a servant:', [
                      ...options,
                      { text: 'Unassign', onPress: () => assignStudentInOnboarding(student.id, '') },
                      { text: 'Cancel', style: 'cancel' as const },
                    ])
                  }}
                >
                  <Text style={{ fontSize: 13, color: assignedId ? colors.primary : colors.textMuted, fontWeight: '500' }}>
                    {assignedName} ›
                  </Text>
                </TouchableOpacity>
              </View>
            )
          })
        )}
      </>
    )
  }

  // Step 4 is rendered as a full-screen overlay using ImportStudentsScreen
  // We pick the first saved grade to import into (most common case: single grade)
  const [importGradeIndex, setImportGradeIndex] = useState(0)

  function renderStep4() {
    const gradeForImport = savedGradeIds[importGradeIndex]
    if (!gradeForImport) return null

    return (
      <View style={{ flex: 1, marginHorizontal: -24, marginTop: -24 }}>
        {savedGradeIds.length > 1 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16, paddingBottom: 0 }}>
            {savedGradeIds.map((g, i) => (
              <TouchableOpacity
                key={g.id}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: i === importGradeIndex ? colors.primary : colors.border,
                  backgroundColor: i === importGradeIndex ? colors.primary : colors.inputBackground,
                }}
                onPress={() => setImportGradeIndex(i)}
              >
                <Text style={{ fontSize: 14, color: i === importGradeIndex ? colors.primaryText : colors.textSecondary }}>
                  {g.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <ImportStudentsScreen
          gradeId={gradeForImport.id}
          gradeName={gradeForImport.name}
          onBack={onComplete}
          onImportComplete={onComplete}
        />
      </View>
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

  // Step 1 is the last wizard step — "Save" triggers save
  const isLastWizardStep = step === 1

  // Steps 0-1 = wizard, 2 = confirmation, 3 = assign kids, 4 = import students
  const stepContent = [renderStep1, renderStep2, renderConfirmation, renderAssignKids, renderStep4]
  const showStepIndicator = step <= 1
  const showFooter = step <= 1 || step === 3
  // Skip only shown on optional steps (3 = assign kids, 4 = import)
  const showSkip = step === 3 || step === 4

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Set Up Your Ministry</Text>
          {showSkip ? (
            <TouchableOpacity onPress={step === 3 ? () => setStep(4) : onComplete}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {showStepIndicator && <StepIndicator current={step} total={2} />}
          {stepContent[step]()}
        </ScrollView>

        {showFooter && (
          <View style={styles.footer}>
            {step > 0 && step !== 3 && (
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(s => s - 1)} disabled={saving}>
                <Text style={styles.backButtonText}>‹ Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.nextButton, saving && { opacity: 0.6 }]}
              onPress={
                step === 3
                  ? handleFinishAssignKids
                  : isLastWizardStep
                    ? handleFinish
                    : handleNext
              }
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color={colors.primaryText} />
                : <Text style={styles.nextButtonText}>
                    {step === 3 ? 'Save Assignments →' : isLastWizardStep ? 'Save & Continue →' : 'Next →'}
                  </Text>
              }
            </TouchableOpacity>
          </View>
        )}
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
    marginBottom: 20,
  },
  classTypeToggleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  classTypeLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  teachToggleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  teachToggleLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  gradeChips: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  sharedDateSection: {
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 20,
    gap: 8,
  },
  scheduleCard: {
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
    marginTop: 4,
  },
  scheduleSkipHint: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic' as const,
    marginTop: 2,
    marginBottom: 4,
  },
  scheduleFieldLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  dayChips: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  dayChipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  timeRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  timeField: {
    flex: 1,
  },
  timeInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: colors.textPrimary,
  },
  locationChips: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  dateButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
  },
  dateButtonText: {
    fontSize: 15,
    color: colors.textPrimary,
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

  // Confirmation step
  confirmationContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 32,
    paddingVertical: 40,
    gap: 16,
  },
  confirmationIcon: {
    fontSize: 72,
    marginBottom: 8,
  },
  confirmationTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    textAlign: 'center' as const,
  },
  confirmationText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 8,
  },
  confirmationPrimaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 16,
    alignItems: 'center' as const,
    width: '100%' as const,
  },
  confirmationPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.primaryText,
  },
  confirmationSecondaryButton: {
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
    alignItems: 'center' as const,
    width: '100%' as const,
  },
  confirmationSecondaryButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600' as const,
  },
})
