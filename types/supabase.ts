export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      event_organizers: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          organization: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          organization?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          organization?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          description: string | null
          email_sent: boolean | null
          end_date: string
          event_category: string
          id: number
          location: string
          location_type: string
          max_volunteers: number | null
          registration_deadline: string | null
          start_date: string
          status: string
          thumbnail_image: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          email_sent?: boolean | null
          end_date: string
          event_category: string
          id?: number
          location: string
          location_type: string
          max_volunteers?: number | null
          registration_deadline?: string | null
          start_date: string
          status?: string
          thumbnail_image?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          email_sent?: boolean | null
          end_date?: string
          event_category?: string
          id?: number
          location?: string
          location_type?: string
          max_volunteers?: number | null
          registration_deadline?: string | null
          start_date?: string
          status?: string
          thumbnail_image?: string | null
          title?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          skill: string
          skill_icon: string | null
          skill_id: number
        }
        Insert: {
          skill: string
          skill_icon?: string | null
          skill_id?: number
        }
        Update: {
          skill?: string
          skill_icon?: string | null
          skill_id?: number
        }
        Relationships: []
      }
      task_skills: {
        Row: {
          skill_id: number
          task_id: number
        }
        Insert: {
          skill_id: number
          task_id: number
        }
        Update: {
          skill_id?: number
          task_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["skill_id"]
          },
          {
            foreignKeyName: "task_skills_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["task_id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string | null
          event_id: number | null
          task_description: string
          task_feedback: string | null
          task_id: number
          task_status: string
          updated_at: string | null
          volunteer_email: string | null
          volunteer_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: number | null
          task_description: string
          task_feedback?: string | null
          task_id?: number
          task_status?: string
          updated_at?: string | null
          volunteer_email?: string | null
          volunteer_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: number | null
          task_description?: string
          task_feedback?: string | null
          task_id?: number
          task_status?: string
          updated_at?: string | null
          volunteer_email?: string | null
          volunteer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_event: {
        Row: {
          created_at: string | null
          event_id: number | null
          feedback: string | null
          feedback_submitted_at: string | null
          id: number
          star_rating: number | null
          status: string
          volunteer_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: number | null
          feedback?: string | null
          feedback_submitted_at?: string | null
          id?: number
          star_rating?: number | null
          status?: string
          volunteer_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: number | null
          feedback?: string | null
          feedback_submitted_at?: string | null
          id?: number
          star_rating?: number | null
          status?: string
          volunteer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_event_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_event_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_skills: {
        Row: {
          skill_id: number
          volunteer_id: string
        }
        Insert: {
          skill_id: number
          volunteer_id: string
        }
        Update: {
          skill_id?: number
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["skill_id"]
          },
          {
            foreignKeyName: "volunteer_skills_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteers: {
        Row: {
          age: number | null
          availability_end_date: string | null
          availability_start_date: string | null
          created_at: string | null
          days_available: string[] | null
          email: string | null
          full_name: string | null
          id: string
          mobile_number: string | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          organization: string | null
          preferred_location: string | null
          time_preference: string | null
          updated_at: string | null
          work_types: string[] | null
        }
        Insert: {
          age?: number | null
          availability_end_date?: string | null
          availability_start_date?: string | null
          created_at?: string | null
          days_available?: string[] | null
          email?: string | null
          full_name?: string | null
          id: string
          mobile_number?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          organization?: string | null
          preferred_location?: string | null
          time_preference?: string | null
          updated_at?: string | null
          work_types?: string[] | null
        }
        Update: {
          age?: number | null
          availability_end_date?: string | null
          availability_start_date?: string | null
          created_at?: string | null
          days_available?: string[] | null
          email?: string | null
          full_name?: string | null
          id?: string
          mobile_number?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          organization?: string | null
          preferred_location?: string | null
          time_preference?: string | null
          updated_at?: string | null
          work_types?: string[] | null
        }
        Relationships: []
      }
      volunteers_non_auth: {
        Row: {
          age: number | null
          availability_end_date: string | null
          availability_start_date: string | null
          created_at: string | null
          days_available: string[] | null
          email: string | null
          full_name: string | null
          id: string
          mobile_number: string | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          organization: string | null
          preferred_location: string | null
          time_preference: string | null
          updated_at: string | null
          volunteer_id: string
          work_types: string[] | null
        }
        Insert: {
          age?: number | null
          availability_end_date?: string | null
          availability_start_date?: string | null
          created_at?: string | null
          days_available?: string[] | null
          email?: string | null
          full_name?: string | null
          id?: string
          mobile_number?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          organization?: string | null
          preferred_location?: string | null
          time_preference?: string | null
          updated_at?: string | null
          volunteer_id: string
          work_types?: string[] | null
        }
        Update: {
          age?: number | null
          availability_end_date?: string | null
          availability_start_date?: string | null
          created_at?: string | null
          days_available?: string[] | null
          email?: string | null
          full_name?: string | null
          id?: string
          mobile_number?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          organization?: string | null
          preferred_location?: string | null
          time_preference?: string | null
          updated_at?: string | null
          volunteer_id?: string
          work_types?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteers_non_auth_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
