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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_key: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_key: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_key?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      answer_submissions: {
        Row: {
          answer_image_url: string | null
          answer_text: string | null
          created_at: string
          evaluated_at: string | null
          format_suggestions: string | null
          id: string
          improvements: Json | null
          max_score: number | null
          model_comparison: string | null
          overall_feedback: string | null
          paragraph_analysis: Json | null
          question_id: string | null
          score: number | null
          status: string
          strengths: Json | null
          submission_type: string
          user_id: string
        }
        Insert: {
          answer_image_url?: string | null
          answer_text?: string | null
          created_at?: string
          evaluated_at?: string | null
          format_suggestions?: string | null
          id?: string
          improvements?: Json | null
          max_score?: number | null
          model_comparison?: string | null
          overall_feedback?: string | null
          paragraph_analysis?: Json | null
          question_id?: string | null
          score?: number | null
          status?: string
          strengths?: Json | null
          submission_type?: string
          user_id: string
        }
        Update: {
          answer_image_url?: string | null
          answer_text?: string | null
          created_at?: string
          evaluated_at?: string | null
          format_suggestions?: string | null
          id?: string
          improvements?: Json | null
          max_score?: number | null
          model_comparison?: string | null
          overall_feedback?: string | null
          paragraph_analysis?: Json | null
          question_id?: string | null
          score?: number | null
          status?: string
          strengths?: Json | null
          submission_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_submissions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "practice_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_practice_streaks: {
        Row: {
          created_at: string
          current_streak: number
          freeze_count: number
          id: string
          last_practice_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          freeze_count?: number
          id?: string
          last_practice_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          freeze_count?: number
          id?: string
          last_practice_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_report_preferences: {
        Row: {
          created_at: string
          email: string
          frequency: string
          id: string
          is_enabled: boolean
          last_sent_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          frequency?: string
          id?: string
          is_enabled?: boolean
          last_sent_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          frequency?: string
          id?: string
          is_enabled?: boolean
          last_sent_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exam_papers: {
        Row: {
          created_at: string
          exam_type: string
          id: string
          raw_text: string
          status: string
          syllabus_id: string | null
          title: string
          updated_at: string
          user_id: string
          year: number | null
        }
        Insert: {
          created_at?: string
          exam_type: string
          id?: string
          raw_text: string
          status?: string
          syllabus_id?: string | null
          title: string
          updated_at?: string
          user_id: string
          year?: number | null
        }
        Update: {
          created_at?: string
          exam_type?: string
          id?: string
          raw_text?: string
          status?: string
          syllabus_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_papers_syllabus_id_fkey"
            columns: ["syllabus_id"]
            isOneToOne: false
            referencedRelation: "syllabi"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_tests: {
        Row: {
          created_at: string
          description: string | null
          exam_type: string
          id: string
          is_template: boolean
          subject: string | null
          time_limit_minutes: number | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          exam_type?: string
          id?: string
          is_template?: boolean
          subject?: string | null
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          exam_type?: string
          id?: string
          is_template?: boolean
          subject?: string | null
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      practice_questions: {
        Row: {
          created_at: string
          id: string
          key_points: Json | null
          max_marks: number
          mock_test_id: string | null
          model_answer: string | null
          question_text: string
          question_type: string
          subject: string | null
          topic: string | null
          updated_at: string
          user_id: string | null
          word_limit: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          key_points?: Json | null
          max_marks?: number
          mock_test_id?: string | null
          model_answer?: string | null
          question_text: string
          question_type?: string
          subject?: string | null
          topic?: string | null
          updated_at?: string
          user_id?: string | null
          word_limit?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          key_points?: Json | null
          max_marks?: number
          mock_test_id?: string | null
          model_answer?: string | null
          question_text?: string
          question_type?: string
          subject?: string | null
          topic?: string | null
          updated_at?: string
          user_id?: string | null
          word_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_questions_mock_test_id_fkey"
            columns: ["mock_test_id"]
            isOneToOne: false
            referencedRelation: "mock_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          institution_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          institution_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          institution_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          created_at: string
          difficulty: string | null
          id: string
          importance_explanation: string | null
          is_analyzed: boolean
          paper_id: string
          question_number: number | null
          question_text: string
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty?: string | null
          id?: string
          importance_explanation?: string | null
          is_analyzed?: boolean
          paper_id: string
          question_number?: number | null
          question_text: string
          topic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty?: string | null
          id?: string
          importance_explanation?: string | null
          is_analyzed?: boolean
          paper_id?: string
          question_number?: number | null
          question_text?: string
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "exam_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabi: {
        Row: {
          created_at: string
          description: string | null
          exam_type: string
          id: string
          is_template: boolean
          name: string
          topics: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          exam_type: string
          id?: string
          is_template?: boolean
          name: string
          topics?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          exam_type?: string
          id?: string
          is_template?: boolean
          name?: string
          topics?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_achievements: {
        Args: { p_user_id: string }
        Returns: {
          achievement_key: string
          newly_unlocked: boolean
        }[]
      }
      get_leaderboard: {
        Args: never
        Returns: {
          display_name: string
          percentage: number
          rank: number
          tests_completed: number
          total_max_score: number
          total_score: number
          user_id: string
        }[]
      }
      get_user_achievements: {
        Args: { p_user_id: string }
        Returns: {
          achievement_key: string
          unlocked_at: string
        }[]
      }
      get_user_rank: {
        Args: { p_user_id: string }
        Returns: {
          rank: number
          total_users: number
        }[]
      }
      get_user_streak: {
        Args: { p_user_id: string }
        Returns: {
          current_streak: number
          freeze_count: number
          last_practice_date: string
          longest_streak: number
          practiced_today: boolean
          streak_at_risk: boolean
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recover_streak: {
        Args: { p_days_to_recover?: number; p_user_id: string }
        Returns: {
          freezes_remaining: number
          freezes_used: number
          message: string
          new_streak: number
          success: boolean
        }[]
      }
      update_practice_streak: {
        Args: { p_user_id: string }
        Returns: {
          current_streak: number
          longest_streak: number
          streak_extended: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "analyst" | "viewer"
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
      app_role: ["admin", "analyst", "viewer"],
    },
  },
} as const
