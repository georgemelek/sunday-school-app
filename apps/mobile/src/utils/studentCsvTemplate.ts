import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import type { StudentFormData } from '../hooks/useStudents'

// Ordered columns matching StudentFormData — also shown as the header row
export const CSV_COLUMNS: (keyof StudentFormData)[] = [
  'first_name',
  'last_name',
  'date_of_birth',
  'gender',
  'student_phone',
  'mother_first_name',
  'mother_last_name',
  'mother_phone',
  'mother_email',
  'father_first_name',
  'father_last_name',
  'father_phone',
  'father_email',
  'street',
  'city',
  'state',
  'zip',
  'country',
  'notes',
]

const EXAMPLE_ROW = [
  'John',
  'Smith',
  '2010-05-15',
  'male',
  '',
  'Mary',
  'Smith',
  '555-0101',
  'mary@example.com',
  'David',
  'Smith',
  '555-0102',
  'david@example.com',
  '123 Main St',
  'Naperville',
  'IL',
  '60540',
  'USA',
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

export async function downloadCsvTemplate(): Promise<void> {
  const header = rowToCsv(CSV_COLUMNS)
  const example = rowToCsv(EXAMPLE_ROW)
  const content = [header, example].join('\n')

  const file = new File(Paths.cache, 'students_template.csv')
  file.write(content)

  const canShare = await Sharing.isAvailableAsync()
  if (!canShare) {
    throw new Error('Sharing is not available on this device.')
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Save Student Import Template',
    UTI: 'public.comma-separated-values-text',
  })
}

// Maps a raw parsed CSV row object to StudentFormData
export function csvRowToFormData(row: Record<string, string>): StudentFormData {
  function get(key: keyof StudentFormData): string {
    return (row[key] ?? '').trim()
  }
  return {
    first_name: get('first_name'),
    last_name: get('last_name'),
    date_of_birth: get('date_of_birth'),
    gender: get('gender'),
    student_phone: get('student_phone'),
    mother_first_name: get('mother_first_name'),
    mother_last_name: get('mother_last_name'),
    mother_phone: get('mother_phone'),
    mother_email: get('mother_email'),
    father_first_name: get('father_first_name'),
    father_last_name: get('father_last_name'),
    father_phone: get('father_phone'),
    father_email: get('father_email'),
    street: get('street'),
    city: get('city'),
    state: get('state'),
    zip: get('zip'),
    country: get('country') || 'USA',
    notes: get('notes'),
  }
}

// Basic validation — returns an error string or null
export function validateCsvRow(data: StudentFormData, rowIndex: number): string | null {
  if (!data.first_name && !data.last_name) {
    return `Row ${rowIndex + 1}: first_name or last_name is required`
  }
  if (data.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(data.date_of_birth)) {
    return `Row ${rowIndex + 1}: date_of_birth must be YYYY-MM-DD (got "${data.date_of_birth}")`
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (data.mother_email && !emailRegex.test(data.mother_email)) {
    return `Row ${rowIndex + 1}: invalid mother_email`
  }
  if (data.father_email && !emailRegex.test(data.father_email)) {
    return `Row ${rowIndex + 1}: invalid father_email`
  }
  return null
}
