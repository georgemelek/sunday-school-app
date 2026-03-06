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
import { useStudents, studentDisplayName, StudentFormData } from '../../hooks/useStudents'
import {
  downloadCsvTemplate,
  csvRowToFormData,
  validateCsvRow,
  CSV_COLUMNS,
} from '../../utils/studentCsvTemplate'

interface ImportStudentsScreenProps {
  gradeId: string
  gradeName: string
  onBack: () => void
  onImportComplete: () => void
}

type ImportRow = {
  data: StudentFormData
  error: string | null
}

type ImportState = 'idle' | 'parsing' | 'preview' | 'importing' | 'done'

export default function ImportStudentsScreen({
  gradeId,
  gradeName,
  onBack,
  onImportComplete,
}: ImportStudentsScreenProps) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const { addStudent } = useStudents(gradeId)

  const [importState, setImportState] = useState<ImportState>('idle')
  const [rows, setRows] = useState<ImportRow[]>([])
  const [importedCount, setImportedCount] = useState(0)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)

  const validRows = rows.filter(r => r.error === null)
  const errorRows = rows.filter(r => r.error !== null)

  async function handleDownloadTemplate() {
    setDownloadingTemplate(true)
    try {
      await downloadCsvTemplate()
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not share template.')
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

      const importRows: ImportRow[] = parsed.data.map((rawRow, i) => {
        const data = csvRowToFormData(rawRow)
        const error = validateCsvRow(data, i)
        return { data, error }
      })

      if (importRows.length === 0) {
        Alert.alert('Empty File', 'The CSV file has no data rows.')
        setImportState('idle')
        return
      }

      setRows(importRows)
      setImportState('preview')
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to read file.')
      setImportState('idle')
    }
  }

  async function handleImport() {
    if (validRows.length === 0) return

    setImportState('importing')
    let count = 0
    const failures: string[] = []

    for (const row of validRows) {
      const { error } = await addStudent(row.data)
      if (error) {
        failures.push(`${studentDisplayName(row.data)}: ${error}`)
      } else {
        count++
      }
    }

    setImportedCount(count)
    setImportState('done')

    if (failures.length > 0) {
      Alert.alert(
        'Some rows failed',
        failures.slice(0, 5).join('\n') + (failures.length > 5 ? `\n…and ${failures.length - 5} more` : '')
      )
    }
  }

  function handleReset() {
    setRows([])
    setImportedCount(0)
    setImportState('idle')
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  function renderIdle() {
    return (
      <View style={styles.idleContent}>
        <Text style={styles.idleIcon}>📂</Text>
        <Text style={styles.idleTitle}>Import Students from CSV</Text>
        <Text style={styles.idleSubtitle}>
          Download the template, fill it in, then upload it to bulk-add students to {gradeName}.
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

        <Text style={styles.columnsLabel}>Template columns:</Text>
        <Text style={styles.columnsText}>{CSV_COLUMNS.join(', ')}</Text>
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
        <View style={styles.previewSummary}>
          <View style={[styles.summaryBadge, styles.summaryBadgeGreen]}>
            <Text style={styles.summaryBadgeCount}>{validRows.length}</Text>
            <Text style={styles.summaryBadgeLabel}>Ready</Text>
          </View>
          {errorRows.length > 0 && (
            <View style={[styles.summaryBadge, styles.summaryBadgeRed]}>
              <Text style={[styles.summaryBadgeCount, styles.summaryBadgeCountRed]}>{errorRows.length}</Text>
              <Text style={[styles.summaryBadgeLabel, styles.summaryBadgeLabelRed]}>Errors</Text>
            </View>
          )}
        </View>

        {errorRows.length > 0 && (
          <View style={styles.errorSection}>
            <Text style={styles.sectionTitle}>Rows with errors (will be skipped)</Text>
            {errorRows.map((row, i) => (
              <View key={i} style={styles.errorRow}>
                <Text style={styles.errorRowText}>{row.error}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Students to import</Text>
        {validRows.map((row, i) => (
          <View key={i} style={styles.previewRow}>
            <View style={styles.previewAvatar}>
              <Text style={styles.previewAvatarText}>
                {(row.data.first_name || row.data.last_name || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.previewInfo}>
              <Text style={styles.previewName}>{studentDisplayName(row.data)}</Text>
              {row.data.date_of_birth ? (
                <Text style={styles.previewDetail}>DOB: {row.data.date_of_birth}</Text>
              ) : null}
              {(row.data.mother_phone || row.data.father_phone) ? (
                <Text style={styles.previewDetail}>
                  Phone: {row.data.mother_phone || row.data.father_phone}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </>
    )
  }

  function renderImporting() {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Importing students…</Text>
      </View>
    )
  }

  function renderDone() {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.doneIcon}>✅</Text>
        <Text style={styles.doneTitle}>{importedCount} student{importedCount !== 1 ? 's' : ''} imported!</Text>
        <Text style={styles.doneSubtitle}>They've been added to {gradeName}.</Text>
        <TouchableOpacity style={styles.doneButton} onPress={onImportComplete}>
          <Text style={styles.doneButtonText}>View Students</Text>
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
        <Text style={styles.headerTitle}>Import Students</Text>
        <Text style={styles.headerSubtitle}>{gradeName}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {importState === 'idle' && renderIdle()}
        {importState === 'parsing' && renderParsing()}
        {importState === 'preview' && renderPreview()}
        {importState === 'importing' && renderImporting()}
        {importState === 'done' && renderDone()}
      </ScrollView>

      {/* Footer actions */}
      {importState === 'idle' && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handlePickFile}>
            <Text style={styles.primaryButtonText}>Choose CSV File</Text>
          </TouchableOpacity>
        </View>
      )}

      {importState === 'preview' && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
            <Text style={styles.secondaryButtonText}>Choose Different File</Text>
          </TouchableOpacity>
          {validRows.length > 0 && (
            <TouchableOpacity style={styles.primaryButton} onPress={handleImport}>
              <Text style={styles.primaryButtonText}>
                Import {validRows.length} Student{validRows.length !== 1 ? 's' : ''}
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
    marginBottom: 28,
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
    gap: 12,
    marginBottom: 20,
  },
  summaryBadge: {
    flex: 1,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center' as const,
    backgroundColor: colors.alertSuccessBg,
  },
  summaryBadgeGreen: {
    backgroundColor: colors.alertSuccessBg,
  },
  summaryBadgeRed: {
    backgroundColor: colors.alertDangerBg,
  },
  summaryBadgeCount: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.success,
  },
  summaryBadgeCountRed: {
    color: colors.error,
  },
  summaryBadgeLabel: {
    fontSize: 13,
    color: colors.success,
    marginTop: 2,
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
  errorSection: {
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
  previewRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 12,
    marginBottom: 8,
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  previewAvatarText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  previewDetail: {
    fontSize: 13,
    color: colors.textSecondary,
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
