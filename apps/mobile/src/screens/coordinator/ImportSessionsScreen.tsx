import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { File } from 'expo-file-system'
import Papa from 'papaparse'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import { useSessions } from '../../hooks/useSessions'
import { useClasses } from '../../hooks/useClasses'
import { logger } from '../../lib/logger'
import {
  downloadCurriculumTemplate,
  csvRowToSessionUpdate,
  validateCurriculumRow,
  CURRICULUM_CSV_COLUMNS,
  CurriculumRowUpdate,
} from '../../utils/sessionCsvTemplate'

interface ImportSessionsScreenProps {
  classId: string
  className: string
  onBack: () => void
  onDone: () => void
}

type ImportState = 'idle' | 'parsing' | 'preview' | 'importing' | 'done'

interface MatchedRow {
  update: CurriculumRowUpdate & { lessonServantId?: string | null }
  date: string
}

interface UnmatchedRow {
  rawDate: string
  topic: string
}

export default function ImportSessionsScreen({
  classId,
  className,
  onBack,
  onDone,
}: ImportSessionsScreenProps) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const { sessions, loading: sessionsLoading, bulkUpdateSessions } = useSessions(classId)
  const { getServantsByClassId } = useClasses()
  const servants = getServantsByClassId(classId)

  const [importState, setImportState] = useState<ImportState>('idle')
  const [matched, setMatched] = useState<MatchedRow[]>([])
  const [unmatched, setUnmatched] = useState<UnmatchedRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [updatedCount, setUpdatedCount] = useState(0)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)

  async function handleDownloadTemplate() {
    setDownloadingTemplate(true)
    try {
      await downloadCurriculumTemplate()
    } catch (err: any) {
      logger.error('ImportSessionsScreen.downloadTemplate', err)
      Alert.alert('Could not download template', 'Please try again.')
    } finally {
      setDownloadingTemplate(false)
    }
  }

  async function handlePickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'public.comma-separated-values-text', '*/*'],
        copyToCacheDirectory: true,
      })

      if (result.canceled) return

      const asset = result.assets[0]
      setImportState('parsing')

      const file = new File(asset.uri)
      const content = await file.text()

      const parsed = Papa.parse<Record<string, string>>(content, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h: string) => h.trim().toLowerCase().replace(/\s+/g, '_'),
      })

      if (parsed.errors.length > 0 && parsed.data.length === 0) {
        Alert.alert('Parse Error', parsed.errors[0].message)
        setImportState('idle')
        return
      }

      const newMatched: MatchedRow[] = []
      const newUnmatched: UnmatchedRow[] = []
      const newErrors: string[] = []

      for (let i = 0; i < parsed.data.length; i++) {
        const row = parsed.data[i]
        const validationError = validateCurriculumRow(row, i)
        if (validationError) {
          newErrors.push(validationError)
          continue
        }

        const result = csvRowToSessionUpdate(row, sessions, servants)

        if (result === undefined) {
          // Holiday/break row — skip silently
          continue
        }

        if (result === null) {
          // No date match in sessions
          newUnmatched.push({
            rawDate: (row['date'] ?? '').trim(),
            topic: (row['lesson_topic'] ?? '').trim(),
          })
          continue
        }

        // Find the session to get its date for display
        const session = sessions.find(s => s.id === result.sessionId)
        newMatched.push({
          update: result,
          date: session?.date ?? '',
        })
      }

      if (newMatched.length === 0 && newUnmatched.length === 0 && newErrors.length === 0) {
        Alert.alert('Empty File', 'The CSV file has no recognizable data rows.')
        setImportState('idle')
        return
      }

      setMatched(newMatched)
      setUnmatched(newUnmatched)
      setErrors(newErrors)
      setImportState('preview')
    } catch (err: any) {
      logger.error('ImportSessionsScreen.pickFile', err)
      Alert.alert('Could not read file', 'Please try again.')
      setImportState('idle')
    }
  }

  async function handleImport() {
    if (matched.length === 0) return
    setImportState('importing')

    const updates = matched.map(m => ({
      id: m.update.sessionId,
      lessonTopic: m.update.lessonTopic,
      lessonPage: m.update.lessonPage,
      lessonServantName: m.update.lessonServantName,
      lessonServantId: m.update.lessonServantId ?? null,
      notes: m.update.notes,
    }))

    const { error } = await bulkUpdateSessions(updates)

    if (error) {
      logger.error('ImportSessionsScreen.import', error)
      Alert.alert('Import failed', error)
      setImportState('preview')
      return
    }

    setUpdatedCount(matched.length)
    setImportState('done')
  }

  function handleReset() {
    setMatched([])
    setUnmatched([])
    setErrors([])
    setUpdatedCount(0)
    setImportState('idle')
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T12:00:00')
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  function renderIdle() {
    return (
      <View style={styles.idleContent}>
        <Text style={styles.idleIcon}>📋</Text>
        <Text style={styles.idleTitle}>Import Curriculum CSV</Text>
        <Text style={styles.idleSubtitle}>
          Bulk-fill lesson topics, pages, and servant assignments for {className} by importing your curriculum spreadsheet.
        </Text>

        <TouchableOpacity
          style={styles.templateButton}
          onPress={handleDownloadTemplate}
          disabled={downloadingTemplate}
        >
          {downloadingTemplate
            ? <ActivityIndicator color={colors.primary} />
            : <Text style={styles.templateButtonText}>⬇ Download Template CSV</Text>
          }
        </TouchableOpacity>

        <Text style={styles.columnsLabel}>Expected columns:</Text>
        <Text style={styles.columnsText}>{CURRICULUM_CSV_COLUMNS.join(', ')}</Text>
        <Text style={styles.columnsHint}>Date format: YYYY-MM-DD (e.g. 2025-09-07)</Text>
      </View>
    )
  }

  function renderParsing() {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Parsing file…</Text>
      </View>
    )
  }

  function renderPreview() {
    return (
      <>
        {/* Summary badges */}
        <View style={styles.previewSummary}>
          <View style={[styles.summaryBadge, styles.summaryBadgeGreen]}>
            <Text style={styles.summaryBadgeCount}>{matched.length}</Text>
            <Text style={styles.summaryBadgeLabel}>Will Update</Text>
          </View>
          {unmatched.length > 0 && (
            <View style={[styles.summaryBadge, styles.summaryBadgeOrange]}>
              <Text style={[styles.summaryBadgeCount, styles.summaryBadgeCountOrange]}>{unmatched.length}</Text>
              <Text style={[styles.summaryBadgeLabel, styles.summaryBadgeLabelOrange]}>No Match</Text>
            </View>
          )}
          {errors.length > 0 && (
            <View style={[styles.summaryBadge, styles.summaryBadgeRed]}>
              <Text style={[styles.summaryBadgeCount, styles.summaryBadgeCountRed]}>{errors.length}</Text>
              <Text style={[styles.summaryBadgeLabel, styles.summaryBadgeLabelRed]}>Errors</Text>
            </View>
          )}
        </View>

        {errors.length > 0 && (
          <View style={styles.warningSection}>
            <Text style={styles.sectionTitle}>Rows with errors (skipped)</Text>
            {errors.map((e, i) => (
              <View key={i} style={styles.errorRow}>
                <Text style={styles.errorRowText}>{e}</Text>
              </View>
            ))}
          </View>
        )}

        {unmatched.length > 0 && (
          <View style={styles.warningSection}>
            <Text style={styles.sectionTitle}>Unmatched rows (no session on that date)</Text>
            {unmatched.map((u, i) => (
              <View key={i} style={styles.unmatchedRow}>
                <Text style={styles.unmatchedDate}>{u.rawDate}</Text>
                {u.topic ? <Text style={styles.unmatchedTopic} numberOfLines={1}>{u.topic}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {matched.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Sessions to update</Text>
            {matched.map((m, i) => (
              <View key={i} style={styles.previewRow}>
                <Text style={styles.previewDate}>{formatDate(m.date)}</Text>
                <Text style={styles.previewTopic} numberOfLines={2}>{m.update.lessonTopic || '(no topic)'}</Text>
                {m.update.lessonServantName ? (
                  <Text style={styles.previewServant}>{m.update.lessonServantName}</Text>
                ) : null}
                {m.update.lessonPage ? (
                  <Text style={styles.previewPage}>p. {m.update.lessonPage}</Text>
                ) : null}
              </View>
            ))}
          </>
        )}
      </>
    )
  }

  function renderImporting() {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Updating sessions…</Text>
      </View>
    )
  }

  function renderDone() {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.doneIcon}>✅</Text>
        <Text style={styles.doneTitle}>{updatedCount} session{updatedCount !== 1 ? 's' : ''} updated!</Text>
        <Text style={styles.doneSubtitle}>Curriculum has been imported for {className}.</Text>
        <TouchableOpacity style={styles.doneButton} onPress={onDone}>
          <Text style={styles.doneButtonText}>View Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.importMoreButton} onPress={handleReset}>
          <Text style={styles.importMoreButtonText}>Import Another File</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>‹ Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import Curriculum</Text>
        <Text style={styles.headerSubtitle}>{className}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {importState === 'idle' && renderIdle()}
        {importState === 'parsing' && renderParsing()}
        {importState === 'preview' && renderPreview()}
        {importState === 'importing' && renderImporting()}
        {importState === 'done' && renderDone()}
      </ScrollView>

      {importState === 'idle' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryButton, sessionsLoading && { opacity: 0.5 }]}
            onPress={handlePickFile}
            disabled={sessionsLoading}
          >
            {sessionsLoading
              ? <ActivityIndicator color={colors.primaryText} />
              : <Text style={styles.primaryButtonText}>Choose CSV File</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {importState === 'preview' && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
            <Text style={styles.secondaryButtonText}>Choose Different File</Text>
          </TouchableOpacity>
          {matched.length > 0 && (
            <TouchableOpacity style={styles.primaryButton} onPress={handleImport}>
              <Text style={styles.primaryButtonText}>
                Import {matched.length} Session{matched.length !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
  backText: {
    fontSize: 16,
    color: colors.primary,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  // Idle
  idleContent: {
    alignItems: 'center' as const,
    paddingTop: 24,
  },
  idleIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  idleTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  idleSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 28,
  },
  templateButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
    minWidth: 220,
    alignItems: 'center' as const,
  },
  templateButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  columnsLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 6,
    alignSelf: 'flex-start' as const,
  },
  columnsText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    alignSelf: 'flex-start' as const,
  },
  columnsHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
    alignSelf: 'flex-start' as const,
    fontStyle: 'italic' as const,
  },
  // Center (loading / done)
  centerContent: {
    alignItems: 'center' as const,
    paddingTop: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  doneIcon: {
    fontSize: 56,
  },
  doneTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  doneSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  doneButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  importMoreButton: {
    paddingVertical: 10,
  },
  importMoreButtonText: {
    color: colors.primary,
    fontSize: 14,
  },
  // Preview
  previewSummary: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 20,
  },
  summaryBadge: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center' as const,
  },
  summaryBadgeGreen: {
    backgroundColor: colors.alertSuccessBg,
  },
  summaryBadgeOrange: {
    backgroundColor: colors.alertOrangeBg,
  },
  summaryBadgeRed: {
    backgroundColor: colors.alertDangerBg,
  },
  summaryBadgeCount: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: colors.success,
  },
  summaryBadgeCountOrange: {
    color: colors.alertOrangeText,
  },
  summaryBadgeCountRed: {
    color: colors.error,
  },
  summaryBadgeLabel: {
    fontSize: 12,
    color: colors.success,
    marginTop: 2,
  },
  summaryBadgeLabelOrange: {
    color: colors.alertOrangeText,
  },
  summaryBadgeLabelRed: {
    color: colors.error,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  warningSection: {
    marginBottom: 20,
  },
  errorRow: {
    backgroundColor: colors.alertDangerBg,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  errorRowText: {
    fontSize: 13,
    color: colors.error,
  },
  unmatchedRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.alertOrangeBg,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    gap: 12,
  },
  unmatchedDate: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.alertOrangeText,
    minWidth: 60,
  },
  unmatchedTopic: {
    fontSize: 13,
    color: colors.alertOrangeText,
    flex: 1,
  },
  previewRow: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 12,
    marginBottom: 8,
  },
  previewDate: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  previewTopic: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.textPrimary,
  },
  previewServant: {
    fontSize: 13,
    color: colors.primary,
    marginTop: 4,
  },
  previewPage: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  // Footer
  footer: {
    backgroundColor: colors.card,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center' as const,
  },
  primaryButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center' as const,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500' as const,
  },
})
