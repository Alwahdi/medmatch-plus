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
      account_deletion_requests: {
        Row: {
          admin_note: string | null
          email_snapshot: string
          id: string
          processed_at: string | null
          reason: string | null
          requested_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          email_snapshot: string
          id?: string
          processed_at?: string | null
          reason?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          email_snapshot?: string
          id?: string
          processed_at?: string | null
          reason?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_events: {
        Row: {
          created_at: string
          feature: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feature: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feature?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      alert_deliveries: {
        Row: {
          alert_id: string
          attempt_count: number
          channel: string
          error: string | null
          id: string
          job_id: string | null
          last_attempt_at: string
          recipient: string | null
          sent_at: string
          shift_id: string | null
          status: string
        }
        Insert: {
          alert_id: string
          attempt_count?: number
          channel: string
          error?: string | null
          id?: string
          job_id?: string | null
          last_attempt_at?: string
          recipient?: string | null
          sent_at?: string
          shift_id?: string | null
          status?: string
        }
        Update: {
          alert_id?: string
          attempt_count?: number
          channel?: string
          error?: string | null
          id?: string
          job_id?: string | null
          last_attempt_at?: string
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
            foreignKeyName: "alert_deliveries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "public_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_deliveries_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "public_shifts"
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
          withdrawal_reason: string | null
          withdrawn_at: string | null
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id: string
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "public_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_search_access: {
        Row: {
          facility_id: string
          last_searched_at: string
          professional_user_id: string
        }
        Insert: {
          facility_id: string
          last_searched_at?: string
          professional_user_id: string
        }
        Update: {
          facility_id?: string
          last_searched_at?: string
          professional_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_search_access_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_search_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          facility_id: string
          request_id: string
          result: Json
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          facility_id: string
          request_id: string
          result?: Json
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          facility_id?: string
          request_id?: string
          result?: Json
        }
        Relationships: [
          {
            foreignKeyName: "candidate_search_requests_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
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
            foreignKeyName: "conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "public_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "public_shifts"
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
          file_name: string | null
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
          file_name?: string | null
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
          file_name?: string | null
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
      document_requirements: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          is_required: boolean
          min_count: number
          name_ar: string
          name_en: string
          note_ar: string | null
          note_en: string | null
          requires_expiry: boolean
          requires_issue_date: boolean
          requires_issuer: boolean
          sort_order: number
          target: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          min_count?: number
          name_ar: string
          name_en: string
          note_ar?: string | null
          note_en?: string | null
          requires_expiry?: boolean
          requires_issue_date?: boolean
          requires_issuer?: boolean
          sort_order?: number
          target: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          min_count?: number
          name_ar?: string
          name_en?: string
          note_ar?: string | null
          note_en?: string | null
          requires_expiry?: boolean
          requires_issue_date?: boolean
          requires_issuer?: boolean
          sort_order?: number
          target?: string
          updated_at?: string
        }
        Relationships: []
      }
      expiry_alert_log: {
        Row: {
          doc_id: string
          doc_table: string
          id: string
          sent_at: string
          threshold_days: number
        }
        Insert: {
          doc_id: string
          doc_table: string
          id?: string
          sent_at?: string
          threshold_days: number
        }
        Update: {
          doc_id?: string
          doc_table?: string
          id?: string
          sent_at?: string
          threshold_days?: number
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
          lat: number | null
          lng: number | null
          logo_url: string | null
          name_ar: string
          name_en: string | null
          rating_avg: number
          rating_count: number
          updated_at: string
          user_id: string | null
          verification_suspended_at: string | null
          verification_suspension_reason: string | null
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
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name_ar: string
          name_en?: string | null
          rating_avg?: number
          rating_count?: number
          updated_at?: string
          user_id?: string | null
          verification_suspended_at?: string | null
          verification_suspension_reason?: string | null
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
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name_ar?: string
          name_en?: string | null
          rating_avg?: number
          rating_count?: number
          updated_at?: string
          user_id?: string | null
          verification_suspended_at?: string | null
          verification_suspension_reason?: string | null
          website?: string | null
        }
        Relationships: []
      }
      facility_documents: {
        Row: {
          created_at: string
          doc_type: string
          expiry_date: string | null
          facility_id: string
          file_name: string | null
          file_path: string | null
          id: string
          issue_date: string | null
          issuer: string | null
          review_note: string | null
          status: Database["public"]["Enums"]["credential_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          expiry_date?: string | null
          facility_id: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          review_note?: string | null
          status?: Database["public"]["Enums"]["credential_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          expiry_date?: string | null
          facility_id?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          review_note?: string | null
          status?: Database["public"]["Enums"]["credential_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_documents_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
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
          availability: Json
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
          is_searchable: boolean
          is_verified: boolean
          lat: number | null
          license_country: string | null
          license_number: string | null
          lng: number | null
          preferred_rate: number | null
          preferred_rate_period: string
          rating_avg: number
          rating_count: number
          search_radius_km: number | null
          search_visibility_confirmed_at: string | null
          specialty_id: string | null
          updated_at: string
          user_id: string
          verification_suspended_at: string | null
          verification_suspension_reason: string | null
          years_experience: number
        }
        Insert: {
          availability?: Json
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
          is_searchable?: boolean
          is_verified?: boolean
          lat?: number | null
          license_country?: string | null
          license_number?: string | null
          lng?: number | null
          preferred_rate?: number | null
          preferred_rate_period?: string
          rating_avg?: number
          rating_count?: number
          search_radius_km?: number | null
          search_visibility_confirmed_at?: string | null
          specialty_id?: string | null
          updated_at?: string
          user_id: string
          verification_suspended_at?: string | null
          verification_suspension_reason?: string | null
          years_experience?: number
        }
        Update: {
          availability?: Json
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
          is_searchable?: boolean
          is_verified?: boolean
          lat?: number | null
          license_country?: string | null
          license_number?: string | null
          lng?: number | null
          preferred_rate?: number | null
          preferred_rate_period?: string
          rating_avg?: number
          rating_count?: number
          search_radius_km?: number | null
          search_visibility_confirmed_at?: string | null
          specialty_id?: string | null
          updated_at?: string
          user_id?: string
          verification_suspended_at?: string | null
          verification_suspension_reason?: string | null
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
      interviews: {
        Row: {
          application_id: string | null
          candidate_note: string | null
          completed_at: string | null
          created_at: string
          duration_minutes: number
          facility_id: string
          id: string
          job_id: string | null
          location: string | null
          meeting_url: string | null
          mode: string
          notes: string | null
          outcome_note: string | null
          outcome_rating: number | null
          professional_user_id: string
          responded_at: string | null
          scheduled_at: string
          shift_booking_id: string | null
          shift_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          candidate_note?: string | null
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number
          facility_id: string
          id?: string
          job_id?: string | null
          location?: string | null
          meeting_url?: string | null
          mode?: string
          notes?: string | null
          outcome_note?: string | null
          outcome_rating?: number | null
          professional_user_id: string
          responded_at?: string | null
          scheduled_at: string
          shift_booking_id?: string | null
          shift_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          candidate_note?: string | null
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number
          facility_id?: string
          id?: string
          job_id?: string | null
          location?: string | null
          meeting_url?: string | null
          mode?: string
          notes?: string | null
          outcome_note?: string | null
          outcome_rating?: number | null
          professional_user_id?: string
          responded_at?: string | null
          scheduled_at?: string
          shift_booking_id?: string | null
          shift_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "public_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_shift_booking_id_fkey"
            columns: ["shift_booking_id"]
            isOneToOne: false
            referencedRelation: "shift_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "public_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
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
            foreignKeyName: "invitations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "public_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "public_shifts"
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
      job_change_events: {
        Row: {
          applicants_notified: number
          changed_by: string | null
          changed_fields: string[]
          created_at: string
          diff: Json
          id: string
          job_id: string
        }
        Insert: {
          applicants_notified?: number
          changed_by?: string | null
          changed_fields: string[]
          created_at?: string
          diff?: Json
          id?: string
          job_id: string
        }
        Update: {
          applicants_notified?: number
          changed_by?: string | null
          changed_fields?: string[]
          created_at?: string
          diff?: Json
          id?: string
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_change_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_change_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "public_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          applications_count: number
          auto_closed: boolean
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
          auto_closed?: boolean
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
          auto_closed?: boolean
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
      notifications: {
        Row: {
          body_ar: string | null
          body_en: string | null
          created_at: string
          id: string
          link: string | null
          pushed_at: string | null
          read_at: string | null
          title_ar: string
          title_en: string
          type: string
          user_id: string
        }
        Insert: {
          body_ar?: string | null
          body_en?: string | null
          created_at?: string
          id?: string
          link?: string | null
          pushed_at?: string | null
          read_at?: string | null
          title_ar: string
          title_en: string
          type: string
          user_id: string
        }
        Update: {
          body_ar?: string | null
          body_en?: string | null
          created_at?: string
          id?: string
          link?: string | null
          pushed_at?: string | null
          read_at?: string | null
          title_ar?: string
          title_en?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          enabled: boolean
          key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profile_change_log: {
        Row: {
          changed_by: string | null
          created_at: string
          facility_id: string | null
          field: string
          id: string
          new_value: string | null
          old_value: string | null
          subject_user_id: string | null
          target: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          facility_id?: string | null
          field: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          subject_user_id?: string | null
          target: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          facility_id?: string | null
          field?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          subject_user_id?: string | null
          target?: string
        }
        Relationships: []
      }
      profile_change_requests: {
        Row: {
          attachment_path: string | null
          created_at: string
          facility_id: string | null
          field: string
          id: string
          new_value: string
          old_value: string | null
          reason: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment_path?: string | null
          created_at?: string
          facility_id?: string | null
          field: string
          id?: string
          new_value: string
          old_value?: string | null
          reason?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachment_path?: string | null
          created_at?: string
          facility_id?: string | null
          field?: string
          id?: string
          new_value?: string
          old_value?: string | null
          reason?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_change_requests_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh?: string
          user_agent?: string | null
          user_id?: string
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
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "public_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "public_shifts"
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
      safety_reports: {
        Row: {
          admin_note: string | null
          category: string
          created_at: string
          details: string | null
          id: string
          reporter_user_id: string
          resolved_at: string | null
          status: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          category: string
          created_at?: string
          details?: string | null
          id?: string
          reporter_user_id: string
          resolved_at?: string | null
          status?: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          category?: string
          created_at?: string
          details?: string | null
          id?: string
          reporter_user_id?: string
          resolved_at?: string | null
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "public_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_bookings: {
        Row: {
          cancellation_actor: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          id: string
          shift_id: string
          status: string
          user_id: string
        }
        Insert: {
          cancellation_actor?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          id?: string
          shift_id: string
          status?: string
          user_id: string
        }
        Update: {
          cancellation_actor?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
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
            isOneToOne: false
            referencedRelation: "public_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_bookings_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
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
      trusted_devices: {
        Row: {
          created_at: string
          credential_id: string
          id: string
          label: string
          last_used_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_id: string
          id?: string
          label: string
          last_used_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          credential_id?: string
          id?: string
          label?: string
          last_used_at?: string | null
          user_agent?: string | null
          user_id?: string
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
      public_jobs: {
        Row: {
          applications_count: number | null
          city: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          expires_at: string | null
          facility_id: string | null
          facility_verified: boolean | null
          id: string | null
          is_featured: boolean | null
          min_experience: number | null
          required_license: string | null
          salary_max: number | null
          salary_min: number | null
          slug: string | null
          specialty_id: string | null
          specialty_name_ar: string | null
          specialty_name_en: string | null
          title: string | null
          vacancies: number | null
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
      public_shifts: {
        Row: {
          applications_count: number | null
          city: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          ends_at: string | null
          facility_id: string | null
          facility_verified: boolean | null
          hourly_rate: number | null
          id: string | null
          is_urgent: boolean | null
          notes: string | null
          specialty_id: string | null
          specialty_name_ar: string | null
          specialty_name_en: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["shift_status"] | null
          title: string | null
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
    }
    Functions: {
      admin_chat_attachment_orphans: {
        Args: never
        Returns: {
          created_at: string
          name: string
          size: number
        }[]
      }
      admin_data_integrity_report: {
        Args: never
        Returns: {
          detail: string
          entity_id: string
          entity_type: string
          issue_code: string
        }[]
      }
      admin_delete_document_requirement: {
        Args: { _id: string }
        Returns: undefined
      }
      admin_list_account_deletion_requests: {
        Args: { _status?: string }
        Returns: {
          admin_note: string
          email_snapshot: string
          id: string
          processed_at: string
          reason: string
          requested_at: string
          status: string
          updated_at: string
          user_id: string
        }[]
      }
      admin_list_safety_reports: {
        Args: { _status?: string }
        Returns: {
          admin_note: string
          category: string
          created_at: string
          details: string
          id: string
          resolved_at: string
          status: string
          target_id: string
          target_label: string
          target_type: string
          updated_at: string
        }[]
      }
      admin_mfa_access_ok: { Args: never; Returns: boolean }
      admin_review_credential: {
        Args: {
          _id: string
          _note?: string
          _status: Database["public"]["Enums"]["credential_status"]
        }
        Returns: undefined
      }
      admin_review_facility_document: {
        Args: {
          _id: string
          _note?: string
          _status: Database["public"]["Enums"]["credential_status"]
        }
        Returns: undefined
      }
      admin_set_admin_role: {
        Args: { _grant: boolean; _user_id: string }
        Returns: boolean
      }
      admin_set_facility_verified: {
        Args: { _facility_id: string; _reason?: string; _value: boolean }
        Returns: undefined
      }
      admin_set_platform_setting: {
        Args: { _enabled: boolean; _key: string }
        Returns: undefined
      }
      admin_set_professional_verified: {
        Args: { _professional_id: string; _reason?: string; _value: boolean }
        Returns: undefined
      }
      admin_update_account_deletion: {
        Args: { _note?: string; _request_id: string; _status: string }
        Returns: undefined
      }
      admin_update_safety_report: {
        Args: { _id: string; _note?: string; _status: string }
        Returns: undefined
      }
      admin_upsert_document_requirement: {
        Args: {
          _code: string
          _id: string
          _is_active: boolean
          _is_required: boolean
          _min_count: number
          _name_ar: string
          _name_en: string
          _note_ar: string
          _note_en: string
          _requires_expiry: boolean
          _requires_issue_date: boolean
          _requires_issuer: boolean
          _sort_order: number
          _target: string
        }
        Returns: string
      }
      admin_user_overview: { Args: { _user_id: string }; Returns: Json }
      book_open_shift: { Args: { _shift_id: string }; Returns: string }
      bootstrap_admin_role: { Args: { _user_id: string }; Returns: boolean }
      can_read_avatar_path: {
        Args: { _owner_folder: string; _viewer: string }
        Returns: boolean
      }
      can_view_facility_identity: {
        Args: { _facility_id: string; _user_id: string }
        Returns: boolean
      }
      cancel_account_deletion: {
        Args: { _request_id: string }
        Returns: undefined
      }
      cancel_facility_shift: {
        Args: { _reason?: string; _shift_id: string }
        Returns: string
      }
      cancel_interview: {
        Args: { _interview_id: string; _reason?: string }
        Returns: undefined
      }
      cancel_my_shift_booking: {
        Args: { _booking_id: string; _reason?: string }
        Returns: string
      }
      canonical_country: { Args: { _value: string }; Returns: string }
      claim_facility_role: { Args: never; Returns: boolean }
      claim_professional_role: { Args: never; Returns: boolean }
      cleanup_orphaned_identities: { Args: never; Returns: Json }
      close_job: { Args: { _job_id: string }; Returns: Json }
      complete_interview: {
        Args: {
          _interview_id: string
          _note?: string
          _rating: number
          _reject?: boolean
        }
        Returns: undefined
      }
      complete_shift: { Args: { _shift_id: string }; Returns: string }
      consume_ai_quota: { Args: { _feature: string }; Returns: Json }
      consume_candidate_search: { Args: never; Returns: number }
      distance_km: {
        Args: { _lat1: number; _lat2: number; _lng1: number; _lng2: number }
        Returns: number
      }
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
      hire_applicant: { Args: { _application_id: string }; Returns: Json }
      is_allowed_upload: {
        Args: { _bucket: string; _metadata: Json; _name: string }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_known_city_country_valid: {
        Args: { _city: string; _country: string }
        Returns: boolean
      }
      job_accepting_applications: {
        Args: { _expires_at: string; _is_active: boolean }
        Returns: boolean
      }
      mark_conversation_read: {
        Args: { _conversation_id: string }
        Returns: number
      }
      mark_incoming_messages_delivered: { Args: never; Returns: number }
      mfa_access_ok: { Args: never; Returns: boolean }
      my_account_deletion_request: {
        Args: never
        Returns: {
          id: string
          processed_at: string
          reason: string
          requested_at: string
          status: string
          updated_at: string
        }[]
      }
      my_inactive_employers: { Args: never; Returns: string[] }
      my_profile_completeness: {
        Args: never
        Returns: {
          facility_complete: boolean
          professional_complete: boolean
        }[]
      }
      my_saved_jobs: {
        Args: never
        Returns: {
          applications_count: number
          city: string
          country: string
          created_at: string
          currency: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          expires_at: string
          facility_verified: boolean
          id: string
          is_available: boolean
          is_featured: boolean
          min_experience: number
          salary_max: number
          salary_min: number
          saved_at: string
          slug: string
          specialty_name_ar: string
          specialty_name_en: string
          title: string
        }[]
      }
      my_sessions: {
        Args: never
        Returns: {
          created_at: string
          id: string
          ip: string
          not_after: string
          updated_at: string
          user_agent: string
        }[]
      }
      public_listing_places: {
        Args: never
        Returns: {
          city: string
          country: string
        }[]
      }
      push_notification: {
        Args: {
          _body_ar?: string
          _body_en?: string
          _link?: string
          _title_ar: string
          _title_en: string
          _type: string
          _user_id: string
        }
        Returns: undefined
      }
      refresh_verification_expiry: { Args: never; Returns: Json }
      rehire_shift: {
        Args: {
          _ends_at: string
          _message?: string
          _shift_id: string
          _starts_at: string
        }
        Returns: string
      }
      release_privilege_audit: {
        Args: never
        Returns: {
          check_code: string
          detail: string
          severity: string
          value: number
        }[]
      }
      release_readiness_report: {
        Args: never
        Returns: {
          check_code: string
          detail: string
          severity: string
          value: number
        }[]
      }
      reopen_job: { Args: { _job_id: string }; Returns: undefined }
      request_account_deletion: { Args: { _reason?: string }; Returns: string }
      require_admin_mfa: { Args: never; Returns: undefined }
      require_mfa: { Args: never; Returns: undefined }
      reschedule_interview: {
        Args: { _interview_id: string; _notes?: string; _scheduled_at: string }
        Returns: undefined
      }
      respond_to_interview: {
        Args: { _accept: boolean; _interview_id: string; _note?: string }
        Returns: string
      }
      review_change_request: {
        Args: { _approve: boolean; _id: string; _note?: string }
        Returns: undefined
      }
      save_engagement_review: {
        Args: {
          _comment?: string
          _direction: Database["public"]["Enums"]["review_direction"]
          _facility_id: string
          _job_id?: string
          _professional_user_id: string
          _rating: number
          _shift_id?: string
        }
        Returns: string
      }
      schedule_interview: {
        Args: {
          _application_id: string
          _duration_minutes?: number
          _location?: string
          _meeting_url?: string
          _mode?: string
          _notes?: string
          _scheduled_at: string
          _shift_booking_id: string
        }
        Returns: string
      }
      search_candidates_idempotent: {
        Args: {
          _city?: string
          _country?: string
          _limit?: number
          _min_experience?: number
          _request_id: string
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
          years_experience: number
        }[]
      }
      search_public_jobs: {
        Args: {
          _city?: string
          _country?: string
          _exclude_ids?: string[]
          _limit?: number
          _offset?: number
          _pref_country?: string
          _pref_specialty_id?: string
          _q?: string
          _sort?: string
          _specialty_id?: string
          _specialty_ids?: string[]
          _type?: string
        }
        Returns: {
          applications_count: number
          city: string
          country: string
          created_at: string
          currency: string
          description: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          expires_at: string
          facility_id: string
          facility_verified: boolean
          id: string
          is_featured: boolean
          min_experience: number
          required_license: string
          salary_max: number
          salary_min: number
          slug: string
          specialty_id: string
          specialty_name_ar: string
          specialty_name_en: string
          title: string
          total_count: number
          vacancies: number
        }[]
      }
      search_public_shifts: {
        Args: {
          _city?: string
          _country?: string
          _limit?: number
          _offset?: number
          _pref_country?: string
          _pref_specialty_id?: string
          _q?: string
          _sort?: string
          _specialty_id?: string
          _specialty_ids?: string[]
        }
        Returns: {
          applications_count: number
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
          notes: string
          specialty_id: string
          specialty_name_ar: string
          specialty_name_en: string
          starts_at: string
          status: Database["public"]["Enums"]["shift_status"]
          title: string
          total_count: number
        }[]
      }
      send_candidate_invitation: {
        Args: {
          _job_id?: string
          _message?: string
          _professional_user_id: string
          _shift_id?: string
        }
        Returns: string
      }
      send_candidate_invitation_from_search: {
        Args: {
          _candidate_id: string
          _job_id?: string
          _message?: string
          _shift_id?: string
        }
        Returns: string
      }
      set_application_stage: {
        Args: {
          _application_id: string
          _status: Database["public"]["Enums"]["application_status"]
        }
        Returns: Database["public"]["Enums"]["application_status"]
      }
      set_search_visibility: { Args: { _visible: boolean }; Returns: string }
      setting_enabled: {
        Args: { _default?: boolean; _key: string }
        Returns: boolean
      }
      slugify: { Args: { input: string }; Returns: string }
      start_candidate_conversation: {
        Args: {
          _job_id?: string
          _professional_user_id: string
          _shift_id?: string
          _subject?: string
        }
        Returns: string
      }
      start_candidate_conversation_from_search: {
        Args: {
          _candidate_id: string
          _job_id?: string
          _shift_id?: string
          _subject?: string
        }
        Returns: string
      }
      submit_contact_message_internal: {
        Args: {
          _email: string
          _message: string
          _name: string
          _subject?: string
        }
        Returns: string
      }
      submit_job_application: {
        Args: { _cover_letter?: string; _job_id: string }
        Returns: string
      }
      submit_safety_report: {
        Args: {
          _category: string
          _details?: string
          _target_id: string
          _target_type: string
        }
        Returns: string
      }
      unhire_applicant: {
        Args: { _application_id: string }
        Returns: undefined
      }
      update_job_listing: {
        Args: {
          _city: string
          _country: string
          _currency: string
          _description: string
          _employment_type: Database["public"]["Enums"]["employment_type"]
          _expires_at?: string
          _job_id: string
          _min_experience: number
          _required_license: string
          _salary_max: number
          _salary_min: number
          _specialty_id: string
          _title: string
          _vacancies: number
        }
        Returns: string
      }
      withdraw_job_application: {
        Args: { _application_id: string; _reason?: string }
        Returns: string
      }
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
        | "withdrawn"
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
        "withdrawn",
      ],
      credential_status: ["pending", "approved", "rejected"],
      employment_type: ["full_time", "part_time", "contract", "locum", "shift"],
      invitation_status: ["pending", "accepted", "declined", "cancelled"],
      review_direction: ["pro_to_facility", "facility_to_pro"],
      shift_status: ["open", "booked", "cancelled", "completed"],
    },
  },
} as const
