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
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      healthcare_professionals: {
        Row: {
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
          specialty_id: string | null
          updated_at: string
          user_id: string
          years_experience: number
        }
        Insert: {
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
          specialty_id?: string | null
          updated_at?: string
          user_id: string
          years_experience?: number
        }
        Update: {
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
      jobs: {
        Row: {
          city: string
          country: string
          created_at: string
          currency: string
          description: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          facility_id: string
          id: string
          is_active: boolean
          min_experience: number
          required_license: string | null
          salary_max: number
          salary_min: number
          specialty_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          city: string
          country: string
          created_at?: string
          currency?: string
          description?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          facility_id: string
          id?: string
          is_active?: boolean
          min_experience?: number
          required_license?: string | null
          salary_max: number
          salary_min: number
          specialty_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          currency?: string
          description?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          facility_id?: string
          id?: string
          is_active?: boolean
          min_experience?: number
          required_license?: string | null
          salary_max?: number
          salary_min?: number
          specialty_id?: string | null
          title?: string
          updated_at?: string
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
          booked_by: string | null
          city: string
          country: string
          created_at: string
          currency: string
          ends_at: string
          facility_id: string
          hourly_rate: number
          id: string
          notes: string | null
          specialty_id: string | null
          starts_at: string
          status: Database["public"]["Enums"]["shift_status"]
          title: string
          updated_at: string
        }
        Insert: {
          booked_by?: string | null
          city: string
          country: string
          created_at?: string
          currency?: string
          ends_at: string
          facility_id: string
          hourly_rate: number
          id?: string
          notes?: string | null
          specialty_id?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["shift_status"]
          title: string
          updated_at?: string
        }
        Update: {
          booked_by?: string | null
          city?: string
          country?: string
          created_at?: string
          currency?: string
          ends_at?: string
          facility_id?: string
          hourly_rate?: number
          id?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
      credential_status: "pending" | "approved" | "rejected"
      employment_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "locum"
        | "shift"
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
      shift_status: ["open", "booked", "cancelled", "completed"],
    },
  },
} as const
