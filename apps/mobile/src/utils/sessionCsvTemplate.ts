import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import type { Session } from '../hooks/useSessions'

// CSV columns for the curriculum import template
export const CURRICULUM_CSV_COLUMNS = [
  'date',
  'lesson_topic',
  'page',
  'scheduled_servant',
  'notes',
]

const EXAMPLE_ROW = [
  '2025-09-07',
  'Studying the Bible: What is the Bible',
  '8',
  'George Melek',
  '',
]

function escapeCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function rowToCsv(values: string[]): string {
  return values.map(escapeCell).join(',')
}

export async function downloadCurriculumTemplate(): Promise<void> {
  const header = rowToCsv(CURRICULUM_CSV_COLUMNS)
  const example = rowToCsv(EXAMPLE_ROW)
  const content = [header, example].join('\n')

  const file = new File(Paths.cache, 'curriculum_template.csv')
  file.write(content)

  const canShare = await Sharing.isAvailableAsync()
  if (!canShare) {
    throw new Error('Sharing is not available on this device.')
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Save Curriculum Import Template',
    UTI: 'public.comma-separated-values-text',
  })
}

export interface CurriculumRowUpdate {
  sessionId: string
  lessonTopic: string
  lessonPage: string
  lessonServantName: string
  notes: string
}

export interface Servant {
  id: string
  fullName: string
}

/**
 * Maps a CSV row to a session update, or returns null if no session date-match.
 * Returns undefined (skip silently) for blank-topic + blank-servant holiday rows,
 * and for sessions that are already completed or canceled.
 * Date must be in YYYY-MM-DD format.
 */
export function csvRowToSessionUpdate(
  row: Record<string, string>,
  sessions: Session[],
  servants: Servant[],
): CurriculumRowUpdate | null | undefined {
  const rawDate = (row['date'] ?? '').trim()
  const topic = (row['lesson_topic'] ?? '').trim()
  const page = (row['page'] ?? '').trim()
  const servantName = (row['scheduled_servant'] ?? '').trim()
  const notes = (row['notes'] ?? '').trim()

  // Holiday/break rows: both topic and servant blank — skip silently
  if (!topic && !servantName) return undefined

  // Date must be YYYY-MM-DD
  if (!rawDate.match(/^\d{4}-\d{2}-\d{2}$/)) return null

  const session = sessions.find(s => s.date === rawDate)
  if (!session) return null
  // Skip sessions that are already completed or canceled — don't overwrite history
  if (session.status === 'completed' || session.status === 'canceled') return undefined

  // Attempt case-insensitive name match to find a servant ID
  let resolvedServantId: string | null = null
  if (servantName) {
    const lower = servantName.toLowerCase()
    const match = servants.find(sv => sv.fullName.toLowerCase() === lower)
    if (match) resolvedServantId = match.id
  }

  return {
    sessionId: session.id,
    lessonTopic: topic,
    lessonPage: page,
    lessonServantName: servantName,
    notes,
    ...(resolvedServantId !== null && { lessonServantId: resolvedServantId }),
  } as CurriculumRowUpdate & { lessonServantId?: string }
}

/**
 * Returns an error string if the row is invalid, or null if valid.
 */
export function validateCurriculumRow(row: Record<string, string>, rowIndex: number): string | null {
  const rawDate = (row['date'] ?? '').trim()
  if (!rawDate) {
    return `Row ${rowIndex + 1}: date is missing`
  }
  if (!rawDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return `Row ${rowIndex + 1}: date "${rawDate}" must be in YYYY-MM-DD format (e.g. 2025-09-07)`
  }
  return null
}
