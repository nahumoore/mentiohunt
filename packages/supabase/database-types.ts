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
          enrichment_status: Database["public"]["Enums"]["prospect_enrichment_status"]
          found_url: string | null
          id: string
          outreach_stopped_at: string | null
          outreach_stopped_reason: string | null
          product_id: string
          product_page_id: string | null
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
          enrichment_status?: Database["public"]["Enums"]["prospect_enrichment_status"]
          found_url?: string | null
          id?: string
          outreach_stopped_at?: string | null
          outreach_stopped_reason?: string | null
          product_id: string
          product_page_id?: string | null
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
          enrichment_status?: Database["public"]["Enums"]["prospect_enrichment_status"]
          found_url?: string | null
          id?: string
          outreach_stopped_at?: string | null
          outreach_stopped_reason?: string | null
          product_id?: string
          product_page_id?: string | null
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
          {
            foreignKeyName: "backlink_prospects_product_page_id_fkey"
            columns: ["product_page_id"]
            isOneToOne: false
            referencedRelation: "product_pages"
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
          signature_enabled: boolean
          signature_text: string | null
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
          signature_enabled?: boolean
          signature_text?: string | null
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
          signature_enabled?: boolean
          signature_text?: string | null
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
      email_account_mailbox_syncs: {
        Row: {
          created_at: string
          email_account_id: string
          id: string
          last_error: string | null
          last_synced_at: string | null
          last_uid: number
          locked_at: string | null
          mailbox: string
          uid_validity: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_account_id: string
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          last_uid?: number
          locked_at?: string | null
          mailbox?: string
          uid_validity?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_account_id?: string
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          last_uid?: number
          locked_at?: string | null
          mailbox?: string
          uid_validity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_account_mailbox_syncs_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
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
          send_automated_outreach: boolean
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
          send_automated_outreach?: boolean
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
          send_automated_outreach?: boolean
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
      email_suppressions: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
          source_prospect_id: string | null
          source_sequence_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
          source_prospect_id?: string | null
          source_sequence_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
          source_prospect_id?: string | null
          source_sequence_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_suppressions_source_prospect_id_fkey"
            columns: ["source_prospect_id"]
            isOneToOne: false
            referencedRelation: "backlink_prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_suppressions_source_sequence_id_fkey"
            columns: ["source_sequence_id"]
            isOneToOne: false
            referencedRelation: "prospect_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_events: {
        Row: {
          created_at: string
          email_account_id: string | null
          event_type: string
          id: string
          metadata: Json | null
          prospect_id: string | null
          recipient_email: string | null
          sequence_id: string | null
        }
        Insert: {
          created_at?: string
          email_account_id?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          prospect_id?: string | null
          recipient_email?: string | null
          sequence_id?: string | null
        }
        Update: {
          created_at?: string
          email_account_id?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          prospect_id?: string | null
          recipient_email?: string | null
          sequence_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_events_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_events_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "backlink_prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_events_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "prospect_sequences"
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
          walkthrough_seen_at: string | null
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
          walkthrough_seen_at?: string | null
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
          walkthrough_seen_at?: string | null
        }
        Relationships: []
      }
      prospect_messages: {
        Row: {
          classification: string
          classification_confidence: number | null
          classification_reason: string | null
          created_at: string
          direction: string
          email_account_id: string | null
          from_email: string | null
          from_name: string | null
          headers: Json | null
          html_body: string | null
          id: string
          imap_uid: number | null
          imap_uid_validity: number | null
          in_reply_to: string | null
          message_id: string | null
          metadata: Json | null
          prospect_id: string
          received_at: string
          references: string[] | null
          sequence_id: string | null
          subject: string | null
          text_body: string | null
          to_emails: string[] | null
        }
        Insert: {
          classification: string
          classification_confidence?: number | null
          classification_reason?: string | null
          created_at?: string
          direction?: string
          email_account_id?: string | null
          from_email?: string | null
          from_name?: string | null
          headers?: Json | null
          html_body?: string | null
          id?: string
          imap_uid?: number | null
          imap_uid_validity?: number | null
          in_reply_to?: string | null
          message_id?: string | null
          metadata?: Json | null
          prospect_id: string
          received_at: string
          references?: string[] | null
          sequence_id?: string | null
          subject?: string | null
          text_body?: string | null
          to_emails?: string[] | null
        }
        Update: {
          classification?: string
          classification_confidence?: number | null
          classification_reason?: string | null
          created_at?: string
          direction?: string
          email_account_id?: string | null
          from_email?: string | null
          from_name?: string | null
          headers?: Json | null
          html_body?: string | null
          id?: string
          imap_uid?: number | null
          imap_uid_validity?: number | null
          in_reply_to?: string | null
          message_id?: string | null
          metadata?: Json | null
          prospect_id?: string
          received_at?: string
          references?: string[] | null
          sequence_id?: string | null
          subject?: string | null
          text_body?: string | null
          to_emails?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "prospect_messages_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_messages_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "backlink_prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_messages_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "prospect_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_sequences: {
        Row: {
          attempt_count: number
          body: string | null
          bounce_reason: string | null
          bounced_at: string | null
          created_at: string
          email_account_id: string
          id: string
          last_attempt_at: string | null
          last_deferred_at: string | null
          last_error: string | null
          locked_at: string | null
          message_id: string | null
          prospect_id: string
          provider_response: Json | null
          scheduled_at: string
          sent_at: string | null
          status: Database["public"]["Enums"]["prospect_sequence_status"]
          step: number
          subject: string | null
        }
        Insert: {
          attempt_count?: number
          body?: string | null
          bounce_reason?: string | null
          bounced_at?: string | null
          created_at?: string
          email_account_id: string
          id?: string
          last_attempt_at?: string | null
          last_deferred_at?: string | null
          last_error?: string | null
          locked_at?: string | null
          message_id?: string | null
          prospect_id: string
          provider_response?: Json | null
          scheduled_at: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["prospect_sequence_status"]
          step: number
          subject?: string | null
        }
        Update: {
          attempt_count?: number
          body?: string | null
          bounce_reason?: string | null
          bounced_at?: string | null
          created_at?: string
          email_account_id?: string
          id?: string
          last_attempt_at?: string | null
          last_deferred_at?: string | null
          last_error?: string | null
          locked_at?: string | null
          message_id?: string | null
          prospect_id?: string
          provider_response?: Json | null
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
      route_execution_logs: {
        Row: {
          cost_usd: number | null
          duration_ms: number | null
          entries: Json
          error: string | null
          finished_at: string | null
          id: string
          metadata: Json | null
          product_id: string | null
          request: Json | null
          route_name: string
          started_at: string
          status: Database["public"]["Enums"]["route_log_status"]
          user_id: string | null
        }
        Insert: {
          cost_usd?: number | null
          duration_ms?: number | null
          entries?: Json
          error?: string | null
          finished_at?: string | null
          id?: string
          metadata?: Json | null
          product_id?: string | null
          request?: Json | null
          route_name: string
          started_at?: string
          status?: Database["public"]["Enums"]["route_log_status"]
          user_id?: string | null
        }
        Update: {
          cost_usd?: number | null
          duration_ms?: number | null
          entries?: Json
          error?: string | null
          finished_at?: string | null
          id?: string
          metadata?: Json | null
          product_id?: string | null
          request?: Json | null
          route_name?: string
          started_at?: string
          status?: Database["public"]["Enums"]["route_log_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "route_execution_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_execution_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_conversations: {
        Row: {
          agent_read_at: string | null
          created_at: string
          current_path: string | null
          email: string | null
          id: string
          last_agent_message_at: string | null
          last_message_at: string | null
          last_notified_at: string | null
          last_visitor_message_at: string | null
          metadata: Json
          name: string | null
          status: string
          updated_at: string
          user_id: string | null
          visitor_id: string
        }
        Insert: {
          agent_read_at?: string | null
          created_at?: string
          current_path?: string | null
          email?: string | null
          id?: string
          last_agent_message_at?: string | null
          last_message_at?: string | null
          last_notified_at?: string | null
          last_visitor_message_at?: string | null
          metadata?: Json
          name?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          visitor_id: string
        }
        Update: {
          agent_read_at?: string | null
          created_at?: string
          current_path?: string | null
          email?: string | null
          id?: string
          last_agent_message_at?: string | null
          last_message_at?: string | null
          last_notified_at?: string | null
          last_visitor_message_at?: string | null
          metadata?: Json
          name?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          page_url: string | null
          sender: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          page_url?: string | null
          sender: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          page_url?: string | null
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      tracked_link_events: {
        Row: {
          change_type: Database["public"]["Enums"]["tracked_link_change_type"]
          current: Json | null
          detected_at: string
          id: string
          notified_at: string | null
          previous: Json | null
          product_id: string
          tracked_link_id: string
        }
        Insert: {
          change_type: Database["public"]["Enums"]["tracked_link_change_type"]
          current?: Json | null
          detected_at?: string
          id?: string
          notified_at?: string | null
          previous?: Json | null
          product_id: string
          tracked_link_id: string
        }
        Update: {
          change_type?: Database["public"]["Enums"]["tracked_link_change_type"]
          current?: Json | null
          detected_at?: string
          id?: string
          notified_at?: string | null
          previous?: Json | null
          product_id?: string
          tracked_link_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracked_link_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracked_link_events_tracked_link_id_fkey"
            columns: ["tracked_link_id"]
            isOneToOne: false
            referencedRelation: "tracked_links"
            referencedColumns: ["id"]
          },
        ]
      }
      tracked_links: {
        Row: {
          consecutive_failures: number
          consecutive_missing: number
          created_at: string
          expected_target_url: string | null
          first_seen_anchor_text: string | null
          first_seen_at: string | null
          first_seen_href: string | null
          first_seen_rel: string[] | null
          id: string
          issue_since: string | null
          label: string | null
          last_checked_at: string | null
          last_ok_at: string | null
          next_check_at: string
          observed_anchor_text: string | null
          observed_final_url: string | null
          observed_href: string | null
          observed_http_status: number | null
          observed_rel: string[]
          origin: string
          product_id: string
          recent_checks: Json
          source_domain: string
          source_url: string
          status: Database["public"]["Enums"]["tracked_link_status"]
          updated_at: string
        }
        Insert: {
          consecutive_failures?: number
          consecutive_missing?: number
          created_at?: string
          expected_target_url?: string | null
          first_seen_anchor_text?: string | null
          first_seen_at?: string | null
          first_seen_href?: string | null
          first_seen_rel?: string[] | null
          id?: string
          issue_since?: string | null
          label?: string | null
          last_checked_at?: string | null
          last_ok_at?: string | null
          next_check_at?: string
          observed_anchor_text?: string | null
          observed_final_url?: string | null
          observed_href?: string | null
          observed_http_status?: number | null
          observed_rel?: string[]
          origin?: string
          product_id: string
          recent_checks?: Json
          source_domain: string
          source_url: string
          status?: Database["public"]["Enums"]["tracked_link_status"]
          updated_at?: string
        }
        Update: {
          consecutive_failures?: number
          consecutive_missing?: number
          created_at?: string
          expected_target_url?: string | null
          first_seen_anchor_text?: string | null
          first_seen_at?: string | null
          first_seen_href?: string | null
          first_seen_rel?: string[] | null
          id?: string
          issue_since?: string | null
          label?: string | null
          last_checked_at?: string | null
          last_ok_at?: string | null
          next_check_at?: string
          observed_anchor_text?: string | null
          observed_final_url?: string | null
          observed_href?: string | null
          observed_http_status?: number | null
          observed_rel?: string[]
          origin?: string
          product_id?: string
          recent_checks?: Json
          source_domain?: string
          source_url?: string
          status?: Database["public"]["Enums"]["tracked_link_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracked_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_prospect_outreach_sequence: {
        Args: { p_sequence_id: string; p_spacing_seconds?: number }
        Returns: {
          attempt_count: number
          body: string | null
          bounce_reason: string | null
          bounced_at: string | null
          created_at: string
          email_account_id: string
          id: string
          last_attempt_at: string | null
          last_deferred_at: string | null
          last_error: string | null
          locked_at: string | null
          message_id: string | null
          prospect_id: string
          provider_response: Json | null
          scheduled_at: string
          sent_at: string | null
          status: Database["public"]["Enums"]["prospect_sequence_status"]
          step: number
          subject: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "prospect_sequences"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      merge_discovery_status: {
        Args: { p_product_id: string; p_updates: Json }
        Returns: undefined
      }
      stop_prospect_outreach: {
        Args: {
          p_email_account_id: string
          p_event_type: string
          p_metadata?: Json
          p_prospect_id: string
          p_prospect_status?: Database["public"]["Enums"]["prospect_status"]
          p_reason: string
          p_recipient_email: string
          p_sequence_id: string
          p_suppress?: boolean
        }
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
      prospect_enrichment_status: "pending" | "enriching" | "ready" | "failed"
      prospect_sequence_status:
        | "pending"
        | "sent"
        | "failed"
        | "skipped"
        | "paused"
        | "sending"
        | "bounced"
        | "trial_expired"
      prospect_status:
        | "new"
        | "contacted"
        | "dismissed"
        | "negotiating"
        | "won"
        | "email_not_found"
        | "bounced"
      prospect_tier:
        | "competitor_backlink"
        | "unlinked_mention"
        | "listicle_roundup"
        | "resource_page_inclusion"
        | "user_submitted"
        | "broken_link_building"
      route_log_status: "running" | "success" | "error"
      run_status: "pending" | "running" | "completed" | "failed"
      tracked_link_change_type:
        | "link_removed"
        | "link_restored"
        | "rel_added"
        | "rel_removed"
        | "anchor_changed"
        | "target_url_changed"
        | "target_now_competitor"
        | "source_page_dead"
        | "source_page_recovered"
        | "source_page_redirected"
        | "check_failed_persistent"
      tracked_link_status:
        | "pending"
        | "live"
        | "nofollow"
        | "target_changed"
        | "removed"
        | "page_dead"
        | "check_failed"
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
      prospect_enrichment_status: ["pending", "enriching", "ready", "failed"],
      prospect_sequence_status: [
        "pending",
        "sent",
        "failed",
        "skipped",
        "paused",
        "sending",
        "bounced",
        "trial_expired",
      ],
      prospect_status: [
        "new",
        "contacted",
        "dismissed",
        "negotiating",
        "won",
        "email_not_found",
        "bounced",
      ],
      prospect_tier: [
        "competitor_backlink",
        "unlinked_mention",
        "listicle_roundup",
        "resource_page_inclusion",
        "user_submitted",
        "broken_link_building",
      ],
      route_log_status: ["running", "success", "error"],
      run_status: ["pending", "running", "completed", "failed"],
      tracked_link_change_type: [
        "link_removed",
        "link_restored",
        "rel_added",
        "rel_removed",
        "anchor_changed",
        "target_url_changed",
        "target_now_competitor",
        "source_page_dead",
        "source_page_recovered",
        "source_page_redirected",
        "check_failed_persistent",
      ],
      tracked_link_status: [
        "pending",
        "live",
        "nofollow",
        "target_changed",
        "removed",
        "page_dead",
        "check_failed",
      ],
    },
  },
} as const
