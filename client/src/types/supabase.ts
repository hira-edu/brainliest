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
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          comment_text: string
          created_at: string | null
          id: number
          question_id: number
          user_id: number
        }
        Insert: {
          comment_text: string
          created_at?: string | null
          id?: number
          question_id: number
          user_id: number
        }
        Update: {
          comment_text?: string
          created_at?: string | null
          id?: number
          question_id?: number
          user_id?: number
        }
        Relationships: []
      }
      detailed_answers: {
        Row: {
          answered_at: string | null
          created_at: string | null
          difficulty: string | null
          domain: string | null
          id: number
          is_correct: boolean
          question_id: number
          session_id: number | null
          updated_at: string | null
          user_answer: string
        }
        Insert: {
          answered_at?: string | null
          created_at?: string | null
          difficulty?: string | null
          domain?: string | null
          id?: number
          is_correct: boolean
          question_id: number
          session_id?: number | null
          updated_at?: string | null
          user_answer: string
        }
        Update: {
          answered_at?: string | null
          created_at?: string | null
          difficulty?: string | null
          domain?: string | null
          id?: number
          is_correct?: boolean
          question_id?: number
          session_id?: number | null
          updated_at?: string | null
          user_answer?: string
        }
        Relationships: [
          {
            foreignKeyName: "detailed_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_analytics: {
        Row: {
          analysis_date: string | null
          completed_at: string | null
          created_at: string | null
          exam_id: number
          id: number
          score: number
          session_id: number | null
          updated_at: string | null
          user_id: number
        }
        Insert: {
          analysis_date?: string | null
          completed_at?: string | null
          created_at?: string | null
          exam_id: number
          id?: number
          score: number
          session_id?: number | null
          updated_at?: string | null
          user_id: number
        }
        Update: {
          analysis_date?: string | null
          completed_at?: string | null
          created_at?: string | null
          exam_id?: number
          id?: number
          score?: number
          session_id?: number | null
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_analytics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty"]
          duration: number | null
          icon: string | null
          is_active: boolean | null
          question_count: number
          slug: string
          subject_slug: string
          title: string
        }
        Insert: {
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty"]
          duration?: number | null
          icon?: string | null
          is_active?: boolean | null
          question_count: number
          slug: string
          subject_slug: string
          title: string
        }
        Update: {
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty"]
          duration?: number | null
          icon?: string | null
          is_active?: boolean | null
          question_count?: number
          slug?: string
          subject_slug?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_subject_slug_fkey"
            columns: ["subject_slug"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["slug"]
          },
        ]
      }
      performance_trends: {
        Row: {
          created_at: string | null
          id: number
          subject_slug: string | null
          trend_data: Json
          updated_at: string | null
          user_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          subject_slug?: string | null
          trend_data: Json
          updated_at?: string | null
          user_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          subject_slug?: string | null
          trend_data?: Json
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "performance_trends_subject_slug_fkey"
            columns: ["subject_slug"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["slug"]
          },
        ]
      }
      question_analytics: {
        Row: {
          accuracy_rate: number | null
          average_time_seconds: number | null
          correct_attempts: number | null
          hint_usage_rate: number | null
          id: number
          last_updated: string | null
          question_id: number | null
          skip_rate: number | null
          total_attempts: number | null
        }
        Insert: {
          accuracy_rate?: number | null
          average_time_seconds?: number | null
          correct_attempts?: number | null
          hint_usage_rate?: number | null
          id?: number
          last_updated?: string | null
          question_id?: number | null
          skip_rate?: number | null
          total_attempts?: number | null
        }
        Update: {
          accuracy_rate?: number | null
          average_time_seconds?: number | null
          correct_attempts?: number | null
          hint_usage_rate?: number | null
          id?: number
          last_updated?: string | null
          question_id?: number | null
          skip_rate?: number | null
          total_attempts?: number | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          allow_multiple_answers: boolean | null
          correct_answer: number
          correct_answers: number[] | null
          difficulty: Database["public"]["Enums"]["difficulty"] | null
          domain: string | null
          exam_slug: string
          explanation: string | null
          id: number
          options: string[]
          order: number | null
          subject_slug: string
          text: string
        }
        Insert: {
          allow_multiple_answers?: boolean | null
          correct_answer?: number
          correct_answers?: number[] | null
          difficulty?: Database["public"]["Enums"]["difficulty"] | null
          domain?: string | null
          exam_slug: string
          explanation?: string | null
          id?: number
          options?: string[]
          order?: number | null
          subject_slug: string
          text: string
        }
        Update: {
          allow_multiple_answers?: boolean | null
          correct_answer?: number
          correct_answers?: number[] | null
          difficulty?: Database["public"]["Enums"]["difficulty"] | null
          domain?: string | null
          exam_slug?: string
          explanation?: string | null
          id?: number
          options?: string[]
          order?: number | null
          subject_slug?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_exam_slug_fkey"
            columns: ["exam_slug"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "questions_subject_slug_fkey"
            columns: ["subject_slug"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["slug"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_slug: string
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          category_slug: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          category_slug?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
        ]
      }
      subject_popularity: {
        Row: {
          avg_session_duration: number | null
          bounce_rate: number | null
          date: string
          exam_completions: number | null
          exam_starts: number | null
          id: number
          subject_slug: string | null
          unique_users: number | null
          view_count: number | null
        }
        Insert: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          date: string
          exam_completions?: number | null
          exam_starts?: number | null
          id?: number
          subject_slug?: string | null
          unique_users?: number | null
          view_count?: number | null
        }
        Update: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          date?: string
          exam_completions?: number | null
          exam_starts?: number | null
          id?: number
          subject_slug?: string | null
          unique_users?: number | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subject_popularity_subject_slug_fkey"
            columns: ["subject_slug"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["slug"]
          },
        ]
      }
      subject_trending_stats: {
        Row: {
          date: string | null
          id: number
          subject_slug: string | null
          trending_score: number
          updated_at: string | null
        }
        Insert: {
          date?: string | null
          id?: number
          subject_slug?: string | null
          trending_score: number
          updated_at?: string | null
        }
        Update: {
          date?: string | null
          id?: number
          subject_slug?: string | null
          trending_score?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subject_trending_stats_subject_slug_fkey"
            columns: ["subject_slug"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["slug"]
          },
        ]
      }
      subjects: {
        Row: {
          category_slug: string | null
          color: string | null
          description: string | null
          exam_count: number | null
          icon: string | null
          name: string
          question_count: number | null
          slug: string
          subcategory_slug: string | null
        }
        Insert: {
          category_slug?: string | null
          color?: string | null
          description?: string | null
          exam_count?: number | null
          icon?: string | null
          name: string
          question_count?: number | null
          slug: string
          subcategory_slug?: string | null
        }
        Update: {
          category_slug?: string | null
          color?: string | null
          description?: string | null
          exam_count?: number | null
          icon?: string | null
          name?: string
          question_count?: number | null
          slug?: string
          subcategory_slug?: string | null
        }
        Relationships: []
      }
      user_learning_paths: {
        Row: {
          completed_at: string | null
          completion_percentage: number | null
          created_at: string | null
          current_step: number | null
          difficulty_preference: string | null
          estimated_completion_time: number | null
          id: number
          learning_style: string | null
          path_data: Json | null
          path_type: string
          subject_slug: string | null
          total_steps: number
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          current_step?: number | null
          difficulty_preference?: string | null
          estimated_completion_time?: number | null
          id?: number
          learning_style?: string | null
          path_data?: Json | null
          path_type: string
          subject_slug?: string | null
          total_steps: number
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          current_step?: number | null
          difficulty_preference?: string | null
          estimated_completion_time?: number | null
          id?: number
          learning_style?: string | null
          path_data?: Json | null
          path_type?: string
          subject_slug?: string | null
          total_steps?: number
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_learning_paths_subject_slug_fkey"
            columns: ["subject_slug"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["slug"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          exam_id: number
          id: number
          session_data: Json
          updated_at: string | null
          user_id: number
        }
        Insert: {
          created_at?: string | null
          exam_id: number
          id?: number
          session_data: Json
          updated_at?: string | null
          user_id: number
        }
        Update: {
          created_at?: string | null
          exam_id?: number
          id?: number
          session_data?: Json
          updated_at?: string | null
          user_id?: number
        }
        Relationships: []
      }
      user_subject_interactions: {
        Row: {
          id: number
          interaction_type: string
          subject_slug: string | null
          timestamp: string | null
          user_id: number
        }
        Insert: {
          id?: number
          interaction_type: string
          subject_slug?: string | null
          timestamp?: string | null
          user_id: number
        }
        Update: {
          id?: number
          interaction_type?: string
          subject_slug?: string | null
          timestamp?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_subject_interactions_subject_slug_fkey"
            columns: ["subject_slug"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["slug"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      anonymize_user_data: {
        Args: { user_id_param: number }
        Returns: boolean
      }
      check_user_permission: {
        Args: {
          user_id_param: number
          resource_type_param: string
          permission_type_param: string
          resource_id_param?: number
        }
        Returns: boolean
      }
      create_audit_log_partition: {
        Args: { partition_date: string }
        Returns: boolean
      }
      decrypt_sensitive_data: {
        Args: { encrypted_data: string; key_id?: string }
        Returns: string
      }
      encrypt_sensitive_data: {
        Args: { data: string; key_id?: string }
        Returns: string
      }
      enforce_data_retention: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      run_daily_compliance_tasks: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search_questions: {
        Args: { search_query: string; limit_count?: number }
        Returns: {
          id: number
          question_text: string
          subject_name: string
          exam_title: string
          difficulty: string
          domain: string
          rank: number
        }[]
      }
      search_subjects: {
        Args: { search_query: string; limit_count?: number }
        Returns: {
          id: number
          slug: string
          name: string
          description: string
          exam_count: number
          question_count: number
          rank: number
        }[]
      }
    }
    Enums: {
      difficulty: "Beginner" | "Intermediate" | "Advanced"
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
      difficulty: ["Beginner", "Intermediate", "Advanced"],
    },
  },
} as const
