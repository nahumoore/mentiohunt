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
      opportunities: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_role: string | null
          discovered_at: string
          domain: string
          domain_rating: number | null
          email_body: string
          email_subject: string
          fit_reason: string
          fit_score: number
          id: string
          monthly_traffic: number | null
          page_title: string
          page_url: string
          product_id: string
          status: Database["public"]["Enums"]["opportunity_status"]
          type: Database["public"]["Enums"]["opportunity_type"]
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_role?: string | null
          discovered_at?: string
          domain: string
          domain_rating?: number | null
          email_body?: string
          email_subject?: string
          fit_reason: string
          fit_score: number
          id?: string
          monthly_traffic?: number | null
          page_title: string
          page_url: string
          product_id: string
          status?: Database["public"]["Enums"]["opportunity_status"]
          type: Database["public"]["Enums"]["opportunity_type"]
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_role?: string | null
          discovered_at?: string
          domain?: string
          domain_rating?: number | null
          email_body?: string
          email_subject?: string
          fit_reason?: string
          fit_score?: number
          id?: string
          monthly_traffic?: number | null
          page_title?: string
          page_url?: string
          product_id?: string
          status?: Database["public"]["Enums"]["opportunity_status"]
          type?: Database["public"]["Enums"]["opportunity_type"]
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_articles: {
        Row: {
          added_at: string
          description: string | null
          id: string
          product_id: string
          sitemap_id: string | null
          source: Database["public"]["Enums"]["article_source"]
          status: Database["public"]["Enums"]["article_status"]
          target_keywords: string[]
          title: string
          topics: string[]
          url: string
          word_count: number | null
        }
        Insert: {
          added_at?: string
          description?: string | null
          id?: string
          product_id: string
          sitemap_id?: string | null
          source?: Database["public"]["Enums"]["article_source"]
          status?: Database["public"]["Enums"]["article_status"]
          target_keywords?: string[]
          title: string
          topics?: string[]
          url: string
          word_count?: number | null
        }
        Update: {
          added_at?: string
          description?: string | null
          id?: string
          product_id?: string
          sitemap_id?: string | null
          source?: Database["public"]["Enums"]["article_source"]
          status?: Database["public"]["Enums"]["article_status"]
          target_keywords?: string[]
          title?: string
          topics?: string[]
          url?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_articles_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_articles_sitemap_id_fkey"
            columns: ["sitemap_id"]
            isOneToOne: false
            referencedRelation: "product_sitemaps"
            referencedColumns: ["id"]
          },
        ]
      }
      product_discovery_settings: {
        Row: {
          dofollow_only: boolean
          domain_age_min: number
          dr_max: number | null
          dr_min: number
          languages: string[]
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
      product_sitemaps: {
        Row: {
          articles_discovered: number
          created_at: string
          id: string
          last_crawled_at: string | null
          product_id: string
          status: Database["public"]["Enums"]["sitemap_status"]
          url: string
        }
        Insert: {
          articles_discovered?: number
          created_at?: string
          id?: string
          last_crawled_at?: string | null
          product_id: string
          status?: Database["public"]["Enums"]["sitemap_status"]
          url: string
        }
        Update: {
          articles_discovered?: number
          created_at?: string
          id?: string
          last_crawled_at?: string | null
          product_id?: string
          status?: Database["public"]["Enums"]["sitemap_status"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_sitemaps_product_id_fkey"
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
          opportunity_types: Database["public"]["Enums"]["opportunity_type"][]
          product_description: string
          updated_at: string
          user_id: string
          website_url: string
        }
        Insert: {
          competitors?: string[]
          created_at?: string
          id?: string
          opportunity_types?: Database["public"]["Enums"]["opportunity_type"][]
          product_description: string
          updated_at?: string
          user_id: string
          website_url: string
        }
        Update: {
          competitors?: string[]
          created_at?: string
          id?: string
          opportunity_types?: Database["public"]["Enums"]["opportunity_type"][]
          product_description?: string
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
      article_source: "manual" | "sitemap"
      article_status: "active" | "disabled"
      billing_tier: "free" | "pro" | "agency"
      opportunity_status: "new" | "contacted" | "replied" | "won" | "dismissed"
      opportunity_type:
        | "directories"
        | "resource_pages"
        | "listicles"
        | "alternatives"
        | "competitor_mentions"
        | "niche_blogs"
      sitemap_status: "active" | "paused" | "error"
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
      article_source: ["manual", "sitemap"],
      article_status: ["active", "disabled"],
      billing_tier: ["free", "pro", "agency"],
      opportunity_status: ["new", "contacted", "replied", "won", "dismissed"],
      opportunity_type: [
        "directories",
        "resource_pages",
        "listicles",
        "alternatives",
        "competitor_mentions",
        "niche_blogs",
      ],
      sitemap_status: ["active", "paused", "error"],
    },
  },
} as const
