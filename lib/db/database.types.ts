// Generated from the live Supabase schema (Management API). Do not edit by hand; regenerate after a migration.
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      area_managers: {
        Row: {
          area_manager_id: string
          city: string
          max_alerts_per_week: number
          name: string
        }
        Insert: {
          area_manager_id: string
          city: string
          max_alerts_per_week?: number
          name: string
        }
        Update: {
          area_manager_id?: string
          city?: string
          max_alerts_per_week?: number
          name?: string
        }
        Relationships: []
      }
      cards: {
        Row: {
          audience: string
          created_at: string
          id: string
          issue_id: string
          rejected_draft: string | null
          salesperson_id: string | null
          source: string
          text: string
          validation: Json
        }
        Insert: {
          audience: string
          created_at?: string
          id?: string
          issue_id: string
          rejected_draft?: string | null
          salesperson_id?: string | null
          source: string
          text: string
          validation: Json
        }
        Update: {
          audience?: string
          created_at?: string
          id?: string
          issue_id?: string
          rejected_draft?: string | null
          salesperson_id?: string | null
          source?: string
          text?: string
          validation?: Json
        }
        Relationships: [
          {
            foreignKeyName: "cards_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      dq_flags: {
        Row: {
          alerted: boolean
          detail: string
          id: string
          kind: string
          rows_affected: number
          store_id: string | null
        }
        Insert: {
          alerted?: boolean
          detail: string
          id: string
          kind: string
          rows_affected?: number
          store_id?: string | null
        }
        Update: {
          alerted?: boolean
          detail?: string
          id?: string
          kind?: string
          rows_affected?: number
          store_id?: string | null
        }
        Relationships: []
      }
      issues: {
        Row: {
          action: Json
          area_manager_id: string
          as_of: string
          cause: string
          evidence: Json
          followup: Json | null
          id: string
          lever: string
          rank: number
          rupees_at_stake: number
          store_id: string
          type: string
        }
        Insert: {
          action: Json
          area_manager_id: string
          as_of: string
          cause: string
          evidence: Json
          followup?: Json | null
          id: string
          lever: string
          rank: number
          rupees_at_stake: number
          store_id: string
          type: string
        }
        Update: {
          action?: Json
          area_manager_id?: string
          as_of?: string
          cause?: string
          evidence?: Json
          followup?: Json | null
          id?: string
          lever?: string
          rank?: number
          rupees_at_stake?: number
          store_id?: string
          type?: string
        }
        Relationships: []
      }
      runs: {
        Row: {
          as_of: string
          cards: number
          error: string | null
          finished_at: string | null
          gemini_fallback: number
          gemini_ok: number
          id: string
          issues: number
          ok: boolean
          rows_read: number
          started_at: string
          trigger: string
        }
        Insert: {
          as_of: string
          cards?: number
          error?: string | null
          finished_at?: string | null
          gemini_fallback?: number
          gemini_ok?: number
          id?: string
          issues?: number
          ok?: boolean
          rows_read?: number
          started_at?: string
          trigger: string
        }
        Update: {
          as_of?: string
          cards?: number
          error?: string | null
          finished_at?: string | null
          gemini_fallback?: number
          gemini_ok?: number
          id?: string
          issues?: number
          ok?: boolean
          rows_read?: number
          started_at?: string
          trigger?: string
        }
        Relationships: []
      }
      salesperson_metrics: {
        Row: {
          as_of: string
          bills: number
          discount_pct: number
          display_name: string
          inferred_left: boolean
          ipb: number
          last_active: string | null
          pair_attach_kurta: number | null
          pair_attach_sherwani: number | null
          presence: number | null
          repeat_rate: number | null
          salesperson_id: string
          store_id: string
        }
        Insert: {
          as_of: string
          bills: number
          discount_pct: number
          display_name: string
          inferred_left?: boolean
          ipb: number
          last_active?: string | null
          pair_attach_kurta?: number | null
          pair_attach_sherwani?: number | null
          presence?: number | null
          repeat_rate?: number | null
          salesperson_id: string
          store_id: string
        }
        Update: {
          as_of?: string
          bills?: number
          discount_pct?: number
          display_name?: string
          inferred_left?: boolean
          ipb?: number
          last_active?: string | null
          pair_attach_kurta?: number | null
          pair_attach_sherwani?: number | null
          presence?: number | null
          repeat_rate?: number | null
          salesperson_id?: string
          store_id?: string
        }
        Relationships: []
      }
      store_metrics: {
        Row: {
          as_of: string
          avg_bill_value: number
          bills: number
          conversion: number
          discount_pct: number
          footfall: number
          ipb: number
          presence: number | null
          repeat_rate: number | null
          store_id: string
          window: string
        }
        Insert: {
          as_of: string
          avg_bill_value: number
          bills: number
          conversion: number
          discount_pct: number
          footfall: number
          ipb: number
          presence?: number | null
          repeat_rate?: number | null
          store_id: string
          window: string
        }
        Update: {
          as_of?: string
          avg_bill_value?: number
          bills?: number
          conversion?: number
          discount_pct?: number
          footfall?: number
          ipb?: number
          presence?: number | null
          repeat_rate?: number | null
          store_id?: string
          window?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          area_manager_id: string | null
          city: string
          opened_on: string | null
          state: string
          store_id: string
          tier: string | null
        }
        Insert: {
          area_manager_id?: string | null
          city: string
          opened_on?: string | null
          state: string
          store_id: string
          tier?: string | null
        }
        Update: {
          area_manager_id?: string | null
          city?: string
          opened_on?: string | null
          state?: string
          store_id?: string
          tier?: string | null
        }
        Relationships: []
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
    Enums: {},
  },
} as const

