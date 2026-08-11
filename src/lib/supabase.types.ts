export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          deleted_at: string | null
          icon: string | null
          id: number
          is_deleted: boolean
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          icon?: string | null
          id?: number
          is_deleted?: boolean
          name: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          icon?: string | null
          id?: number
          is_deleted?: boolean
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      context_menus: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: number
          is_deleted: boolean
          menu_id: string
          menu_name: string
          options: Json
          selection_mode: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: number
          is_deleted?: boolean
          menu_id: string
          menu_name: string
          options?: Json
          selection_mode?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: number
          is_deleted?: boolean
          menu_id?: string
          menu_name?: string
          options?: Json
          selection_mode?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      prompt_memory_context: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_deleted: boolean | null
          key: string
          template_id: string
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          key: string
          template_id?: string
          updated_at?: string
          user_id: string
          value?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          key?: string
          template_id?: string
          updated_at?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      prompts: {
        Row: {
          category_id: number | null
          compiled_payload_jsonb: Json | null
          constraints: Json | null
          context: string | null
          context_menus: Json | null
          created_at: string | null
          deleted_at: string | null
          enabled_menu_ids: Json | null
          few_shot_examples: Json | null
          id: number
          is_deleted: boolean
          language: string
          menus: Json | null
          negative_prompt: Json | null
          output_format: string
          output_schema: Json | null
          prompt_payload_jsonb: Json
          reference_url: string | null
          schema_version: string
          selected_menu_ids: Json | null
          selected_menu_ids_jsonb: Json | null
          selection_payload_jsonb: Json | null
          system_role: string | null
          task: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_id?: number | null
          compiled_payload_jsonb?: Json | null
          constraints?: Json | null
          context?: string | null
          context_menus?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          enabled_menu_ids?: Json | null
          few_shot_examples?: Json | null
          id?: number
          is_deleted?: boolean
          language?: string
          menus?: Json | null
          negative_prompt?: Json | null
          output_format?: string
          output_schema?: Json | null
          prompt_payload_jsonb?: Json
          reference_url?: string | null
          schema_version?: string
          selected_menu_ids?: Json | null
          selected_menu_ids_jsonb?: Json | null
          selection_payload_jsonb?: Json | null
          system_role?: string | null
          task?: string | null
          title: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          category_id?: number | null
          compiled_payload_jsonb?: Json | null
          constraints?: Json | null
          context?: string | null
          context_menus?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          enabled_menu_ids?: Json | null
          few_shot_examples?: Json | null
          id?: number
          is_deleted?: boolean
          language?: string
          menus?: Json | null
          negative_prompt?: Json | null
          output_format?: string
          output_schema?: Json | null
          prompt_payload_jsonb?: Json
          reference_url?: string | null
          schema_version?: string
          selected_menu_ids?: Json | null
          selected_menu_ids_jsonb?: Json | null
          selection_payload_jsonb?: Json | null
          system_role?: string | null
          task?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_estimate: { Args: { query: string }; Returns: number }
      is_valid_compiled_payload: { Args: { payload: Json }; Returns: boolean }
      is_valid_prompt_payload: { Args: { payload: Json }; Returns: boolean }
      is_valid_selection_payload: { Args: { payload: Json }; Returns: boolean }
      json_matches_schema: {
        Args: { instance: Json; schema: Json }
        Returns: boolean
      }
      jsonb_matches_schema: {
        Args: { instance: Json; schema: Json }
        Returns: boolean
      }
      jsonschema_is_valid: { Args: { schema: Json }; Returns: boolean }
      jsonschema_validation_errors: {
        Args: { instance: Json; schema: Json }
        Returns: string[]
      }
    }
    Enums: {
      modo_de_selecao: "unica" | "multipla"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      modo_de_selecao: ["unica", "multipla"],
    },
  },
} as const

