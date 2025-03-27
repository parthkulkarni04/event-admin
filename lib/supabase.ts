import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Type definitions for our database tables
export type Event = {
  id: number
  title: string
  location: string
  location_type: "virtual" | "physical"
  description: string | null
  thumbnail_image: string | null
  event_category: "Education" | "Blog" | "Culture" | "Rehabilitation" | "Environment" | "Audio Recording" | "Field Work" | "Sports" | "Employment & Entrepreneurship"
  start_date: string
  end_date: string
  registration_deadline: string | null
  max_volunteers: number
  email_sent: boolean
  status: "draft" | "published" | "archived"
  created_at: string
}


export type Task = {
  task_id: number
  event_id: number
  volunteer_id: string | null
  volunteer_email: string | null
  task_description: string
  task_status: "unassigned" | "assigned" | "inprogress" | "complete"
  task_feedback: string | null
  created_at: string
  updated_at: string
}

export type Volunteer = {
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

export type VolunteerNonAuth = {
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
  onboarding_step: number | null
  onboarding_completed: boolean | null
  created_at: string | null
  updated_at: string | null
}

export type Skill = {
  skill_id: number
  skill: string
  skill_icon: string | null
}

export type VolunteerEvent = {
  id: number
  volunteer_id: string
  event_id: number
  status: "not registered" | "registered"
  created_at: string
  feedback: string | null
  feedback_submitted_at: string | null
  star_rating: number | null
}

