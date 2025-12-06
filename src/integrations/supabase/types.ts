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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          availability_end: string | null
          availability_start: string | null
          classroom_id: string
          content: Json | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_locked: boolean | null
          title: string
          updated_at: string | null
          visible_when_locked: boolean | null
          xp_reward: number | null
        }
        Insert: {
          activity_type: string
          availability_end?: string | null
          availability_start?: string | null
          classroom_id: string
          content?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_locked?: boolean | null
          title: string
          updated_at?: string | null
          visible_when_locked?: boolean | null
          xp_reward?: number | null
        }
        Update: {
          activity_type?: string
          availability_end?: string | null
          availability_start?: string | null
          classroom_id?: string
          content?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_locked?: boolean | null
          title?: string
          updated_at?: string | null
          visible_when_locked?: boolean | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_completions: {
        Row: {
          activity_id: string
          classroom_id: string
          completed_at: string | null
          id: string
          score: number | null
          student_id: string
          time_taken_seconds: number | null
        }
        Insert: {
          activity_id: string
          classroom_id: string
          completed_at?: string | null
          id?: string
          score?: number | null
          student_id: string
          time_taken_seconds?: number | null
        }
        Update: {
          activity_id?: string
          classroom_id?: string
          completed_at?: string | null
          id?: string
          score?: number | null
          student_id?: string
          time_taken_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_completions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_completions_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          content: string | null
          feedback: string | null
          file_url: string | null
          graded_at: string | null
          id: string
          score: number | null
          student_id: string
          submitted_at: string | null
          time_taken_seconds: number | null
        }
        Insert: {
          assignment_id: string
          content?: string | null
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          id?: string
          score?: number | null
          student_id: string
          submitted_at?: string | null
          time_taken_seconds?: number | null
        }
        Update: {
          assignment_id?: string
          content?: string | null
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          id?: string
          score?: number | null
          student_id?: string
          submitted_at?: string | null
          time_taken_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          classroom_id: string
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          property_type: string | null
          title: string
          updated_at: string | null
          xp_reward: number | null
        }
        Insert: {
          classroom_id: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          property_type?: string | null
          title: string
          updated_at?: string | null
          xp_reward?: number | null
        }
        Update: {
          classroom_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          property_type?: string | null
          title?: string
          updated_at?: string | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          badge_type: Database["public"]["Enums"]["badge_type"]
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          xp_required: number | null
        }
        Insert: {
          badge_type: Database["public"]["Enums"]["badge_type"]
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          xp_required?: number | null
        }
        Update: {
          badge_type?: Database["public"]["Enums"]["badge_type"]
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          xp_required?: number | null
        }
        Relationships: []
      }
      classroom_members: {
        Row: {
          classroom_id: string
          id: string
          joined_at: string | null
          student_id: string
        }
        Insert: {
          classroom_id: string
          id?: string
          joined_at?: string | null
          student_id: string
        }
        Update: {
          classroom_id?: string
          id?: string
          joined_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_members_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          code: string
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          code: string
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classrooms_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classrooms_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_completions: {
        Row: {
          classroom_id: string
          completed_at: string | null
          id: string
          lesson_id: string
          student_id: string
        }
        Insert: {
          classroom_id: string
          completed_at?: string | null
          id?: string
          lesson_id: string
          student_id: string
        }
        Update: {
          classroom_id?: string
          completed_at?: string | null
          id?: string
          lesson_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_completions_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          availability_end: string | null
          availability_start: string | null
          classroom_id: string
          content: string | null
          created_at: string | null
          description: string | null
          file_url: string | null
          id: string
          image_url: string | null
          is_locked: boolean | null
          order_index: number | null
          property_type: string | null
          title: string
          updated_at: string | null
          video_url: string | null
          visible_when_locked: boolean | null
        }
        Insert: {
          availability_end?: string | null
          availability_start?: string | null
          classroom_id: string
          content?: string | null
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_locked?: boolean | null
          order_index?: number | null
          property_type?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
          visible_when_locked?: boolean | null
        }
        Update: {
          availability_end?: string | null
          availability_start?: string | null
          classroom_id?: string
          content?: string | null
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_locked?: boolean | null
          order_index?: number | null
          property_type?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
          visible_when_locked?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          level: number | null
          role: Database["public"]["Enums"]["user_role"] | null
          school_id: string | null
          streak_days: number | null
          updated_at: string | null
          username: string | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          gender?: string | null
          id: string
          last_name?: string | null
          level?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          school_id?: string | null
          streak_days?: number | null
          updated_at?: string | null
          username?: string | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          level?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          school_id?: string | null
          streak_days?: number | null
          updated_at?: string | null
          username?: string | null
          xp?: number | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          id: string
          quiz_id: string
          score: number
          student_id: string
          time_taken_seconds: number | null
          total_questions: number
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          id?: string
          quiz_id: string
          score: number
          student_id: string
          time_taken_seconds?: number | null
          total_questions: number
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          id?: string
          quiz_id?: string
          score?: number
          student_id?: string
          time_taken_seconds?: number | null
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          explanation: string | null
          id: string
          options: Json
          order_index: number | null
          question_text: string
          quiz_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          options: Json
          order_index?: number | null
          question_text: string
          quiz_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          options?: Json
          order_index?: number | null
          question_text?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          availability_end: string | null
          availability_start: string | null
          classroom_id: string
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_locked: boolean | null
          max_attempts: number | null
          passing_score: number | null
          property_type: string | null
          title: string
          total_questions: number | null
          updated_at: string | null
          visible_when_locked: boolean | null
          xp_reward: number | null
        }
        Insert: {
          availability_end?: string | null
          availability_start?: string | null
          classroom_id: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_locked?: boolean | null
          max_attempts?: number | null
          passing_score?: number | null
          property_type?: string | null
          title: string
          total_questions?: number | null
          updated_at?: string | null
          visible_when_locked?: boolean | null
          xp_reward?: number | null
        }
        Update: {
          availability_end?: string | null
          availability_start?: string | null
          classroom_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_locked?: boolean | null
          max_attempts?: number | null
          passing_score?: number | null
          property_type?: string | null
          title?: string
          total_questions?: number | null
          updated_at?: string | null
          visible_when_locked?: boolean | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_content: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          shared_at: string | null
          shared_by: string
          source_classroom_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          shared_at?: string | null
          shared_by: string
          source_classroom_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          shared_at?: string | null
          shared_by?: string
          source_classroom_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_content_source_classroom_id_fkey"
            columns: ["source_classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_content_destinations: {
        Row: {
          created_at: string | null
          destination_classroom_id: string
          id: string
          shared_content_id: string
        }
        Insert: {
          created_at?: string | null
          destination_classroom_id: string
          id?: string
          shared_content_id: string
        }
        Update: {
          created_at?: string | null
          destination_classroom_id?: string
          id?: string
          shared_content_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_content_destinations_destination_classroom_id_fkey"
            columns: ["destination_classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_content_destinations_shared_content_id_fkey"
            columns: ["shared_content_id"]
            isOneToOne: false
            referencedRelation: "shared_content"
            referencedColumns: ["id"]
          },
        ]
      }
      story_progress: {
        Row: {
          badge_unlocked: boolean
          completed_at: string | null
          created_at: string | null
          id: string
          level_number: number
          planet_name: string
          stars_earned: number
          student_id: string
          time_taken_seconds: number | null
        }
        Insert: {
          badge_unlocked?: boolean
          completed_at?: string | null
          created_at?: string | null
          id?: string
          level_number: number
          planet_name: string
          stars_earned?: number
          student_id: string
          time_taken_seconds?: number | null
        }
        Update: {
          badge_unlocked?: boolean
          completed_at?: string | null
          created_at?: string | null
          id?: string
          level_number?: number
          planet_name?: string
          stars_earned?: number
          student_id?: string
          time_taken_seconds?: number | null
        }
        Relationships: []
      }
      student_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          student_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          student_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_badges_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_badges_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      student_scores: {
        Row: {
          activity_id: string
          activity_title: string
          activity_type: string
          classroom_id: string
          created_at: string | null
          date_submitted: string | null
          id: string
          max_score: number
          percentage: number | null
          score: number
          student_id: string
        }
        Insert: {
          activity_id: string
          activity_title: string
          activity_type: string
          classroom_id: string
          created_at?: string | null
          date_submitted?: string | null
          id?: string
          max_score: number
          percentage?: number | null
          score: number
          student_id: string
        }
        Update: {
          activity_id?: string
          activity_title?: string
          activity_type?: string
          classroom_id?: string
          created_at?: string | null
          date_submitted?: string | null
          id?: string
          max_score?: number
          percentage?: number | null
          score?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_scores_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_scores_student_id_profiles_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_scores_student_id_profiles_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      student_leaderboard: {
        Row: {
          avatar_url: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          level: number | null
          story_levels_completed: number | null
          total_stars: number | null
          username: string | null
          xp: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "teacher" | "student" | "admin"
      badge_type:
        | "commutative"
        | "associative"
        | "distributive"
        | "identity"
        | "zero"
        | "special"
      user_role: "teacher" | "student"
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
      app_role: ["teacher", "student", "admin"],
      badge_type: [
        "commutative",
        "associative",
        "distributive",
        "identity",
        "zero",
        "special",
      ],
      user_role: ["teacher", "student"],
    },
  },
} as const
