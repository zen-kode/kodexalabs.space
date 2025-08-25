// Database types matching the main application's Supabase schema

export interface Database {
  public: {
    Tables: {
      prompts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          description: string | null;
          category: string | null;
          tags: string[] | null;
          is_public: boolean;
          is_favorite: boolean;
          version: number;
          metadata: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          description?: string | null;
          category?: string | null;
          tags?: string[] | null;
          is_public?: boolean;
          is_favorite?: boolean;
          version?: number;
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          description?: string | null;
          category?: string | null;
          tags?: string[] | null;
          is_public?: boolean;
          is_favorite?: boolean;
          version?: number;
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      prompt_versions: {
        Row: {
          id: string;
          prompt_id: string;
          version_number: number;
          title: string;
          content: string;
          description: string | null;
          changes_summary: string | null;
          created_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          prompt_id: string;
          version_number: number;
          title: string;
          content: string;
          description?: string | null;
          changes_summary?: string | null;
          created_at?: string;
          created_by: string;
        };
        Update: {
          id?: string;
          prompt_id?: string;
          version_number?: number;
          title?: string;
          content?: string;
          description?: string | null;
          changes_summary?: string | null;
          created_at?: string;
          created_by?: string;
        };
      };
      auto_saves: {
        Row: {
          id: string;
          prompt_id: string;
          content: string;
          title: string;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          prompt_id: string;
          content: string;
          title: string;
          created_at?: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          prompt_id?: string;
          content?: string;
          title?: string;
          created_at?: string;
          expires_at?: string;
        };
      };
      search_index: {
        Row: {
          id: string;
          prompt_id: string;
          content_vector: string | null;
          metadata: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          prompt_id: string;
          content_vector?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          prompt_id?: string;
          content_vector?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          preferences: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          preferences?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          preferences?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper types for easier usage
export type Prompt = Database['public']['Tables']['prompts']['Row'];
export type PromptInsert = Database['public']['Tables']['prompts']['Insert'];
export type PromptUpdate = Database['public']['Tables']['prompts']['Update'];

export type PromptVersion = Database['public']['Tables']['prompt_versions']['Row'];
export type PromptVersionInsert = Database['public']['Tables']['prompt_versions']['Insert'];
export type PromptVersionUpdate = Database['public']['Tables']['prompt_versions']['Update'];

export type AutoSave = Database['public']['Tables']['auto_saves']['Row'];
export type AutoSaveInsert = Database['public']['Tables']['auto_saves']['Insert'];
export type AutoSaveUpdate = Database['public']['Tables']['auto_saves']['Update'];

export type SearchIndex = Database['public']['Tables']['search_index']['Row'];
export type SearchIndexInsert = Database['public']['Tables']['search_index']['Insert'];
export type SearchIndexUpdate = Database['public']['Tables']['search_index']['Update'];

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];