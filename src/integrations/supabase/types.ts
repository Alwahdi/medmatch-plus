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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alert_deliveries: {
        Row: {
          alert_id: string
          channel: string
          error: string | null
          id: string
          job_id: string | null
          recipient: string | null
          sent_at: string
          shift_id: string | null
          status: string
        }
        Insert: {
          alert_id: string
          channel: string
          error?: string | null
          id?: string
          job_id?: string | null
          recipient?: string | null
          sent_at?: string
          shift_id?: string | null
          status?: string
        }
        Update: {
          alert_id?: string
          channel?: string
          error?: string | null
          id?: string
          job_id?: string | null
          recipient?: string | null
          sent_at?: string
          shift_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_deliveries_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "job_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_deliveries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_deliveries_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          cover_letter: string | null
          created_at: string
          id: string
          job_id: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_handled: boolean
          message: string
          name: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_handled?: boolean
          message: string
          name: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_handled?: boolean
          message?: string
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          facility_id: string
          id: string
          identity_revealed: boolean
          job_id: string | null
          last_message_at: string
          professional_user_id: string
          shift_id: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          facility_id: string
          id?: string
          identity_revealed?: boolean
          job_id?: string | null
          last_message_at?: string
          professional_user_id: string
          shift_id?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          facility_id?: string
          id?: string
          identity_revealed?: boolean
          job_id?: string | null
          last_message_at?: string
          professional_user_id?: string
          shift_id?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      credentials: {
        Row: {
          created_at: string
          doc_type: string
          expiry_date: string | null
          file_path: string | null
          id: string
          issue_date: string | null
          issuer: string | null
          review_note: string | null
          status: Database["public"]["Enums"]["credential_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          expiry_date?: string | null
          file_path?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          review_note?: string | null
          status?: Database["public"]["Enums"]["credential_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          expiry_date?: string | null
          file_path?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          review_note?: string | null
          status?: Database["public"]["Enums"]["credential_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      facilities: {
        Row: {
          city: string
          country: string
          created_at: string
          description: string | null
          facility_type: string
          id: string
          is_verified: boolean
          logo_url: string | null
          name_ar: string
          name_en: string | null
          rating_avg: number
          rating_count: number
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          city: string
          country: string
          created_at?: string
          description?: string | null
          facility_type?: string
          id?: string
          is_verified?: boolean
          logo_url?: string | null
          name_ar: string
          name_en?: string | null
          rating_avg?: number
          rating_count?: number
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          description?: string | null
          facility_type?: string
          id?: string
          is_verified?: boolean
          logo_url?: string | null
          name_ar?: string
          name_en?: string | null
          rating_avg?: number
          rating_count?: number
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      facility_subscriptions: {
        Row: {
          billing_period: string
          created_at: string
          ends_at: string
          facility_id: string
          id: string
          plan_code: string
          searches_used: number
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          billing_period?: string
          created_at?: string
          ends_at?: string
          facility_id: string
          id?: string
          plan_code: string
          searches_used?: number
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          billing_period?: string
          created_at?: string
          ends_at?: string
          facility_id?: string
          id?: string
          plan_code?: string
          searches_used?: number
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_subscriptions_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: true
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_subscriptions_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["code"]
          },
        ]
      }
      healthcare_professionals: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          currency: string
          expected_salary: number | null
          full_name: string
          headline: string | null
          id: string
          is_open_to_shifts: boolean
          is_verified: boolean
          license_country: string | null
          license_number: string | null
          rating_avg: number
          rating_count: number
          specialty_id: string | null
          updated_at: string
          user_id: string
          years_experience: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          expected_salary?: number | null
          full_name?: string
          headline?: string | null
          id?: string
          is_open_to_shifts?: boolean
          is_verified?: boolean
          license_country?: string | null
          license_number?: string | null
          rating_avg?: number
          rating_count?: number
          specialty_id?: string | null
          updated_at?: string
          user_id: string
          years_experience?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          expected_salary?: number | null
          full_name?: string
          headline?: string | null
          id?: string
          is_open_to_shifts?: boolean
          is_verified?: boolean
          license_country?: string | null
          license_number?: string | null
          rating_avg?: number
          rating_count?: number
          specialty_id?: string | null
          updated_at?: string
          user_id?: string
          years_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "healthcare_professionals_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          facility_id: string
          id: string
          job_id: string | null
          message: string | null
          professional_user_id: string
          responded_at: string | null
          shift_id: string | null
          status: Database["public"]["Enums"]["invitation_status"]
        }
        Insert: {
          created_at?: string
          facility_id: string
          id?: string
          job_id?: string | null
          message?: string | null
          professional_user_id: string
          responded_at?: string | null
          shift_id?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
        }
        Update: {
          created_at?: string
          facility_id?: string
          id?: string
          job_id?: string | null
          message?: string | null
          professional_user_id?: string
          responded_at?: string | null
          shift_id?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "invitations_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      job_alerts: {
        Row: {
          channel: string
          city: string | null
          country: string | null
          created_at: string
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          id: string
          is_active: boolean
          last_sent_at: string | null
          specialty_id: string | null
          updated_at: string
          user_id: string
          whatsapp_phone: string | null
        }
        Insert: {
          channel?: string
          city?: string | null
          country?: string | null
          created_at?: string
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          id?: string
          is_active?: boolean
          last_sent_at?: string | null
          specialty_id?: string | null
          updated_at?: string
          user_id: string
          whatsapp_phone?: string | null
        }
        Update: {
          channel?: string
          city?: string | null
          country?: string | null
          created_at?: string
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          id?: string
          is_active?: boolean
          last_sent_at?: string | null
          specialty_id?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_alerts_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          applications_count: number
          city: string
          country: string
          created_at: string
          currency: string
          description: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          expires_at: string | null
          facility_id: string
          facility_verified: boolean
          id: string
          is_active: boolean
          is_featured: boolean
          min_experience: number
          publisher_name: string | null
          required_license: string | null
          salary_max: number
          salary_min: number
          slug: string | null
          specialty_id: string | null
          title: string
          updated_at: string
          vacancies: number
        }
        Insert: {
          applications_count?: number
          city: string
          country: string
          created_at?: string
          currency?: string
          description?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          expires_at?: string | null
          facility_id: string
          facility_verified?: boolean
          id?: string
          is_active?: boolean
          is_featured?: boolean
          min_experience?: number
          publisher_name?: string | null
          required_license?: string | null
          salary_max: number
          salary_min: number
          slug?: string | null
          specialty_id?: string | null
          title: string
          updated_at?: string
          vacancies?: number
        }
        Update: {
          applications_count?: number
          city?: string
          country?: string
          created_at?: string
          currency?: string
          description?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          expires_at?: string | null
          facility_id?: string
          facility_verified?: boolean
          id?: string
          is_active?: boolean
          is_featured?: boolean
          min_experience?: number
          publisher_name?: string | null
          required_license?: string | null
          salary_max?: number
          salary_min?: number
          slug?: string | null
          specialty_id?: string | null
          title?: string
          updated_at?: string
          vacancies?: number
        }
        Relationships: [
          {
            foreignKeyName: "jobs_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_path: string | null
          attachment_size: number | null
          attachment_type: string | null
          body: string
          conversation_id: string
          created_at: string
          delivered_at: string | null
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          body?: string
          conversation_id: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          body?: string
          conversation_id?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_user_id: string
          comment: string | null
          created_at: string
          direction: Database["public"]["Enums"]["review_direction"]
          facility_id: string
          id: string
          job_id: string | null
          professional_user_id: string
          rating: number
          shift_id: string | null
          updated_at: string
        }
        Insert: {
          author_user_id: string
          comment?: string | null
          created_at?: string
          direction: Database["public"]["Enums"]["review_direction"]
          facility_id: string
          id?: string
          job_id?: string | null
          professional_user_id: string
          rating: number
          shift_id?: string | null
          updated_at?: string
        }
        Update: {
          author_user_id?: string
          comment?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["review_direction"]
          facility_id?: string
          id?: string
          job_id?: string | null
          professional_user_id?: string
          rating?: number
          shift_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_jobs: {
        Row: {
          created_at: string
          id: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_bookings: {
        Row: {
          created_at: string
          id: string
          shift_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          shift_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          shift_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_bookings_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: true
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          applications_count: number
          booked_by: string | null
          city: string
          country: string
          created_at: string
          currency: string
          ends_at: string
          facility_id: string
          facility_verified: boolean
          hourly_rate: number
          id: string
          is_urgent: boolean
          notes: string | null
          specialty_id: string | null
          starts_at: string
          status: Database["public"]["Enums"]["shift_status"]
          title: string
          updated_at: string
        }
        Insert: {
          applications_count?: number
          booked_by?: string | null
          city: string
          country: string
          created_at?: string
          currency?: string
          ends_at: string
          facility_id: string
          facility_verified?: boolean
          hourly_rate: number
          id?: string
          is_urgent?: boolean
          notes?: string | null
          specialty_id?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["shift_status"]
          title: string
          updated_at?: string
        }
        Update: {
          applications_count?: number
          booked_by?: string | null
          city?: string
          country?: string
          created_at?: string
          currency?: string
          ends_at?: string
          facility_id?: string
          facility_verified?: boolean
          hourly_rate?: number
          id?: string
          is_urgent?: boolean
          notes?: string | null
          specialty_id?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["shift_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      specialties: {
        Row: {
          category: string
          id: string
          name_ar: string
          name_en: string
          slug: string
        }
        Insert: {
          category?: string
          id?: string
          name_ar: string
          name_en: string
          slug: string
        }
        Update: {
          category?: string
          id?: string
          name_ar?: string
          name_en?: string
          slug?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          active_jobs: number
          active_shifts: number
          ai_credits: number
          candidate_searches: number
          code: string
          created_at: string
          currency: string
          description_ar: string
          featured_jobs: number
          grace_days: number
          is_trial: boolean
          list_price_monthly: number | null
          name_ar: string
          name_en: string
          price_monthly: number
          price_yearly: number
          recruiter_seats: number
          sort_order: number
          urgent_shifts: number
        }
        Insert: {
          active_jobs?: number
          active_shifts?: number
          ai_credits?: number
          candidate_searches?: number
          code: string
          created_at?: string
          currency?: string
          description_ar?: string
          featured_jobs?: number
          grace_days?: number
          is_trial?: boolean
          list_price_monthly?: number | null
          name_ar: string
          name_en: string
          price_monthly?: number
          price_yearly?: number
          recruiter_seats?: number
          sort_order?: number
          urgent_shifts?: number
        }
        Update: {
          active_jobs?: number
          active_shifts?: number
          ai_credits?: number
          candidate_searches?: number
          code?: string
          created_at?: string
          currency?: string
          description_ar?: string
          featured_jobs?: number
          grace_days?: number
          is_trial?: boolean
          list_price_monthly?: number | null
          name_ar?: string
          name_en?: string
          price_monthly?: number
          price_yearly?: number
          recruiter_seats?: number
          sort_order?: number
          urgent_shifts?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_facility_identity: {
        Args: { _facility_id: string; _user_id: string }
        Returns: boolean
      }
      claim_facility_role: { Args: never; Returns: boolean }
      consume_candidate_search: { Args: never; Returns: number }
      has_engagement: {
        Args: { _facility_id: string; _professional_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      search_candidates: {
        Args: {
          _city?: string
          _country?: string
          _limit?: number
          _min_experience?: number
          _specialty_id?: string
        }
        Returns: {
          bio: string
          city: string
          country: string
          headline: string
          id: string
          is_open_to_shifts: boolean
          is_verified: boolean
          specialty_id: string
          user_id: string
          years_experience: number
        }[]
      }
      slugify: { Args: { input: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "facility" | "professional"
      application_status:
        | "submitted"
        | "reviewing"
        | "shortlisted"
        | "interview"
        | "offer"
        | "hired"
        | "rejected"
      credential_status: "pending" | "approved" | "rejected"
      employment_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "locum"
        | "shift"
      invitation_status: "pending" | "accepted" | "declined" | "cancelled"
      review_direction: "pro_to_facility" | "facility_to_pro"
      shift_status: "open" | "booked" | "cancelled" | "completed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "facility", "professional"],
      application_status: [
        "submitted",
        "reviewing",
        "shortlisted",
        "interview",
        "offer",
        "hired",
        "rejected",
      ],
      credential_status: ["pending", "approved", "rejected"],
      employment_type: ["full_time", "part_time", "contract", "locum", "shift"],
      invitation_status: ["pending", "accepted", "declined", "cancelled"],
      review_direction: ["pro_to_facility", "facility_to_pro"],
      shift_status: ["open", "booked", "cancelled", "completed"],
    },
  },
} as const
