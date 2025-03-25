export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: number
          title: string
          location: string
          location_type: "virtual" | "physical"
          description: string | null
          thumbnail_image: string | null
          event_category: "A" | "B" | "C" | "D" | "E"
          start_date: string
          end_date: string
          registration_deadline: string | null
          max_volunteers: number
          email_sent: boolean
          status: "draft" | "published" | "archived"
          created_at: string
        }
        Insert: {
          id?: number
          title: string
          location: string
          location_type: "virtual" | "physical"
          description?: string | null
          thumbnail_image?: string | null
          event_category: "A" | "B" | "C" | "D" | "E"
          start_date: string
          end_date: string
          registration_deadline?: string | null
          max_volunteers?: number
          email_sent?: boolean
          status?: "draft" | "published" | "archived"
          created_at?: string
        }
        Update: {
          id?: number
          title?: string
          location?: string
          location_type?: "virtual" | "physical"
          description?: string | null
          thumbnail_image?: string | null
          event_category?: "A" | "B" | "C" | "D" | "E"
          start_date?: string
          end_date?: string
          registration_deadline?: string | null
          max_volunteers?: number
          email_sent?: boolean
          status?: "draft" | "published" | "archived"
          created_at?: string
        }
      }
      skills: {
        Row: {
          skill_id: number
          skill: string
          skill_icon: string | null
        }
        Insert: {
          skill_id?: number
          skill: string
          skill_icon?: string | null
        }
        Update: {
          skill_id?: number
          skill?: string
          skill_icon?: string | null
        }
      }
      task_skills: {
        Row: {
          task_id: number
          skill_id: number
        }
        Insert: {
          task_id: number
          skill_id: number
        }
        Update: {
          task_id?: number
          skill_id?: number
        }
      }
      tasks: {
        Row: {
          task_id: number
          event_id: number
          volunteer_id: string | null
          volunteer_email: string | null
          task_description: string
          task_status: "unassigned" | "to do" | "doing" | "done"
          task_feedback: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          task_id?: number
          event_id: number
          volunteer_id?: string | null
          volunteer_email?: string | null
          task_description: string
          task_status?: "unassigned" | "to do" | "doing" | "done"
          task_feedback?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          task_id?: number
          event_id?: number
          volunteer_id?: string | null
          volunteer_email?: string | null
          task_description?: string
          task_status?: "unassigned" | "to do" | "doing" | "done"
          task_feedback?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      volunteer_event: {
        Row: {
          id: number
          volunteer_id: string
          event_id: number
          status: "not registered" | "registered"
          created_at: string
          feedback: string | null
          feedback_submitted_at: string | null
          star_rating: number | null
        }
        Insert: {
          id?: number
          volunteer_id: string
          event_id: number
          status?: "not registered" | "registered"
          created_at?: string
          feedback?: string | null
          feedback_submitted_at?: string | null
          star_rating?: number | null
        }
        Update: {
          id?: number
          volunteer_id?: string
          event_id?: number
          status?: "not registered" | "registered"
          created_at?: string
          feedback?: string | null
          feedback_submitted_at?: string | null
          star_rating?: number | null
        }
      }
      volunteer_skills: {
        Row: {
          volunteer_id: string
          skill_id: number
        }
        Insert: {
          volunteer_id: string
          skill_id: number
        }
        Update: {
          volunteer_id?: string
          skill_id?: number
        }
      }
      volunteers: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          mobile_number: string | null
          age: number | null
          organization: string | null
          work_types: string[] | null
          preferred_location: string | null
          availability_start_date: string | null
          availability_end_date: string | null
          time_preference: string | null
          days_available: string[] | null
          onboarding_step: number
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          mobile_number?: string | null
          age?: number | null
          organization?: string | null
          work_types?: string[] | null
          preferred_location?: string | null
          availability_start_date?: string | null
          availability_end_date?: string | null
          time_preference?: string | null
          days_available?: string[] | null
          onboarding_step?: number
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          mobile_number?: string | null
          age?: number | null
          organization?: string | null
          work_types?: string[] | null
          preferred_location?: string | null
          availability_start_date?: string | null
          availability_end_date?: string | null
          time_preference?: string | null
          days_available?: string[] | null
          onboarding_step?: number
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

