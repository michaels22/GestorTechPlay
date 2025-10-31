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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      aplicativos: {
        Row: {
          created_at: string | null
          descricao: string
          id: string
          nome: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          descricao: string
          id?: string
          nome: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string
          id?: string
          nome?: string
          user_id?: string | null
        }
        Relationships: []
      }
      asaas_config: {
        Row: {
          api_key_hash: string
          created_at: string
          id: string
          is_configured: boolean
          updated_at: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          api_key_hash: string
          created_at?: string
          id?: string
          is_configured?: boolean
          updated_at?: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          api_key_hash?: string
          created_at?: string
          id?: string
          is_configured?: boolean
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      checkout_config: {
        Row: {
          created_at: string
          credit_card_enabled: boolean
          id: string
          pix_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credit_card_enabled?: boolean
          id?: string
          pix_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credit_card_enabled?: boolean
          id?: string
          pix_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          aniversario: string | null
          app: string | null
          created_at: string | null
          data_venc_app: string | null
          data_vencimento: string | null
          desconto: string | null
          desconto_recorrente: boolean | null
          dispositivo: string | null
          email: string | null
          fatura: string | null
          fixo: boolean | null
          id: string
          indicador: string | null
          key: string | null
          lembretes: boolean | null
          mac: string | null
          mensagem: string | null
          nome: string
          observacao: string | null
          plano: string | null
          produto: string | null
          senha: string | null
          telas: number | null
          user_id: string | null
          usuario: string | null
          whatsapp: string
        }
        Insert: {
          aniversario?: string | null
          app?: string | null
          created_at?: string | null
          data_venc_app?: string | null
          data_vencimento?: string | null
          desconto?: string | null
          desconto_recorrente?: boolean | null
          dispositivo?: string | null
          email?: string | null
          fatura?: string | null
          fixo?: boolean | null
          id?: string
          indicador?: string | null
          key?: string | null
          lembretes?: boolean | null
          mac?: string | null
          mensagem?: string | null
          nome: string
          observacao?: string | null
          plano?: string | null
          produto?: string | null
          senha?: string | null
          telas?: number | null
          user_id?: string | null
          usuario?: string | null
          whatsapp: string
        }
        Update: {
          aniversario?: string | null
          app?: string | null
          created_at?: string | null
          data_venc_app?: string | null
          data_vencimento?: string | null
          desconto?: string | null
          desconto_recorrente?: boolean | null
          dispositivo?: string | null
          email?: string | null
          fatura?: string | null
          fixo?: boolean | null
          id?: string
          indicador?: string | null
          key?: string | null
          lembretes?: boolean | null
          mac?: string | null
          mensagem?: string | null
          nome?: string
          observacao?: string | null
          plano?: string | null
          produto?: string | null
          senha?: string | null
          telas?: number | null
          user_id?: string | null
          usuario?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      mensagens_padroes: {
        Row: {
          aniversario_cliente: string | null
          confirmacao_cliente: string | null
          expiracao_app: string | null
          id: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          aniversario_cliente?: string | null
          confirmacao_cliente?: string | null
          expiracao_app?: string | null
          id?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          aniversario_cliente?: string | null
          confirmacao_cliente?: string | null
          expiracao_app?: string | null
          id?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      planos: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          quantidade: string | null
          tipo: string | null
          user_id: string | null
          valor: string
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          quantidade?: string | null
          tipo?: string | null
          user_id?: string | null
          valor: string
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          quantidade?: string | null
          tipo?: string | null
          user_id?: string | null
          valor?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          configuracoes_iptv: boolean | null
          created_at: string | null
          creditos: string | null
          descricao: string | null
          id: string
          nome: string
          provedor_iptv: string | null
          renovacao_automatica: boolean | null
          user_id: string | null
          valor: string
        }
        Insert: {
          configuracoes_iptv?: boolean | null
          created_at?: string | null
          creditos?: string | null
          descricao?: string | null
          id?: string
          nome: string
          provedor_iptv?: string | null
          renovacao_automatica?: boolean | null
          user_id?: string | null
          valor: string
        }
        Update: {
          configuracoes_iptv?: boolean | null
          created_at?: string | null
          creditos?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          provedor_iptv?: string | null
          renovacao_automatica?: boolean | null
          user_id?: string | null
          valor?: string
        }
        Relationships: []
      }
      templates_cobranca: {
        Row: {
          chave_pix: string | null
          created_at: string | null
          id: string
          incluir_cartao: boolean | null
          incluir_chave_pix: boolean | null
          mensagem: string
          midia_path: string | null
          nome: string
          user_id: string | null
        }
        Insert: {
          chave_pix?: string | null
          created_at?: string | null
          id?: string
          incluir_cartao?: boolean | null
          incluir_chave_pix?: boolean | null
          mensagem: string
          midia_path?: string | null
          nome: string
          user_id?: string | null
        }
        Update: {
          chave_pix?: string | null
          created_at?: string | null
          id?: string
          incluir_cartao?: boolean | null
          incluir_chave_pix?: boolean | null
          mensagem?: string
          midia_path?: string | null
          nome?: string
          user_id?: string | null
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          message: string
          message_id: string | null
          phone: string
          read_at: string | null
          sent_at: string
          session_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message: string
          message_id?: string | null
          phone: string
          read_at?: string | null
          sent_at?: string
          session_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message?: string
          message_id?: string | null
          phone?: string
          read_at?: string | null
          sent_at?: string
          session_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_sessions: {
        Row: {
          created_at: string | null
          device_name: string | null
          id: string
          last_activity: string | null
          phone_number: string | null
          qr_code: string | null
          session_data: Json | null
          session_id: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_name?: string | null
          id?: string
          last_activity?: string | null
          phone_number?: string | null
          qr_code?: string | null
          session_data?: Json | null
          session_id: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_name?: string | null
          id?: string
          last_activity?: string | null
          phone_number?: string | null
          qr_code?: string | null
          session_data?: Json | null
          session_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
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
    Enums: {},
  },
} as const
