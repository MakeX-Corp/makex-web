export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      invite_codes: {
        Row: {
          code: string | null
          created_at: string
          id: number
          user_id: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: number
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
      user_apps: {
        Row: {
          api_url: string | null
          app_name: string
          app_url: string | null
          created_at: string
          display_name: string | null
          id: string
          initial_commit: string | null
          sandbox_id: string | null
          sandbox_status: Database["public"]["Enums"]["sandbox_status"] | null
          status: string | null
          supabase_project: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_url?: string | null
          app_name: string
          app_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          initial_commit?: string | null
          sandbox_id?: string | null
          sandbox_status?: Database["public"]["Enums"]["sandbox_status"] | null
          status?: string | null
          supabase_project?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_url?: string | null
          app_name?: string
          app_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          initial_commit?: string | null
          sandbox_id?: string | null
          sandbox_status?: Database["public"]["Enums"]["sandbox_status"] | null
          status?: string | null
          supabase_project?: Json | null
          updated_at?: string
          user_id?: string
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
      [_ in never]: never
    }
    Enums: {
      sandbox_status:
        | "active"
        | "deleted"
        | "starting"
        | "paused"
        | "resuming"
        | "pausing"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      sandbox_status: [
        "active",
        "deleted",
        "starting",
        "paused",
        "resuming",
        "pausing",
      ],
    },
  },
} as const
