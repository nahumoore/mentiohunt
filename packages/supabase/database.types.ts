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
      contacts: {
        Row: {
          confidence: number | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          opportunity_id: string
          role: string | null
          source: Database["public"]["Enums"]["contact_source"]
          verification_status: Database["public"]["Enums"]["contact_verification_status"]
          verified_at: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          opportunity_id: string
          role?: string | null
          source?: Database["public"]["Enums"]["contact_source"]
          verification_status?: Database["public"]["Enums"]["contact_verification_status"]
          verified_at?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          opportunity_id?: string
          role?: string | null
          source?: Database["public"]["Enums"]["contact_source"]
          verification_status?: Database["public"]["Enums"]["contact_verification_status"]
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          created_at: string
          discovered_at: string
          domain: string
          domain_authority: number | null
          evidence: Json
          id: string
          rationale: string | null
          spam_score: number | null
          status: Database["public"]["Enums"]["opportunity_status"]
          title: string | null
          type: Database["public"]["Enums"]["opportunity_type"]
          validated_at: string | null
        }
        Insert: {
          created_at?: string
          discovered_at?: string
          domain: string
          domain_authority?: number | null
          evidence?: Json
          id?: string
          rationale?: string | null
          spam_score?: number | null
          status?: Database["public"]["Enums"]["opportunity_status"]
          title?: string | null
          type: Database["public"]["Enums"]["opportunity_type"]
          validated_at?: string | null
        }
        Update: {
          created_at?: string
          discovered_at?: string
          domain?: string
          domain_authority?: number | null
          evidence?: Json
          id?: string
          rationale?: string | null
          spam_score?: number | null
          status?: Database["public"]["Enums"]["opportunity_status"]
          title?: string | null
          type?: Database["public"]["Enums"]["opportunity_type"]
          validated_at?: string | null
        }
        Relationships: []
      }
      product_opportunities: {
        Row: {
          created_at: string
          id: string
          opportunity_id: string
          outreach_message: string | null
          product_id: string
          published_at: string | null
          score: number | null
          status: Database["public"]["Enums"]["product_opportunity_status"]
          updated_at: string
          why_fit: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          opportunity_id: string
          outreach_message?: string | null
          product_id: string
          published_at?: string | null
          score?: number | null
          status?: Database["public"]["Enums"]["product_opportunity_status"]
          updated_at?: string
          why_fit?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          opportunity_id?: string
          outreach_message?: string | null
          product_id?: string
          published_at?: string | null
          score?: number | null
          status?: Database["public"]["Enums"]["product_opportunity_status"]
          updated_at?: string
          why_fit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_opportunities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_opportunities_product_id_fkey"
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
          discovery_source: Database["public"]["Enums"]["discovery_source"]
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
          discovery_source?: Database["public"]["Enums"]["discovery_source"]
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
          discovery_source?: Database["public"]["Enums"]["discovery_source"]
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
          created_at: string
          email: string
          id: string
          name: string | null
          onboarding_completed: boolean
          tier: Database["public"]["Enums"]["billing_tier"]
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
        }
        Insert: {
          active_trial?: boolean
          created_at?: string
          email: string
          id: string
          name?: string | null
          onboarding_completed?: boolean
          tier?: Database["public"]["Enums"]["billing_tier"]
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
        }
        Update: {
          active_trial?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          onboarding_completed?: boolean
          tier?: Database["public"]["Enums"]["billing_tier"]
          trial_ends_at?: string | null
          trial_started_at?: string | null
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
      contact_source: "hunter" | "page" | "contact_page" | "manual"
      contact_verification_status: "unverified" | "valid" | "risky" | "invalid"
      discovery_source:
        | "google_search"
        | "competitor_backlinks"
        | "manual"
        | "mixed"
      opportunity_status: "pending" | "validated" | "rejected"
      opportunity_type:
        | "directories"
        | "resource_pages"
        | "listicles"
        | "alternatives"
        | "competitor_mentions"
        | "niche_blogs"
      product_opportunity_status: "new" | "saved" | "dismissed" | "contacted"
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
      contact_source: ["hunter", "page", "contact_page", "manual"],
      contact_verification_status: ["unverified", "valid", "risky", "invalid"],
      discovery_source: [
        "google_search",
        "competitor_backlinks",
        "manual",
        "mixed",
      ],
      opportunity_status: ["pending", "validated", "rejected"],
      opportunity_type: [
        "directories",
        "resource_pages",
        "listicles",
        "alternatives",
        "competitor_mentions",
        "niche_blogs",
      ],
      product_opportunity_status: ["new", "saved", "dismissed", "contacted"],
    },
  },
} as const
