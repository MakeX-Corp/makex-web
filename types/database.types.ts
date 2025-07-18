export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      app_chat_history: {
        Row: {
          app_id: string
          commit_hash: string | null
          content: string
          cost: number | null
          created_at: string
          id: string
          input_tokens_used: number | null
          message_id: string | null
          metadata: Json | null
          model_used: string | null
          output_tokens_used: number | null
          role: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          app_id: string
          commit_hash?: string | null
          content: string
          cost?: number | null
          created_at?: string
          id?: string
          input_tokens_used?: number | null
          message_id?: string | null
          metadata?: Json | null
          model_used?: string | null
          output_tokens_used?: number | null
          role: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          app_id?: string
          commit_hash?: string | null
          content?: string
          cost?: number | null
          created_at?: string
          id?: string
          input_tokens_used?: number | null
          message_id?: string | null
          metadata?: Json | null
          model_used?: string | null
          output_tokens_used?: number | null
          role?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_chat_history_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "user_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_chat_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          app_id: string
          created_at: string
          id: string
          metadata: Json | null
          title: string | null
          user_id: string
          visible: boolean | null
        }
        Insert: {
          app_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          title?: string | null
          user_id: string
          visible?: boolean | null
        }
        Update: {
          app_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          title?: string | null
          user_id?: string
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "user_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      embeddings: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          embedding: string
          id: string
          source: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          embedding: string
          id?: string
          source?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          embedding?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
      mobile_subscriptions: {
        Row: {
          created_at: string
          id: number
          last_transaction_id: string | null
          messages_used_this_period: number | null
          subscription_end: string | null
          subscription_start: string | null
          subscription_status: string | null
          subscription_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          last_transaction_id?: string | null
          messages_used_this_period?: number | null
          subscription_end?: string | null
          subscription_start?: string | null
          subscription_status?: string | null
          subscription_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          last_transaction_id?: string | null
          messages_used_this_period?: number | null
          subscription_end?: string | null
          subscription_start?: string | null
          subscription_status?: string | null
          subscription_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          customer_id: string | null
          id: string
          price_id: string
          quantity: number
          status: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start: string
          customer_id?: string | null
          id: string
          price_id: string
          quantity?: number
          status: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          customer_id?: string | null
          id?: string
          price_id?: string
          quantity?: number
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      url_mappings: {
        Row: {
          app_id: string | null
          app_url: string | null
          created_at: string
          dub_id: string | null
          dub_key: string | null
          id: number
          share_id: string | null
          share_url: string | null
          updated_at: string | null
          web_url: string | null
        }
        Insert: {
          app_id?: string | null
          app_url?: string | null
          created_at?: string
          dub_id?: string | null
          dub_key?: string | null
          id?: number
          share_id?: string | null
          share_url?: string | null
          updated_at?: string | null
          web_url?: string | null
        }
        Update: {
          app_id?: string | null
          app_url?: string | null
          created_at?: string
          dub_id?: string | null
          dub_key?: string | null
          id?: number
          share_id?: string | null
          share_url?: string | null
          updated_at?: string | null
          web_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "url_mappings_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "user_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      user_apps: {
        Row: {
          api_url: string | null
          app_name: string
          app_url: string | null
          convex_dev_url: string | null
          convex_prod_url: string | null
          convex_project_id: string | null
          created_at: string
          display_name: string | null
          git_repo_id: string | null
          id: string
          initial_commit: string | null
          sandbox_id: string | null
          sandbox_status: Database["public"]["Enums"]["sandbox_status"] | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_url?: string | null
          app_name: string
          app_url?: string | null
          convex_dev_url?: string | null
          convex_prod_url?: string | null
          convex_project_id?: string | null
          created_at?: string
          display_name?: string | null
          git_repo_id?: string | null
          id?: string
          initial_commit?: string | null
          sandbox_id?: string | null
          sandbox_status?: Database["public"]["Enums"]["sandbox_status"] | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_url?: string | null
          app_name?: string
          app_url?: string | null
          convex_dev_url?: string | null
          convex_prod_url?: string | null
          convex_project_id?: string | null
          created_at?: string
          display_name?: string | null
          git_repo_id?: string | null
          id?: string
          initial_commit?: string | null
          sandbox_id?: string | null
          sandbox_status?: Database["public"]["Enums"]["sandbox_status"] | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_deployments: {
        Row: {
          app_id: string | null
          app_url: string | null
          created_at: string
          id: string
          metadata: Json | null
          status: Database["public"]["Enums"]["deployment_status"] | null
          type: Database["public"]["Enums"]["deployment"] | null
          user_id: string | null
          web_url: string | null
        }
        Insert: {
          app_id?: string | null
          app_url?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["deployment_status"] | null
          type?: Database["public"]["Enums"]["deployment"] | null
          user_id?: string | null
          web_url?: string | null
        }
        Update: {
          app_id?: string | null
          app_url?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["deployment_status"] | null
          type?: Database["public"]["Enums"]["deployment"] | null
          user_id?: string | null
          web_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_deployments_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "user_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          created_at: string
          device_token: string
          id: number
          last_used_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_token: string
          id?: number
          last_used_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_token?: string
          id?: number
          last_used_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_integrations: {
        Row: {
          access_token: string | null
          created_at: string | null
          id: string
          integration_type: string
          org_id: string | null
          refresh_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          integration_type: string
          org_id?: string | null
          refresh_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          integration_type?: string
          org_id?: string | null
          refresh_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_sandboxes: {
        Row: {
          api_url: string | null
          app_id: string
          app_status: string | null
          app_url: string | null
          id: string
          sandbox_created_at: string | null
          sandbox_id: string | null
          sandbox_provider:
            | Database["public"]["Enums"]["sandbox_provider"]
            | null
          sandbox_status: Database["public"]["Enums"]["sandbox_status"]
          sandbox_updated_at: string | null
          user_id: string | null
        }
        Insert: {
          api_url?: string | null
          app_id: string
          app_status?: string | null
          app_url?: string | null
          id?: string
          sandbox_created_at?: string | null
          sandbox_id?: string | null
          sandbox_provider?:
            | Database["public"]["Enums"]["sandbox_provider"]
            | null
          sandbox_status: Database["public"]["Enums"]["sandbox_status"]
          sandbox_updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          api_url?: string | null
          app_id?: string
          app_status?: string | null
          app_url?: string | null
          id?: string
          sandbox_created_at?: string | null
          sandbox_id?: string | null
          sandbox_provider?:
            | Database["public"]["Enums"]["sandbox_provider"]
            | null
          sandbox_status?: Database["public"]["Enums"]["sandbox_status"]
          sandbox_updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sandboxes_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "user_apps"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      match_embeddings: {
        Args:
          | {
              query_embedding: string
              match_threshold: number
              match_count: number
            }
          | {
              query_embedding: string
              match_threshold: number
              match_count: number
              category_filter: string
            }
        Returns: {
          content: string
          source: string
          category: string
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      deployment: "web" | "eas-update"
      deployment_status: "failed" | "completed" | "uploading"
      sandbox_provider: "e2b" | "daytona"
      sandbox_status:
        | "active"
        | "deleted"
        | "starting"
        | "paused"
        | "resuming"
        | "pausing"
        | "temporary"
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
      deployment: ["web", "eas-update"],
      deployment_status: ["failed", "completed", "uploading"],
      sandbox_provider: ["e2b", "daytona"],
      sandbox_status: [
        "active",
        "deleted",
        "starting",
        "paused",
        "resuming",
        "pausing",
        "temporary",
      ],
    },
  },
} as const
