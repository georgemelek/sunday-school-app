// Supabase table name constants — use these instead of raw strings to avoid typos

export const TABLES = {
  PROFILES: 'profiles',
  CHURCHES: 'churches',
  CHURCH_INVITATIONS: 'church_invitations',
  GRADES: 'grades',
  SERVANT_GRADES: 'servant_grades',
  STUDENTS: 'students',
  ATTENDANCE: 'attendance',
  CLASS_TYPES: 'class_types',
  CLASSES: 'classes',
  CLASS_GRADES: 'class_grades',
  CLASS_SERVANTS: 'class_servants',
  SESSIONS: 'sessions',
  SERVANT_AVAILABILITY: 'servant_availability',
  OUTREACH_ASSIGNMENTS: 'outreach_assignments',
  OUTREACH_VISITS: 'outreach_visits',
} as const
