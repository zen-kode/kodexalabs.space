'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  AIDockSettings, 
  DEFAULT_AI_DOCK_SETTINGS, 
  ToolConfig, 
  ToolColor, 
  ToolGroup,
  GroupManagementActions,
  SettingsExport,
  CloudBackup,
  UseAIDockSettingsReturn,
  ValidateSettings,
  MigrateSettings,
  IconPackType,
  DockTheme,
  DEFAULT_DOCK_THEME
} from '@/components/playground/ai-dock-types';
import { useAuth } from './use-auth';
import { DatabaseFactory } from '@/lib/database-abstraction';

const STORAGE_KEY = 'ai-dock-settings';
const SETTINGS_VERSION = '1.0.0';

// Validation function
const validateSettings: ValidateSettings = (settings: any): settings is AIDockSettings => {
  if (!settings || typeof settings !== 'object') return false;
  
  const required = ['iconPack', 'colors', 'tools', 'showLabels', 'compactMode', 'animationsEnabled', 'hoverEffects'];
  return required.every(key => key in settings);
};

// Migration function for backward compatibility
const migrateSettings: MigrateSettings = (oldSettings: any): AIDockSettings => {
  if (validateSettings(oldSettings)) {
    // Icon pack is already validated to be 'default' only
    return oldSettings;
  }
  
  // Migrate from older versions or merge with defaults
  const migrated = {
    ...DEFAULT_AI_DOCK_SETTINGS,
    ...oldSettings,
    iconPack: 'default', // Force default icon pack
    lastUpdated: new Date().toISOString()
  };
  
  // Ensure groups exist and tools have proper group assignments
  if (!migrated.groups) {
    migrated.groups = DEFAULT_AI_DOCK_SETTINGS.groups;
  }
  
  // Ensure theme exists with default values
  if (!migrated.theme) {
    migrated.theme = DEFAULT_DOCK_THEME;
  }
  
  // Ensure tools have order and groupId properties
  Object.keys(migrated.tools).forEach(toolId => {
    if (typeof migrated.tools[toolId].order === 'undefined') {
      migrated.tools[toolId].order = DEFAULT_AI_DOCK_SETTINGS.tools[toolId]?.order || 1;
    }
    if (!migrated.tools[toolId].groupId) {
      migrated.tools[toolId].groupId = DEFAULT_AI_DOCK_SETTINGS.tools[toolId]?.groupId;
    }
  });
  
  return migrated;
};

// Utility functions
const colorToString = (color: ToolColor): string => {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
};

const stringToColor = (colorString: string): ToolColor => {
  const match = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3])
    };
  }
  return { r: 191, g: 77, b: 20 }; // Default to primary color
};

export function useAIDockSettings(): UseAIDockSettingsReturn {
  const [settings, setSettings] = useState<AIDockSettings>(DEFAULT_AI_DOCK_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const db = DatabaseFactory.getDatabase();

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const migrated = migrateSettings(parsed);
        setSettings(migrated);
      }
    } catch (err) {
      console.error('Failed to load AI Dock settings:', err);
      setError('Failed to load settings');
    }
  }, []);

  // Save settings to localStorage whenever they change
  const saveToStorage = useCallback((newSettings: AIDockSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (err) {
      console.error('Failed to save AI Dock settings:', err);
      setError('Failed to save settings');
    }
  }, []);

  // Update settings
  const updateSettings = useCallback((updates: Partial<AIDockSettings>) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      saveToStorage(newSettings);
      return newSettings;
    });
    setError(null);
  }, [saveToStorage]);

  // Update specific tool configuration
  const updateToolConfig = useCallback((toolId: string, config: Partial<ToolConfig>) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        tools: {
          ...prev.tools,
          [toolId]: {
            ...prev.tools[toolId],
            ...config
          }
        },
        lastUpdated: new Date().toISOString()
      };
      saveToStorage(newSettings);
      return newSettings;
    });
    setError(null);
  }, [saveToStorage]);

  // Update tool color
  const updateToolColor = useCallback((toolId: string, color: ToolColor) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        colors: {
          ...prev.colors,
          [toolId]: color
        },
        tools: {
          ...prev.tools,
          [toolId]: {
            ...prev.tools[toolId],
            color,
            customColor: color
          }
        },
        lastUpdated: new Date().toISOString()
      };
      saveToStorage(newSettings);
      return newSettings;
    });
    setError(null);
  }, [saveToStorage]);

  // Update icon pack
  const updateIconPack = useCallback((iconPack: IconPackType) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        iconPack,
        lastUpdated: new Date().toISOString()
      };
      saveToStorage(newSettings);
      return newSettings;
    });
    setError(null);
  }, [saveToStorage]);

  // Update theme settings
  const updateTheme = useCallback((themeUpdates: Partial<DockTheme>) => {
    setSettings(prev => {
      const currentTheme = prev.theme || DEFAULT_DOCK_THEME;
      const newTheme = { ...currentTheme, ...themeUpdates };
      const newSettings = {
        ...prev,
        theme: newTheme,
        lastUpdated: new Date().toISOString()
      };
      saveToStorage(newSettings);
      return newSettings;
    });
    setError(null);
  }, [saveToStorage]);

  // Reset theme to defaults
  const resetTheme = useCallback(() => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        theme: DEFAULT_DOCK_THEME,
        lastUpdated: new Date().toISOString()
      };
      saveToStorage(newSettings);
      return newSettings;
    });
    setError(null);
  }, [saveToStorage]);

  // Toggle tool enabled/disabled
  const toggleTool = useCallback((toolId: string) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        tools: {
          ...prev.tools,
          [toolId]: {
            ...prev.tools[toolId],
            enabled: !prev.tools[toolId].enabled
          }
        },
        lastUpdated: new Date().toISOString()
      };
      saveToStorage(newSettings);
      return newSettings;
    });
    setError(null);
  }, [saveToStorage]);

  // Reset to default settings
  const resetToDefaults = useCallback(() => {
    const defaultSettings = {
      ...DEFAULT_AI_DOCK_SETTINGS,
      lastUpdated: new Date().toISOString()
    };
    setSettings(defaultSettings);
    saveToStorage(defaultSettings);
    setError(null);
  }, [saveToStorage]);

  // Export settings
  const exportSettings = useCallback((): SettingsExport => {
    return {
      version: SETTINGS_VERSION,
      timestamp: new Date().toISOString(),
      settings,
      metadata: {
        appVersion: '1.0.0',
        userAgent: navigator.userAgent,
        exportedBy: user?.email || 'anonymous'
      }
    };
  }, [settings, user]);

  // Import settings
  const importSettings = useCallback((exported: SettingsExport): boolean => {
    try {
      if (!exported.settings || !validateSettings(exported.settings)) {
        setError('Invalid settings format');
        return false;
      }
      
      const migratedSettings = migrateSettings(exported.settings);
      setSettings(migratedSettings);
      saveToStorage(migratedSettings);
      setError(null);
      return true;
    } catch (err) {
      console.error('Failed to import settings:', err);
      setError('Failed to import settings');
      return false;
    }
  }, [saveToStorage]);

  // Save to cloud (if user is authenticated)
  const saveToCloud = useCallback(async (name: string, description?: string): Promise<boolean> => {
    if (!user) {
      setError('Must be logged in to save to cloud');
      return false;
    }

    setIsLoading(true);
    try {
      const backup: Omit<CloudBackup, 'id'> = {
        userId: user.id,
        settings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        name,
        description
      };

      // Save to database using the abstraction layer
      const { data, error: dbError } = await db.createPrompt({
        title: `AI Dock Settings: ${name}`,
        content: JSON.stringify(backup),
        category: 'settings',
        tags: ['ai-dock', 'settings', 'backup'],
        user_id: user.id,
        metadata: {
          type: 'ai-dock-settings',
          version: SETTINGS_VERSION,
          name,
          description
        }
      });

      if (dbError) {
        throw new Error(dbError.message || 'Failed to save to cloud');
      }

      setError(null);
      return true;
    } catch (err) {
      console.error('Failed to save to cloud:', err);
      setError(err instanceof Error ? err.message : 'Failed to save to cloud');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, settings, db]);

  // Load from cloud
  const loadFromCloud = useCallback(async (backupId: string): Promise<boolean> => {
    if (!user) {
      setError('Must be logged in to load from cloud');
      return false;
    }

    setIsLoading(true);
    try {
      const { data, error: dbError } = await db.getPromptById(backupId);
      
      if (dbError || !data) {
        throw new Error('Backup not found');
      }

      const backup = JSON.parse(data.content) as CloudBackup;
      
      if (!backup.settings || !validateSettings(backup.settings)) {
        throw new Error('Invalid backup format');
      }

      const migratedSettings = migrateSettings(backup.settings);
      setSettings(migratedSettings);
      saveToStorage(migratedSettings);
      setError(null);
      return true;
    } catch (err) {
      console.error('Failed to load from cloud:', err);
      setError(err instanceof Error ? err.message : 'Failed to load from cloud');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, db, saveToStorage]);

  // Group management actions
  const groupActions: GroupManagementActions = {
    createGroup: useCallback((group: Omit<ToolGroup, 'id'>) => {
      const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newGroup: ToolGroup = {
        ...group,
        id: groupId,
        tools: []
      };
      
      setSettings(prev => {
        const newSettings = {
          ...prev,
          groups: {
            ...prev.groups,
            [groupId]: newGroup
          },
          lastUpdated: new Date().toISOString()
        };
        saveToStorage(newSettings);
        return newSettings;
      });
      
      return groupId;
    }, [saveToStorage]),

    updateGroup: useCallback((groupId: string, updates: Partial<ToolGroup>) => {
      setSettings(prev => {
        const newSettings = {
          ...prev,
          groups: {
            ...prev.groups,
            [groupId]: {
              ...prev.groups[groupId],
              ...updates
            }
          },
          lastUpdated: new Date().toISOString()
        };
        saveToStorage(newSettings);
        return newSettings;
      });
    }, [saveToStorage]),

    deleteGroup: useCallback((groupId: string) => {
      setSettings(prev => {
        const newGroups = { ...prev.groups };
        delete newGroups[groupId];
        
        // Remove group assignment from tools
        const newTools = { ...prev.tools };
        Object.keys(newTools).forEach(toolId => {
          if (newTools[toolId].groupId === groupId) {
            newTools[toolId] = { ...newTools[toolId], groupId: undefined };
          }
        });
        
        const newSettings = {
          ...prev,
          groups: newGroups,
          tools: newTools,
          lastUpdated: new Date().toISOString()
        };
        saveToStorage(newSettings);
        return newSettings;
      });
    }, [saveToStorage]),

    toggleGroupCollapse: useCallback((groupId: string) => {
      setSettings(prev => {
        const newSettings = {
          ...prev,
          groups: {
            ...prev.groups,
            [groupId]: {
              ...prev.groups[groupId],
              collapsed: !prev.groups[groupId].collapsed
            }
          },
          lastUpdated: new Date().toISOString()
        };
        saveToStorage(newSettings);
        return newSettings;
      });
    }, [saveToStorage]),

    moveToolToGroup: useCallback((toolId: string, targetGroupId: string | null) => {
      setSettings(prev => {
        const tool = prev.tools[toolId];
        if (!tool) return prev;
        
        const newSettings = {
          ...prev,
          tools: {
            ...prev.tools,
            [toolId]: {
              ...tool,
              groupId: targetGroupId || undefined
            }
          },
          lastUpdated: new Date().toISOString()
        };
        saveToStorage(newSettings);
        return newSettings;
      });
    }, [saveToStorage]),

    reorderTools: useCallback((groupId: string | null, toolIds: string[]) => {
      setSettings(prev => {
        const newTools = { ...prev.tools };
        
        toolIds.forEach((toolId, index) => {
          if (newTools[toolId]) {
            newTools[toolId] = {
              ...newTools[toolId],
              order: index + 1
            };
          }
        });
        
        const newSettings = {
          ...prev,
          tools: newTools,
          lastUpdated: new Date().toISOString()
        };
        saveToStorage(newSettings);
        return newSettings;
      });
    }, [saveToStorage]),

    reorderGroups: useCallback((groupIds: string[]) => {
      setSettings(prev => {
        const newGroups = { ...prev.groups };
        
        groupIds.forEach((groupId, index) => {
          if (newGroups[groupId]) {
            newGroups[groupId] = {
              ...newGroups[groupId],
              order: index + 1
            };
          }
        });
        
        const newSettings = {
          ...prev,
          groups: newGroups,
          lastUpdated: new Date().toISOString()
        };
        saveToStorage(newSettings);
        return newSettings;
      });
    }, [saveToStorage])
  };

  // Add analytics tracking inside the hook
  const trackIconPackUsage = useCallback((packId: IconPackType) => {
    const analytics = {
      action: 'pack_change' as const,
      packId,
      timestamp: new Date().toISOString(),
      metadata: {
        previousPack: settings.iconPack,
        userAgent: navigator.userAgent
      }
    };
    
    // Store in localStorage for now (can be sent to analytics service later)
    const existingAnalytics = JSON.parse(localStorage.getItem('ai-dock-analytics') || '[]');
    existingAnalytics.push(analytics);
    localStorage.setItem('ai-dock-analytics', JSON.stringify(existingAnalytics.slice(-100))); // Keep last 100 events
  }, [settings.iconPack]);

  return {
    settings,
    updateSettings,
    updateToolConfig,
    updateToolColor,
    updateIconPack,
    updateTheme,
    resetTheme,
    toggleTool,
    resetToDefaults,
    exportSettings,
    importSettings,
    saveToCloud,
    loadFromCloud,
    groupActions,
    isLoading,
    error
  };
}

// Export utility functions
export { colorToString, stringToColor, validateSettings, migrateSettings };

// Remove the duplicate function definitions that were outside the hook
