export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string | null
          date: string
          grade_id: string | null
          id: string
          notes: string | null
          present: boolean
          recorded_by: string | null
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string
          grade_id?: string | null
          id?: string
          notes?: string | null
          present: boolean
          recorded_by?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          grade_id?: string | null
          id?: string
          notes?: string | null
          present?: boolean
          recorded_by?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      church_invitations: {
        Row: {
          church_id: string | null
          code: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          max_uses: number | null
          use_count: number | null
        }
        Insert: {
          church_id?: string | null
          code: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          use_count?: number | null
        }
        Update: {
          church_id?: string | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          use_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "church_invitations_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      churches: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          state: string | null
          status: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          state?: string | null
          status?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          state?: string | null
          status?: string | null
        }
        Relationships: []
      }
      class_grades: {
        Row: {
          class_id: string | null
          grade_id: string | null
          id: string
        }
        Insert: {
          class_id?: string | null
          grade_id?: string | null
          id?: string
        }
        Update: {
          class_id?: string | null
          grade_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_grades_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_grades_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
        ]
      }
      class_servants: {
        Row: {
          class_id: string | null
          id: string
          servant_id: string | null
        }
        Insert: {
          class_id?: string | null
          id?: string
          servant_id?: string | null
        }
        Update: {
          class_id?: string | null
          id?: string
          servant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_servants_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_servants_servant_id_fkey"
            columns: ["servant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_types: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          church_id: string | null
          class_type_id: string | null
          created_at: string | null
          created_by: string | null
          day_of_week: number | null
          default_location: string | null
          end_time: string | null
          id: string
          name: string
          start_time: string | null
        }
        Insert: {
          church_id?: string | null
          class_type_id?: string | null
          created_at?: string | null
          created_by?: string | null
          day_of_week?: number | null
          default_location?: string | null
          end_time?: string | null
          id?: string
          name: string
          start_time?: string | null
        }
        Update: {
          church_id?: string | null
          class_type_id?: string | null
          created_at?: string | null
          created_by?: string | null
          day_of_week?: number | null
          default_location?: string | null
          end_time?: string | null
          id?: string
          name?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_class_type_id_fkey"
            columns: ["class_type_id"]
            isOneToOne: false
            referencedRelation: "class_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          church_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          church_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          church_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_assignments: {
        Row: {
          created_at: string | null
          id: string
          servant_id: string | null
          student_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          servant_id?: string | null
          student_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          servant_id?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_assignments_servant_id_fkey"
            columns: ["servant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_visits: {
        Row: {
          assignment_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          servant_id: string | null
          student_id: string | null
          type: string | null
          visited_at: string | null
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          servant_id?: string | null
          student_id?: string | null
          type?: string | null
          visited_at?: string | null
        }
        Update: {
          assignment_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          servant_id?: string | null
          student_id?: string | null
          type?: string | null
          visited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_visits_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "outreach_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_visits_servant_id_fkey"
            columns: ["servant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_visits_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          church_id: string | null
          created_at: string | null
          full_name: string
          gender: string | null
          id: string
          phone: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          church_id?: string | null
          created_at?: string | null
          full_name: string
          gender?: string | null
          id: string
          phone?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          church_id?: string | null
          created_at?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      servant_availability: {
        Row: {
          available: boolean
          created_at: string | null
          date: string
          id: string
          notes: string | null
          servant_id: string | null
        }
        Insert: {
          available?: boolean
          created_at?: string | null
          date: string
          id?: string
          notes?: string | null
          servant_id?: string | null
        }
        Update: {
          available?: boolean
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          servant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "servant_availability_servant_id_fkey"
            columns: ["servant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      servant_grades: {
        Row: {
          assigned_by: string | null
          created_at: string | null
          grade_id: string | null
          id: string
          servant_id: string | null
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string | null
          grade_id?: string | null
          id?: string
          servant_id?: string | null
        }
        Update: {
          assigned_by?: string | null
          created_at?: string | null
          grade_id?: string | null
          id?: string
          servant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "servant_grades_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servant_grades_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servant_grades_servant_id_fkey"
            columns: ["servant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          class_admin_id: string | null
          class_id: string | null
          created_at: string | null
          date: string
          end_time: string | null
          id: string
          lesson_giver_id: string | null
          lesson_page: string | null
          lesson_topic: string | null
          location: string | null
          notes: string | null
          start_time: string | null
        }
        Insert: {
          class_admin_id?: string | null
          class_id?: string | null
          created_at?: string | null
          date: string
          end_time?: string | null
          id?: string
          lesson_giver_id?: string | null
          lesson_page?: string | null
          lesson_topic?: string | null
          location?: string | null
          notes?: string | null
          start_time?: string | null
        }
        Update: {
          class_admin_id?: string | null
          class_id?: string | null
          created_at?: string | null
          date?: string
          end_time?: string | null
          id?: string
          lesson_giver_id?: string | null
          lesson_page?: string | null
          lesson_topic?: string | null
          location?: string | null
          notes?: string | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_class_admin_id_fkey"
            columns: ["class_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_lesson_giver_id_fkey"
            columns: ["lesson_giver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          father_email: string | null
          father_phone: string | null
          first_name: string | null
          gender: string | null
          grade_id: string | null
          id: string
          last_name: string | null
          mother_email: string | null
          mother_phone: string | null
          notes: string | null
          state: string | null
          street: string | null
          student_phone: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          father_email?: string | null
          father_phone?: string | null
          first_name?: string | null
          gender?: string | null
          grade_id?: string | null
          id?: string
          last_name?: string | null
          mother_email?: string | null
          mother_phone?: string | null
          notes?: string | null
          state?: string | null
          street?: string | null
          student_phone?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          father_email?: string | null
          father_phone?: string | null
          first_name?: string | null
          gender?: string | null
          grade_id?: string | null
          id?: string
          last_name?: string | null
          mother_email?: string | null
          mother_phone?: string | null
          notes?: string | null
          state?: string | null
          street?: string | null
          student_phone?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// Helper types for easier use throughout the app
// NOTE: This section is manually maintained. After regenerating this file with
// `npx supabase gen types typescript`, re-add these aliases at the bottom.

// Row types
export type Church = Database['public']['Tables']['churches']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Grade = Database['public']['Tables']['grades']['Row']
export type Student = Database['public']['Tables']['students']['Row']
export type Attendance = Database['public']['Tables']['attendance']['Row']
export type ServantGrade = Database['public']['Tables']['servant_grades']['Row']
export type ChurchInvitation = Database['public']['Tables']['church_invitations']['Row']
export type ClassType = Database['public']['Tables']['class_types']['Row']
export type Class = Database['public']['Tables']['classes']['Row']
export type ClassGrade = Database['public']['Tables']['class_grades']['Row']
export type ClassServant = Database['public']['Tables']['class_servants']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type ServantAvailability = Database['public']['Tables']['servant_availability']['Row']
export type OutreachAssignment = Database['public']['Tables']['outreach_assignments']['Row']
export type OutreachVisit = Database['public']['Tables']['outreach_visits']['Row']

// Insert types
export type ChurchInsert = Database['public']['Tables']['churches']['Insert']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type GradeInsert = Database['public']['Tables']['grades']['Insert']
export type StudentInsert = Database['public']['Tables']['students']['Insert']
export type AttendanceInsert = Database['public']['Tables']['attendance']['Insert']
export type ServantGradeInsert = Database['public']['Tables']['servant_grades']['Insert']
export type ChurchInvitationInsert = Database['public']['Tables']['church_invitations']['Insert']
export type ClassInsert = Database['public']['Tables']['classes']['Insert']
export type ClassGradeInsert = Database['public']['Tables']['class_grades']['Insert']
export type ClassServantInsert = Database['public']['Tables']['class_servants']['Insert']
export type SessionInsert = Database['public']['Tables']['sessions']['Insert']
export type ServantAvailabilityInsert = Database['public']['Tables']['servant_availability']['Insert']
export type OutreachAssignmentInsert = Database['public']['Tables']['outreach_assignments']['Insert']
export type OutreachVisitInsert = Database['public']['Tables']['outreach_visits']['Insert']
