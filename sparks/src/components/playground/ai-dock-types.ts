import { LucideIcon } from 'lucide-react';
import { 
  Wand2, 
  Sparkles, 
  ClipboardCheck, 
  BarChart2, 
  Lightbulb, 
  Mic,
  // Modern pack icons
  Zap,
  Star,
  Layers,
  TrendingUp,
  Brain,
  Volume2
} from 'lucide-react';

// Updated icon pack definitions
export type IconPackType = 'default' | 'modern';

export interface IconPack {
  id: IconPackType;
  name: string;
  description: string;
  preview: string; // Emoji for quick preview
  icons: {
    enhance: LucideIcon;
    clean: LucideIcon;
    organize: LucideIcon;
    analyze: LucideIcon;
    suggest: LucideIcon;
    tts: LucideIcon;
  };
}

// Available icon packs
export const ICON_PACKS: Record<IconPackType, IconPack> = {
  default: {
    id: 'default',
    name: 'Default',
    description: 'Classic icons with clean design',
    preview: '🎯',
    icons: {
      enhance: Wand2,
      clean: Sparkles,
      organize: ClipboardCheck,
      analyze: BarChart2,
      suggest: Lightbulb,
      tts: Mic
    }
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary icons with bold design',
    preview: '⚡',
    icons: {
      enhance: Zap,
      clean: Star,
      organize: Layers,
      analyze: TrendingUp,
      suggest: Brain,
      tts: Volume2
    }
  }
};

// Color definitions
export interface ToolColor {
  r: number;
  g: number;
  b: number;
}

export interface ToolColorConfig {
  enhance: ToolColor;
  clean: ToolColor;
  organize: ToolColor;
  analyze: ToolColor;
  suggest: ToolColor;
  tts: ToolColor;
}

// Default color scheme matching existing accent colors
export const DEFAULT_TOOL_COLORS: ToolColorConfig = {
  enhance: { r: 191, g: 77, b: 20 },    // Primary brand color
  clean: { r: 242, g: 123, b: 19 },    // Orange variant
  organize: { r: 242, g: 228, b: 155 }, // Light yellow
  analyze: { r: 115, g: 12, b: 2 },    // Dark red
  suggest: { r: 64, g: 1, b: 1 },      // Very dark red
  tts: { r: 191, g: 38, b: 4 }         // Red variant
};

// Tool group definitions
export interface ToolGroup {
  id: string;
  name: string;
  description: string;
  color: ToolColor;
  icon: LucideIcon;
  collapsed: boolean;
  order: number;
  tools: string[]; // Array of tool IDs
}

// Tool configuration
export interface ToolConfig {
  id: string;
  description: string;
  enabled: boolean;
  color: ToolColor;
  customColor?: ToolColor;
  groupId?: string; // Optional group assignment
  order: number; // Order within group or globally
}

// AI Dock Tools settings
export interface DockTheme {
  magnificationEnabled?: boolean;
  magnification?: number;
  effectWidth?: number;
  animationDuration?: string;
  animationEasing?: string;
  particlesEnabled?: boolean;
  particleCount?: number;
}

export const DEFAULT_DOCK_THEME: DockTheme = {
  magnificationEnabled: true,
  magnification: 1.6,
  effectWidth: 200,
  animationDuration: '0.35',
  animationEasing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  particlesEnabled: true,
  particleCount: 12
};

export interface AIDockSettings {
  iconPack: IconPackType;
  colors: ToolColorConfig;
  tools: Record<string, ToolConfig>;
  groups: Record<string, ToolGroup>;
  showLabels: boolean;
  compactMode: boolean;
  animationsEnabled: boolean;
  hoverEffects: boolean;
  groupingEnabled: boolean;
  dragAndDropEnabled: boolean;
  theme?: DockTheme;
  lastUpdated: string;
}

// DockTheme interface and constant definitions
// DockTheme interface and DEFAULT_DOCK_THEME moved above to resolve temporal dead zone

// Default tool groups

export const DEFAULT_TOOL_GROUPS: Record<string, ToolGroup> = {
  'content-enhancement': {
    id: 'content-enhancement',
    name: 'Content Enhancement',
    description: 'Tools for improving and refining content',
    color: { r: 191, g: 77, b: 20 },
    icon: Wand2,
    collapsed: false,
    order: 1,
    tools: ['enhance', 'clean']
  },
  'analysis-organization': {
    id: 'analysis-organization',
    name: 'Analysis & Organization',
    description: 'Tools for analyzing and organizing content',
    color: { r: 115, g: 12, b: 2 },
    icon: BarChart2,
    collapsed: false,
    order: 2,
    tools: ['analyze', 'organize']
  },
  'creative-assistance': {
    id: 'creative-assistance',
    name: 'Creative Assistance',
    description: 'Tools for creative and interactive features',
    color: { r: 242, g: 123, b: 19 },
    icon: Lightbulb,
    collapsed: false,
    order: 3,
    tools: ['suggest', 'tts']
  }
};

// Default settings
export const DEFAULT_AI_DOCK_SETTINGS: AIDockSettings = {
  iconPack: 'default',
  colors: DEFAULT_TOOL_COLORS,
  tools: {
    enhance: {
      id: 'enhance',
      description: 'Enhance',
      enabled: true,
      color: DEFAULT_TOOL_COLORS.enhance,
      groupId: 'content-enhancement',
      order: 1
    },
    clean: {
      id: 'clean',
      description: 'Clean',
      enabled: true,
      color: DEFAULT_TOOL_COLORS.clean,
      groupId: 'content-enhancement',
      order: 2
    },
    organize: {
      id: 'organize',
      description: 'Organize',
      enabled: true,
      color: DEFAULT_TOOL_COLORS.organize,
      groupId: 'analysis-organization',
      order: 2
    },
    analyze: {
      id: 'analyze',
      description: 'Analyze',
      enabled: true,
      color: DEFAULT_TOOL_COLORS.analyze,
      groupId: 'analysis-organization',
      order: 1
    },
    suggest: {
      id: 'suggest',
      description: 'Suggest',
      enabled: true,
      color: DEFAULT_TOOL_COLORS.suggest,
      groupId: 'creative-assistance',
      order: 1
    },
    tts: {
      id: 'tts',
      description: 'Speak',
      enabled: true,
      color: DEFAULT_TOOL_COLORS.tts,
      groupId: 'creative-assistance',
      order: 2
    }
  },
  groups: DEFAULT_TOOL_GROUPS,
  showLabels: true,
  compactMode: false,
  animationsEnabled: true,
  hoverEffects: true,
  groupingEnabled: true,
  dragAndDropEnabled: true,
  theme: DEFAULT_DOCK_THEME,
  lastUpdated: new Date().toISOString()
};

// Settings export/import types
export interface SettingsExport {
  version: string;
  timestamp: string;
  settings: AIDockSettings;
  metadata: {
    appVersion: string;
    userAgent: string;
    exportedBy: string;
  };
}

// Cloud backup types
export interface CloudBackup {
  id: string;
  userId: string;
  settings: AIDockSettings;
  createdAt: string;
  updatedAt: string;
  name: string;
  description?: string;
}

// Group management types
export interface GroupManagementActions {
  createGroup: (group: Omit<ToolGroup, 'id'>) => string;
  updateGroup: (groupId: string, updates: Partial<ToolGroup>) => void;
  deleteGroup: (groupId: string) => void;
  toggleGroupCollapse: (groupId: string) => void;
  moveToolToGroup: (toolId: string, targetGroupId: string | null) => void;
  reorderTools: (groupId: string | null, toolIds: string[]) => void;
  reorderGroups: (groupIds: string[]) => void;
}

// Drag and drop types
export interface DragDropItem {
  type: 'tool' | 'group';
  id: string;
  sourceGroupId?: string;
}

export interface DropZone {
  type: 'group' | 'ungrouped' | 'reorder';
  targetId?: string;
  position?: 'before' | 'after' | 'inside';
}

// Hook return types
export interface UseAIDockSettingsReturn {
  settings: AIDockSettings;
  updateSettings: (updates: Partial<AIDockSettings>) => void;
  updateToolConfig: (toolId: string, config: Partial<ToolConfig>) => void;
  updateToolColor: (toolId: string, color: ToolColor) => void;
  updateIconPack: (iconPack: IconPackType) => void;
  updateTheme: (themeUpdates: Partial<DockTheme>) => void;
  resetTheme: () => void;
  toggleTool: (toolId: string) => void;
  resetToDefaults: () => void;
  exportSettings: () => SettingsExport;
  importSettings: (exported: SettingsExport) => boolean;
  saveToCloud: (name: string, description?: string) => Promise<boolean>;
  loadFromCloud: (backupId: string) => Promise<boolean>;
  groupActions: GroupManagementActions;
  isLoading: boolean;
  error: string | null;
}

// Component prop types
export interface EnhancedToolsDockProps {
  isLoading: string | null;
  onRunTool: (tool: string) => void;
  settings?: AIDockSettings;
  onSettingsChange?: (settings: Partial<AIDockSettings>) => void;
  className?: string;
}

export interface ToolGroupProps {
  group: ToolGroup;
  tools: ToolConfig[];
  iconPack: IconPack;
  isLoading: string | null;
  onRunTool: (toolId: string) => void;
  onToggleTool: (toolId: string) => void;
  onToggleGroup: (groupId: string) => void;
  onDragStart?: (item: DragDropItem) => void;
  onDrop?: (item: DragDropItem, zone: DropZone) => void;
  dragAndDropEnabled: boolean;
  showToggle?: boolean;
  className?: string;
}

export interface UngroupedToolsProps {
  tools: ToolConfig[];
  iconPack: IconPack;
  isLoading: string | null;
  onRunTool: (toolId: string) => void;
  onToggleTool: (toolId: string) => void;
  onDragStart?: (item: DragDropItem) => void;
  onDrop?: (item: DragDropItem, zone: DropZone) => void;
  dragAndDropEnabled: boolean;
  showToggle?: boolean;
  className?: string;
}

export interface ToolButtonProps {
  tool: ToolConfig;
  icon: LucideIcon;
  isLoading: boolean;
  isDisabled: boolean;
  onClick: () => void;
  onToggle?: () => void;
  showToggle?: boolean;
  className?: string;
}

export interface ColorPickerProps {
  color: ToolColor;
  onChange: (color: ToolColor) => void;
  label?: string;
  disabled?: boolean;
}

export interface IconPackSelectorProps {
  selectedPack: IconPackType;
  onPackChange: (pack: IconPackType) => void;
  disabled?: boolean;
}

// Utility functions types
export type ColorToString = (color: ToolColor) => string;
export type StringToColor = (colorString: string) => ToolColor;
export type ValidateSettings = (settings: any) => settings is AIDockSettings;
export type MigrateSettings = (oldSettings: any) => AIDockSettings;

// Animation and theme types
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  background: string;
  foreground: string;
}

// Event types for analytics
export interface AIDockAnalyticsEvent {
  action: 'tool_click' | 'tool_toggle' | 'settings_change' | 'color_change' | 'pack_change';
  toolId?: string;
  oldValue?: any;
  newValue?: any;
  timestamp: string;
  metadata?: Record<string, any>;
}