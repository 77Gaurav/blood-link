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
      appointments: {
        Row: {
          appointment_date: string
          created_at: string
          emergency_post_id: string | null
          hospital_id: string
          id: string
          notes: string | null
          status: string
          updated_at: string
          volunteer_id: string
        }
        Insert: {
          appointment_date: string
          created_at?: string
          emergency_post_id?: string | null
          hospital_id: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          volunteer_id: string
        }
        Update: {
          appointment_date?: string
          created_at?: string
          emergency_post_id?: string | null
          hospital_id?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          volunteer_id?: string
        }
        Relationships: []
      }
      blood_inventory: {
        Row: {
          blood_bank_id: string
          blood_group: Database["public"]["Enums"]["blood_group"]
          city: string
          created_at: string
          id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          blood_bank_id: string
          blood_group: Database["public"]["Enums"]["blood_group"]
          city: string
          created_at?: string
          id?: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          blood_bank_id?: string
          blood_group?: Database["public"]["Enums"]["blood_group"]
          city?: string
          created_at?: string
          id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          blood_bank_id: string
          created_at: string
          emergency_post_id: string | null
          hospital_id: string
          id: string
          updated_at: string
        }
        Insert: {
          blood_bank_id: string
          created_at?: string
          emergency_post_id?: string | null
          hospital_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          blood_bank_id?: string
          created_at?: string
          emergency_post_id?: string | null
          hospital_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      emergency_posts: {
        Row: {
          blood_group: Database["public"]["Enums"]["blood_group"]
          contact_phone: string
          created_at: string | null
          description: string | null
          id: string
          location: string
          posted_by: string
          quantity: number
          status: string
          updated_at: string | null
          urgency_level: string
        }
        Insert: {
          blood_group: Database["public"]["Enums"]["blood_group"]
          contact_phone: string
          created_at?: string | null
          description?: string | null
          id?: string
          location: string
          posted_by: string
          quantity: number
          status?: string
          updated_at?: string | null
          urgency_level: string
        }
        Update: {
          blood_group?: Database["public"]["Enums"]["blood_group"]
          contact_phone?: string
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string
          posted_by?: string
          quantity?: number
          status?: string
          updated_at?: string | null
          urgency_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_posts_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean
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
      participations: {
        Row: {
          age: number | null
          blood_sugar_level: string | null
          city: string | null
          contact_number: string | null
          created_at: string | null
          emergency_id: string
          gender: string | null
          id: string
          major_diseases_history: string | null
          message: string | null
          previous_donation: boolean | null
          status: string
          stress_level: string | null
          type_of_work: string | null
          volunteer_id: string
          volunteer_name: string | null
          weight: number | null
        }
        Insert: {
          age?: number | null
          blood_sugar_level?: string | null
          city?: string | null
          contact_number?: string | null
          created_at?: string | null
          emergency_id: string
          gender?: string | null
          id?: string
          major_diseases_history?: string | null
          message?: string | null
          previous_donation?: boolean | null
          status?: string
          stress_level?: string | null
          type_of_work?: string | null
          volunteer_id: string
          volunteer_name?: string | null
          weight?: number | null
        }
        Update: {
          age?: number | null
          blood_sugar_level?: string | null
          city?: string | null
          contact_number?: string | null
          created_at?: string | null
          emergency_id?: string
          gender?: string | null
          id?: string
          major_diseases_history?: string | null
          message?: string | null
          previous_donation?: boolean | null
          status?: string
          stress_level?: string | null
          type_of_work?: string | null
          volunteer_id?: string
          volunteer_name?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "participations_emergency_id_fkey"
            columns: ["emergency_id"]
            isOneToOne: false
            referencedRelation: "emergency_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participations_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          blood_sugar_level: string | null
          blood_type: string | null
          city: string | null
          created_at: string | null
          drinking_habit: string | null
          full_name: string
          gender: string | null
          id: string
          job_description: string | null
          location: string | null
          major_diseases_history: string | null
          organization_name: string | null
          phone: string | null
          previous_donation: boolean | null
          profile_completed: boolean | null
          profile_picture_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          smoking_habit: string | null
          stress_level: string | null
          type_of_work: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          age?: number | null
          blood_sugar_level?: string | null
          blood_type?: string | null
          city?: string | null
          created_at?: string | null
          drinking_habit?: string | null
          full_name: string
          gender?: string | null
          id: string
          job_description?: string | null
          location?: string | null
          major_diseases_history?: string | null
          organization_name?: string | null
          phone?: string | null
          previous_donation?: boolean | null
          profile_completed?: boolean | null
          profile_picture_url?: string | null
          role: Database["public"]["Enums"]["user_role"]
          smoking_habit?: string | null
          stress_level?: string | null
          type_of_work?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          age?: number | null
          blood_sugar_level?: string | null
          blood_type?: string | null
          city?: string | null
          created_at?: string | null
          drinking_habit?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          job_description?: string | null
          location?: string | null
          major_diseases_history?: string | null
          organization_name?: string | null
          phone?: string | null
          previous_donation?: boolean | null
          profile_completed?: boolean | null
          profile_picture_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          smoking_habit?: string | null
          stress_level?: string | null
          type_of_work?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      blood_group: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-"
      user_role: "hospital" | "blood_bank" | "volunteer"
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
    Enums: {
      blood_group: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      user_role: ["hospital", "blood_bank", "volunteer"],
    },
  },
} as const
