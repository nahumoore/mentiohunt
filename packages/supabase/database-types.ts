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
      backlink_prospect_runs: {
        Row: {
          completed_at: string | null
          cost_usd: number | null
          error: string | null
          id: string
          input: Json
          metadata: Json | null
          product_id: string
          prospects_created: number
          started_at: string
          status: Database["public"]["Enums"]["run_status"]
          strategy: Database["public"]["Enums"]["prospect_tier"]
        }
        Insert: {
          completed_at?: string | null
          cost_usd?: number | null
          error?: string | null
          id?: string
          input?: Json
          metadata?: Json | null
          product_id: string
          prospects_created?: number
          started_at?: string
          status?: Database["public"]["Enums"]["run_status"]
          strategy: Database["public"]["Enums"]["prospect_tier"]
        }
        Update: {
          completed_at?: string | null
          cost_usd?: number | null
          error?: string | null
          id?: string
          input?: Json
          metadata?: Json | null
          product_id?: string
          prospects_created?: number
          started_at?: string
          status?: Database["public"]["Enums"]["run_status"]
          strategy?: Database["public"]["Enums"]["prospect_tier"]
        }
        Relationships: [
          {
            foreignKeyName: "backlink_prospect_runs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      backlink_prospects: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_social_links: Json | null
          created_at: string
          discovered_at: string
          domain: string | null
          domain_rating: number | null
          email_account_id: string | null
          email_body: string | null
          email_subject: string | null
          found_url: string | null
          id: string
          product_id: string
          raw_metadata: Json | null
          site_relevance_score: number | null
          status: Database["public"]["Enums"]["prospect_status"]
          target_url: string | null
          tier: Database["public"]["Enums"]["prospect_tier"]
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_social_links?: Json | null
          created_at?: string
          discovered_at?: string
          domain?: string | null
          domain_rating?: number | null
          email_account_id?: string | null
          email_body?: string | null
          email_subject?: string | null
          found_url?: string | null
          id?: string
          product_id: string
          raw_metadata?: Json | null
          site_relevance_score?: number | null
          status?: Database["public"]["Enums"]["prospect_status"]
          target_url?: string | null
          tier: Database["public"]["Enums"]["prospect_tier"]
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_social_links?: Json | null
          created_at?: string
          discovered_at?: string
          domain?: string | null
          domain_rating?: number | null
          email_account_id?: string | null
          email_body?: string | null
          email_subject?: string | null
          found_url?: string | null
          id?: string
          product_id?: string
          raw_metadata?: Json | null
          site_relevance_score?: number | null
          status?: Database["public"]["Enums"]["prospect_status"]
          target_url?: string | null
          tier?: Database["public"]["Enums"]["prospect_tier"]
        }
        Relationships: [
          {
            foreignKeyName: "backlink_prospects_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
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
      backlink_prospects_settings: {
        Row: {
          discovery_status: Json | null
          dr_max: number | null
          dr_min: number
          offering: string | null
          opportunity_types: Database["public"]["Enums"]["prospect_tier"][]
          product_id: string
          updated_at: string
          voice_tone: string | null
        }
        Insert: {
          discovery_status?: Json | null
          dr_max?: number | null
          dr_min?: number
          offering?: string | null
          opportunity_types?: Database["public"]["Enums"]["prospect_tier"][]
          product_id: string
          updated_at?: string
          voice_tone?: string | null
        }
        Update: {
          discovery_status?: Json | null
          dr_max?: number | null
          dr_min?: number
          offering?: string | null
          opportunity_types?: Database["public"]["Enums"]["prospect_tier"][]
          product_id?: string
          updated_at?: string
          voice_tone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backlink_prospects_settings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
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
      email_accounts: {
        Row: {
          created_at: string
          daily_send_cap: number
          email: string
          error_message: string | null
          id: string
          imap_host: string | null
          imap_pass: string | null
          imap_port: number | null
          imap_user: string | null
          is_public: boolean
          name: string
          provider: Database["public"]["Enums"]["email_account_provider"]
          smtp_host: string | null
          smtp_pass: string | null
          smtp_port: number | null
          smtp_user: string | null
          status: Database["public"]["Enums"]["email_account_status"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          daily_send_cap?: number
          email: string
          error_message?: string | null
          id?: string
          imap_host?: string | null
          imap_pass?: string | null
          imap_port?: number | null
          imap_user?: string | null
          is_public?: boolean
          name: string
          provider: Database["public"]["Enums"]["email_account_provider"]
          smtp_host?: string | null
          smtp_pass?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          status?: Database["public"]["Enums"]["email_account_status"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          daily_send_cap?: number
          email?: string
          error_message?: string | null
          id?: string
          imap_host?: string | null
          imap_pass?: string | null
          imap_port?: number | null
          imap_user?: string | null
          is_public?: boolean
          name?: string
          provider?: Database["public"]["Enums"]["email_account_provider"]
          smtp_host?: string | null
          smtp_pass?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          status?: Database["public"]["Enums"]["email_account_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      product_pages: {
        Row: {
          crawl_status: Database["public"]["Enums"]["page_crawl_status"]
          crawled_at: string | null
          created_at: string
          description: string | null
          id: string
          keywords: string[]
          page_type: Database["public"]["Enums"]["page_type"]
          priority: number
          product_id: string
          title: string | null
          updated_at: string
          url: string
        }
        Insert: {
          crawl_status?: Database["public"]["Enums"]["page_crawl_status"]
          crawled_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          keywords?: string[]
          page_type?: Database["public"]["Enums"]["page_type"]
          priority?: number
          product_id: string
          title?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          crawl_status?: Database["public"]["Enums"]["page_crawl_status"]
          crawled_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          keywords?: string[]
          page_type?: Database["public"]["Enums"]["page_type"]
          priority?: number
          product_id?: string
          title?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_pages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
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
          company_size: string | null
          created_at: string
          email: string
          email_settings: Json | null
          id: string
          name: string | null
          onboarding_completed: boolean
          referral_source: string | null
          role: string | null
          stripe_customer_id: string | null
          tier: Database["public"]["Enums"]["billing_tier"]
          updated_at: string
        }
        Insert: {
          active_trial?: boolean
          billing_period_end_at: string
          billing_period_start_at: string
          company_size?: string | null
          created_at?: string
          email: string
          email_settings?: Json | null
          id: string
          name?: string | null
          onboarding_completed?: boolean
          referral_source?: string | null
          role?: string | null
          stripe_customer_id?: string | null
          tier?: Database["public"]["Enums"]["billing_tier"]
          updated_at?: string
        }
        Update: {
          active_trial?: boolean
          billing_period_end_at?: string
          billing_period_start_at?: string
          company_size?: string | null
          created_at?: string
          email?: string
          email_settings?: Json | null
          id?: string
          name?: string | null
          onboarding_completed?: boolean
          referral_source?: string | null
          role?: string | null
          stripe_customer_id?: string | null
          tier?: Database["public"]["Enums"]["billing_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      prospect_sequences: {
        Row: {
          body: string | null
          created_at: string
          email_account_id: string
          id: string
          prospect_id: string
          scheduled_at: string
          sent_at: string | null
          status: Database["public"]["Enums"]["prospect_sequence_status"]
          step: number
          subject: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          email_account_id: string
          id?: string
          prospect_id: string
          scheduled_at: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["prospect_sequence_status"]
          step: number
          subject?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          email_account_id?: string
          id?: string
          prospect_id?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["prospect_sequence_status"]
          step?: number
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospect_sequences_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_sequences_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "backlink_prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      reported_issues: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          product_id: string
          prospect_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          product_id: string
          prospect_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          product_id?: string
          prospect_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reported_issues_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reported_issues_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "backlink_prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reported_issues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      merge_discovery_status: {
        Args: { p_product_id: string; p_updates: Json }
        Returns: undefined
      }
    }
    Enums: {
      billing_tier: "free" | "pro" | "agency"
      directory_check_method: "serp_check" | "head_check"
      email_account_provider: "gmail" | "outlook" | "zoho" | "smtp"
      email_account_status: "active" | "error"
      email_sequence_status: "active" | "stopped" | "completed"
      email_sequence_type: "onboarding"
      page_crawl_status: "pending" | "crawled" | "failed"
      page_type:
        | "sitemap"
        | "article"
        | "resource"
        | "free_tool"
        | "landing_page"
        | "case_study"
        | "comparison"
        | "manual"
      prospect_sequence_status:
        | "pending"
        | "sent"
        | "failed"
        | "skipped"
        | "paused"
      prospect_status: "new" | "contacted" | "dismissed" | "negotiating" | "won"
      prospect_tier:
        | "competitor_backlink"
        | "unlinked_mention"
        | "listicle_roundup"
      run_status: "pending" | "running" | "completed" | "failed"
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
      email_account_provider: ["gmail", "outlook", "zoho", "smtp"],
      email_account_status: ["active", "error"],
      email_sequence_status: ["active", "stopped", "completed"],
      email_sequence_type: ["onboarding"],
      page_crawl_status: ["pending", "crawled", "failed"],
      page_type: [
        "sitemap",
        "article",
        "resource",
        "free_tool",
        "landing_page",
        "case_study",
        "comparison",
        "manual",
      ],
      prospect_sequence_status: [
        "pending",
        "sent",
        "failed",
        "skipped",
        "paused",
      ],
      prospect_status: ["new", "contacted", "dismissed", "negotiating", "won"],
      prospect_tier: [
        "competitor_backlink",
        "unlinked_mention",
        "listicle_roundup",
      ],
      run_status: ["pending", "running", "completed", "failed"],
    },
  },
} as const
