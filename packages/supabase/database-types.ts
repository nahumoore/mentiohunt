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
      backlink_prospects: {
        Row: {
          action_type: Database["public"]["Enums"]["prospect_action_type"]
          contact_email: string | null
          contact_name: string | null
          created_at: string
          directory_id: string | null
          discovered_at: string
          domain: string
          email_body: string
          email_subject: string
          id: string
          notes: string | null
          product_id: string
          status: Database["public"]["Enums"]["prospect_status"]
          target_url: string
          tier: Database["public"]["Enums"]["prospect_tier"]
        }
        Insert: {
          action_type: Database["public"]["Enums"]["prospect_action_type"]
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          directory_id?: string | null
          discovered_at?: string
          domain: string
          email_body?: string
          email_subject?: string
          id?: string
          notes?: string | null
          product_id: string
          status?: Database["public"]["Enums"]["prospect_status"]
          target_url: string
          tier: Database["public"]["Enums"]["prospect_tier"]
        }
        Update: {
          action_type?: Database["public"]["Enums"]["prospect_action_type"]
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          directory_id?: string | null
          discovered_at?: string
          domain?: string
          email_body?: string
          email_subject?: string
          id?: string
          notes?: string | null
          product_id?: string
          status?: Database["public"]["Enums"]["prospect_status"]
          target_url?: string
          tier?: Database["public"]["Enums"]["prospect_tier"]
        }
        Relationships: [
          {
            foreignKeyName: "backlink_prospects_directory_id_fkey"
            columns: ["directory_id"]
            isOneToOne: false
            referencedRelation: "directories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backlink_prospects_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      directories: {
        Row: {
          category: string | null
          check_method: Database["public"]["Enums"]["directory_check_method"]
          created_at: string
          domain: string
          backlinks: number | null
          dofollow_backlinks: number | null
          dofollow_referring_domains: number | null
          domain_rating: number | null
          id: string
          is_active: boolean
          is_free: boolean
          name: string
          referring_domains: number | null
          seo_metrics_updated_at: string | null
          slug_pattern: string | null
          submit_url: string
          submit_url_ok: boolean
          submit_url_verified_at: string | null
        }
        Insert: {
          category?: string | null
          check_method?: Database["public"]["Enums"]["directory_check_method"]
          created_at?: string
          domain: string
          backlinks?: number | null
          dofollow_backlinks?: number | null
          dofollow_referring_domains?: number | null
          domain_rating?: number | null
          id?: string
          is_active?: boolean
          is_free?: boolean
          name: string
          referring_domains?: number | null
          seo_metrics_updated_at?: string | null
          slug_pattern?: string | null
          submit_url: string
          submit_url_ok?: boolean
          submit_url_verified_at?: string | null
        }
        Update: {
          category?: string | null
          check_method?: Database["public"]["Enums"]["directory_check_method"]
          created_at?: string
          domain?: string
          backlinks?: number | null
          dofollow_backlinks?: number | null
          dofollow_referring_domains?: number | null
          domain_rating?: number | null
          id?: string
          is_active?: boolean
          is_free?: boolean
          name?: string
          referring_domains?: number | null
          seo_metrics_updated_at?: string | null
          slug_pattern?: string | null
          submit_url?: string
          submit_url_ok?: boolean
          submit_url_verified_at?: string | null
        }
        Relationships: []
      }
      product_backlink_discovery_settings: {
        Row: {
          dofollow_only: boolean
          domain_age_min: number
          dr_max: number | null
          dr_min: number
          languages: string[]
          opportunity_types: Database["public"]["Enums"]["prospect_tier"][]
          product_id: string
          traffic_min: number
          updated_at: string
        }
        Insert: {
          dofollow_only?: boolean
          domain_age_min?: number
          dr_max?: number | null
          dr_min?: number
          languages?: string[]
          opportunity_types?: Database["public"]["Enums"]["prospect_tier"][]
          product_id: string
          traffic_min?: number
          updated_at?: string
        }
        Update: {
          dofollow_only?: boolean
          domain_age_min?: number
          dr_max?: number | null
          dr_min?: number
          languages?: string[]
          opportunity_types?: Database["public"]["Enums"]["prospect_tier"][]
          product_id?: string
          traffic_min?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_discovery_settings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          competitors: string[]
          created_at: string
          id: string
          product_description: string
          product_name: string
          updated_at: string
          user_id: string
          website_url: string
        }
        Insert: {
          competitors?: string[]
          created_at?: string
          id?: string
          product_description: string
          product_name: string
          updated_at?: string
          user_id: string
          website_url: string
        }
        Update: {
          competitors?: string[]
          created_at?: string
          id?: string
          product_description?: string
          product_name?: string
          updated_at?: string
          user_id?: string
          website_url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_trial: boolean
          billing_period_end_at: string
          billing_period_start_at: string
          created_at: string
          email: string
          id: string
          name: string | null
          onboarding_completed: boolean
          tier: Database["public"]["Enums"]["billing_tier"]
          updated_at: string
        }
        Insert: {
          active_trial?: boolean
          billing_period_end_at: string
          billing_period_start_at: string
          created_at?: string
          email: string
          id: string
          name?: string | null
          onboarding_completed?: boolean
          tier?: Database["public"]["Enums"]["billing_tier"]
          updated_at?: string
        }
        Update: {
          active_trial?: boolean
          billing_period_end_at?: string
          billing_period_start_at?: string
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          onboarding_completed?: boolean
          tier?: Database["public"]["Enums"]["billing_tier"]
          updated_at?: string
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
      billing_tier: "free" | "pro" | "agency"
      directory_check_method: "serp_check" | "head_check"
      prospect_action_type: "self_service" | "email_outreach"
      prospect_status:
        | "new"
        | "submitted"
        | "contacted"
        | "replied"
        | "won"
        | "dismissed"
      prospect_tier: "directory" | "competitor_backlink" | "unlinked_mention"
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
      billing_tier: ["free", "pro", "agency"],
      directory_check_method: ["serp_check", "head_check"],
      prospect_action_type: ["self_service", "email_outreach"],
      prospect_status: [
        "new",
        "submitted",
        "contacted",
        "replied",
        "won",
        "dismissed",
      ],
      prospect_tier: ["directory", "competitor_backlink", "unlinked_mention"],
    },
  },
} as const
