/**
 * Database TypeScript Types
 *
 * These types will be auto-generated from your Supabase schema using:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
 *
 * For now, we're using manual types for development.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      churches: {
        Row: {
          id: string
          name: string
          city: string | null
          state: string | null
          country: string
          status: 'pending' | 'official'
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          city?: string | null
          state?: string | null
          country?: string
          status?: 'pending' | 'official'
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          city?: string | null
          state?: string | null
          country?: string
          status?: 'pending' | 'official'
          created_by?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          church_id: string | null
          full_name: string
          phone: string | null
          role: 'servant' | 'coordinator' | 'priest'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          church_id?: string | null
          full_name: string
          phone?: string | null
          role: 'servant' | 'coordinator' | 'priest'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          church_id?: string | null
          full_name?: string
          phone?: string | null
          role?: 'servant' | 'coordinator' | 'priest'
          created_at?: string
          updated_at?: string
        }
      }
      grades: {
        Row: {
          id: string
          church_id: string
          name: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          church_id: string
          name: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          church_id?: string
          name?: string
          created_by?: string
          created_at?: string
        }
      }
      servant_grades: {
        Row: {
          id: string
          servant_id: string
          grade_id: string
          assigned_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          servant_id: string
          grade_id: string
          assigned_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          servant_id?: string
          grade_id?: string
          assigned_by?: string | null
          created_at?: string
        }
      }
      students: {
        Row: {
          id: string
          grade_id: string
          name: string
          date_of_birth: string | null
          parent_name: string | null
          parent_phone: string | null
          parent_email: string | null
          address: string | null
          city: string | null
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          grade_id: string
          name: string
          date_of_birth?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_email?: string | null
          address?: string | null
          city?: string | null
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          grade_id?: string
          name?: string
          date_of_birth?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_email?: string | null
          address?: string | null
          city?: string | null
          notes?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          student_id: string
          grade_id: string
          date: string
          present: boolean
          notes: string | null
          recorded_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          grade_id: string
          date?: string
          present: boolean
          notes?: string | null
          recorded_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          grade_id?: string
          date?: string
          present?: boolean
          notes?: string | null
          recorded_by?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for easier use
export type Church = Database['public']['Tables']['churches']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Grade = Database['public']['Tables']['grades']['Row']
export type Student = Database['public']['Tables']['students']['Row']
export type Attendance = Database['public']['Tables']['attendance']['Row']
export type ServantGrade = Database['public']['Tables']['servant_grades']['Row']

export type ChurchInsert = Database['public']['Tables']['churches']['Insert']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type GradeInsert = Database['public']['Tables']['grades']['Insert']
export type StudentInsert = Database['public']['Tables']['students']['Insert']
export type AttendanceInsert = Database['public']['Tables']['attendance']['Insert']
export type ServantGradeInsert = Database['public']['Tables']['servant_grades']['Insert']
