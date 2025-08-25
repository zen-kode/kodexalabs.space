// Shared types from main application
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
  searchVector?: string;
  searchKeywords?: string[];
  
  // Versioning
  version?: number;
  parentId?: string;
  isLatest?: boolean;
  versionNotes?: string;
  
  // Auto-save and drafts
  isDraft?: boolean;
  autoSaveId?: string;
  lastAutoSave?: string;
  
  // Enhanced metadata
  wordCount?: number;
  readingTime?: number;
  complexity?: 'simple' | 'medium' | 'complex';
  aiGenerated?: boolean;
  sourcePromptId?: string;
}

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: User;
}

// Extension-specific types
export interface CapturedContent {
  text: string;
  url: string;
  title: string;
  timestamp: string;
  selection?: {
    start: number;
    end: number;
    context: string;
  };
}

export interface ExtensionSettings {
  autoSave: boolean;
  defaultCategory: string;
  defaultTags: string[];
  aiProcessing: {
    autoEnhance: boolean;
    autoClean: boolean;
    autoOrganize: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'system';
    compactMode: boolean;
  };
}

export interface ExtensionState {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  settings: ExtensionSettings;
  recentPrompts: Prompt[];
  isLoading: boolean;
  error: string | null;
}

export interface ContextMenuAction {
  id: string;
  title: string;
  icon: string;
  action: 'save' | 'enhance' | 'clean' | 'organize' | 'analyze';
  enabled: boolean;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface SavePromptRequest {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  metadata?: {
    source: 'extension';
    url: string;
    pageTitle: string;
    capturedAt: string;
    selection?: {
      start: number;
      end: number;
      context: string;
    };
  };
}

export interface AIProcessingRequest {
  prompt: string;
  operation: 'enhance' | 'clean' | 'organize' | 'analyze';
  userId: string;
  title?: string;
}

export interface AIProcessingResponse {
  result: any;
  saved: boolean;
  promptId?: string;
  error?: string;
}

// Chrome extension message types
export interface ExtensionMessage {
  type: 'SAVE_PROMPT' | 'AI_PROCESS' | 'GET_AUTH' | 'CONTEXT_MENU_CLICK' | 'CAPTURE_CONTENT';
  payload: any;
  tabId?: number;
}

export interface ExtensionMessageResponse {
  success: boolean;
  data?: any;
  error?: string;
}