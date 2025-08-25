// Enhanced Prompt interface with search, versioning, and auto-save support
export interface Prompt {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
  user_id?: string;
  metadata?: Record<string, any>;
  
  // Search and indexing
  searchVector?: string; // For full-text search
  searchKeywords?: string[]; // Extracted keywords for search
  
  // Versioning
  version?: number;
  parentId?: string; // For version history
  isLatest?: boolean;
  versionNotes?: string;
  
  // Auto-save and drafts
  isDraft?: boolean;
  autoSaveId?: string;
  lastAutoSave?: string;
  
  // Enhanced metadata
  wordCount?: number;
  readingTime?: number; // in minutes
  complexity?: 'simple' | 'medium' | 'complex';
  aiGenerated?: boolean;
  sourcePromptId?: string; // If derived from another prompt
}

// Enhanced database types with new tables
export interface Database {
  public: {
    Tables: {
      prompts: {
        Row: Prompt
        Insert: Omit<Prompt, 'id' | 'createdAt'>
        Update: Partial<Omit<Prompt, 'id' | 'createdAt'>>
      }
      prompt_versions: {
        Row: PromptVersion
        Insert: Omit<PromptVersion, 'id' | 'createdAt'>
        Update: Partial<Omit<PromptVersion, 'id' | 'createdAt'>>
      }
      auto_saves: {
        Row: AutoSave
        Insert: Omit<AutoSave, 'id' | 'createdAt'>
        Update: Partial<Omit<AutoSave, 'id' | 'createdAt'>>
      }
      search_index: {
        Row: SearchIndex
        Insert: Omit<SearchIndex, 'id' | 'createdAt'>
        Update: Partial<Omit<SearchIndex, 'id' | 'createdAt'>>
      }
    }
  }
}

// Auth Types
export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

// Version control types
export interface PromptVersion {
  id: string;
  promptId: string;
  version: number;
  title: string;
  content: string;
  changes: VersionChange[];
  createdAt: string;
  createdBy: string;
  versionNotes?: string;
  parentVersionId?: string;
}

export interface VersionChange {
  type: 'add' | 'remove' | 'modify';
  field: string;
  oldValue?: any;
  newValue?: any;
  position?: number;
}

// Auto-save types
export interface AutoSave {
  id: string;
  promptId?: string; // null for new prompts
  userId: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  createdAt: string;
  expiresAt: string;
  metadata?: Record<string, any>;
}

// Search types
export interface SearchIndex {
  id: string;
  promptId: string;
  userId: string;
  title: string;
  content: string;
  category?: string;
  tags: string[];
  keywords: string[];
  searchVector: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchQuery {
  query?: string;
  category?: string;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: 'relevance' | 'date' | 'title' | 'category';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  prompt: Prompt;
  score: number;
  highlights: {
    title?: string[];
    content?: string[];
    tags?: string[];
  };
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: SearchQuery;
  facets: {
    categories: { name: string; count: number }[];
    tags: { name: string; count: number }[];
  };
}

// Auto-save engine types
export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // milliseconds
  maxDrafts: number;
  retentionDays: number;
}

export interface AutoSaveState {
  isDirty: boolean;
  lastSaved: string;
  saveInProgress: boolean;
  error?: string;
}

// Version control types
export interface VersionControlConfig {
  maxVersions: number;
  autoCreateVersions: boolean;
  versionOnMajorChanges: boolean;
  majorChangeThreshold: number; // percentage of content changed
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

// Enhanced response types
export interface SearchApiResponse extends ApiResponse<SearchResponse> {}
export interface VersionApiResponse extends ApiResponse<PromptVersion[]> {}
export interface AutoSaveApiResponse extends ApiResponse<AutoSave> {}
