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
      backlink_network_memberships: {
        Row: {
          contact_email: string | null
          created_at: string
          id: string
          is_enabled: boolean
          product_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          product_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          product_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "backlink_network_memberships_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backlink_network_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      backlink_prospects: {
        Row: {
          action_type: Database["public"]["Enums"]["prospect_action_type"]
          contact_email: string | null
          contact_name: string | null
          created_at: string
          discovered_at: string
          domain: string | null
          email_body: string | null
          email_subject: string | null
          found_url: string | null
          id: string
          notes: string | null
          product_id: string
          raw_post_text: string | null
          status: Database["public"]["Enums"]["prospect_status"]
          target_url: string | null
          tier: Database["public"]["Enums"]["prospect_tier"]
        }
        Insert: {
          action_type: Database["public"]["Enums"]["prospect_action_type"]
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          discovered_at?: string
          domain?: string | null
          email_body?: string | null
          email_subject?: string | null
          found_url?: string | null
          id?: string
          notes?: string | null
          product_id: string
          raw_post_text?: string | null
          status?: Database["public"]["Enums"]["prospect_status"]
          target_url?: string | null
          tier: Database["public"]["Enums"]["prospect_tier"]
        }
        Update: {
          action_type?: Database["public"]["Enums"]["prospect_action_type"]
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          discovered_at?: string
          domain?: string | null
          email_body?: string | null
          email_subject?: string | null
          found_url?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          raw_post_text?: string | null
          status?: Database["public"]["Enums"]["prospect_status"]
          target_url?: string | null
          tier?: Database["public"]["Enums"]["prospect_tier"]
        }
        Relationships: [
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
          backlinks: number | null
          category: string | null
          check_method: Database["public"]["Enums"]["directory_check_method"]
          created_at: string
          dofollow_backlinks: number | null
          dofollow_referring_domains: number | null
          domain: string
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
          backlinks?: number | null
          category?: string | null
          check_method?: Database["public"]["Enums"]["directory_check_method"]
          created_at?: string
          dofollow_backlinks?: number | null
          dofollow_referring_domains?: number | null
          domain: string
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
          backlinks?: number | null
          category?: string | null
          check_method?: Database["public"]["Enums"]["directory_check_method"]
          created_at?: string
          dofollow_backlinks?: number | null
          dofollow_referring_domains?: number | null
          domain?: string
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
      directory_submissions: {
        Row: {
          created_at: string
          directory_id: string
          discovered_at: string
          domain: string
          id: string
          last_checked_at: string | null
          last_indexed_at: string | null
          listing_url: string | null
          notes: string | null
          product_id: string
          status: Database["public"]["Enums"]["directory_submission_status"]
          submitted_at: string | null
        }
        Insert: {
          created_at?: string
          directory_id: string
          discovered_at?: string
          domain: string
          id?: string
          last_checked_at?: string | null
          last_indexed_at?: string | null
          listing_url?: string | null
          notes?: string | null
          product_id: string
          status?: Database["public"]["Enums"]["directory_submission_status"]
          submitted_at?: string | null
        }
        Update: {
          created_at?: string
          directory_id?: string
          discovered_at?: string
          domain?: string
          id?: string
          last_checked_at?: string | null
          last_indexed_at?: string | null
          listing_url?: string | null
          notes?: string | null
          product_id?: string
          status?: Database["public"]["Enums"]["directory_submission_status"]
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directory_submissions_directory_id_fkey"
            columns: ["directory_id"]
            isOneToOne: false
            referencedRelation: "directories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_submissions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequences: {
        Row: {
          created_at: string
          id: string
          next_send_at: string
          reply_token: string
          status: Database["public"]["Enums"]["email_sequence_status"]
          step: number
          stopped_at: string | null
          type: Database["public"]["Enums"]["email_sequence_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          next_send_at: string
          reply_token?: string
          status?: Database["public"]["Enums"]["email_sequence_status"]
          step?: number
          stopped_at?: string | null
          type: Database["public"]["Enums"]["email_sequence_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          next_send_at?: string
          reply_token?: string
          status?: Database["public"]["Enums"]["email_sequence_status"]
          step?: number
          stopped_at?: string | null
          type?: Database["public"]["Enums"]["email_sequence_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sequences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_backlink_discovery_settings: {
        Row: {
          dr_max: number | null
          dr_min: number
          opportunity_types: Database["public"]["Enums"]["prospect_tier"][]
          product_id: string
          updated_at: string
        }
        Insert: {
          dr_max?: number | null
          dr_min?: number
          opportunity_types?: Database["public"]["Enums"]["prospect_tier"][]
          product_id: string
          updated_at?: string
        }
        Update: {
          dr_max?: number | null
          dr_min?: number
          opportunity_types?: Database["public"]["Enums"]["prospect_tier"][]
          product_id?: string
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
          email_settings: Json | null
          id: string
          name: string | null
          onboarding_completed: boolean
          stripe_customer_id: string | null
          tier: Database["public"]["Enums"]["billing_tier"]
          updated_at: string
        }
        Insert: {
          active_trial?: boolean
          billing_period_end_at: string
          billing_period_start_at: string
          created_at?: string
          email: string
          email_settings?: Json | null
          id: string
          name?: string | null
          onboarding_completed?: boolean
          stripe_customer_id?: string | null
          tier?: Database["public"]["Enums"]["billing_tier"]
          updated_at?: string
        }
        Update: {
          active_trial?: boolean
          billing_period_end_at?: string
          billing_period_start_at?: string
          created_at?: string
          email?: string
          email_settings?: Json | null
          id?: string
          name?: string | null
          onboarding_completed?: boolean
          stripe_customer_id?: string | null
          tier?: Database["public"]["Enums"]["billing_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      reply_queue_configs: {
        Row: {
          communities: Json | null
          created_at: string
          custom_voice_instructions: string | null
          email_alerts_enabled: boolean
          id: string
          keywords: string[]
          last_run_at: string | null
          last_run_status: string | null
          platforms: string[]
          product_id: string
          status: string
          total_mentions_found: number
          user_id: string
        }
        Insert: {
          communities?: Json | null
          created_at?: string
          custom_voice_instructions?: string | null
          email_alerts_enabled?: boolean
          id?: string
          keywords?: string[]
          last_run_at?: string | null
          last_run_status?: string | null
          platforms?: string[]
          product_id: string
          status?: string
          total_mentions_found?: number
          user_id: string
        }
        Update: {
          communities?: Json | null
          created_at?: string
          custom_voice_instructions?: string | null
          email_alerts_enabled?: boolean
          id?: string
          keywords?: string[]
          last_run_at?: string | null
          last_run_status?: string | null
          platforms?: string[]
          product_id?: string
          status?: string
          total_mentions_found?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reply_queue_configs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      reply_queue_items: {
        Row: {
          author: string | null
          body: string
          comment_count: number
          community: string | null
          config_id: string
          created_at: string
          engagement: number
          fit_category: string
          fit_score: number
          id: string
          platform: string
          post_created_at: string | null
          post_id: string
          run_id: string
          suggested_reply: string | null
          summary: string | null
          title: string | null
          url: string
          user_id: string
          user_status: string
        }
        Insert: {
          author?: string | null
          body: string
          comment_count?: number
          community?: string | null
          config_id: string
          created_at?: string
          engagement?: number
          fit_category: string
          fit_score: number
          id?: string
          platform: string
          post_created_at?: string | null
          post_id: string
          run_id: string
          suggested_reply?: string | null
          summary?: string | null
          title?: string | null
          url: string
          user_id: string
          user_status?: string
        }
        Update: {
          author?: string | null
          body?: string
          comment_count?: number
          community?: string | null
          config_id?: string
          created_at?: string
          engagement?: number
          fit_category?: string
          fit_score?: number
          id?: string
          platform?: string
          post_created_at?: string | null
          post_id?: string
          run_id?: string
          suggested_reply?: string | null
          summary?: string | null
          title?: string | null
          url?: string
          user_id?: string
          user_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reply_queue_items_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "reply_queue_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reply_queue_items_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "reply_queue_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      reply_queue_runs: {
        Row: {
          config_id: string
          created_at: string
          date_from: string | null
          date_to: string | null
          error: string | null
          id: string
          mentions_found: number
          posts_scanned: number
          status: string
          user_id: string
        }
        Insert: {
          config_id: string
          created_at?: string
          date_from?: string | null
          date_to?: string | null
          error?: string | null
          id?: string
          mentions_found?: number
          posts_scanned?: number
          status?: string
          user_id: string
        }
        Update: {
          config_id?: string
          created_at?: string
          date_from?: string | null
          date_to?: string | null
          error?: string | null
          id?: string
          mentions_found?: number
          posts_scanned?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reply_queue_runs_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "reply_queue_configs"
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
      billing_tier: "free" | "pro" | "agency"
      directory_check_method: "serp_check" | "head_check"
      directory_submission_status:
        | "not_submitted"
        | "submitted"
        | "indexed"
        | "not_indexed"
        | "dismissed"
      email_sequence_status: "active" | "stopped" | "completed"
      email_sequence_type: "onboarding"
      prospect_action_type: "email_outreach" | "social_media"
      prospect_status: "new" | "contacted" | "dismissed"
      prospect_tier:
        | "competitor_backlink"
        | "unlinked_mention"
        | "media_mention"
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
      directory_submission_status: [
        "not_submitted",
        "submitted",
        "indexed",
        "not_indexed",
        "dismissed",
      ],
      email_sequence_status: ["active", "stopped", "completed"],
      email_sequence_type: ["onboarding"],
      prospect_action_type: ["email_outreach", "social_media"],
      prospect_status: ["new", "contacted", "dismissed"],
      prospect_tier: [
        "competitor_backlink",
        "unlinked_mention",
        "media_mention",
      ],
    },
  },
} as const
