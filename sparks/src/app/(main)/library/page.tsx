'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Grid, 
  List, 
  Download, 
  Upload, 
  Settings, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Star,
  Archive,
  Trash2,
  RefreshCw,
  AlertCircle,
  PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

// Import our new components
import SearchInterface from '@/components/library/search-interface';
import SearchResults from '@/components/library/search-results';
import { useEnhancedPrompts } from '@/hooks/use-enhanced-prompts';
import AutoSaveIndicator from '@/components/shared/autosave-indicator';
import VersionControl from '@/components/shared/version-control';

import type { Prompt, SearchQuery, SearchResponse } from '@/lib/types';

interface LibraryStats {
  total: number;
  categories: { name: string; count: number }[];
  tags: { name: string; count: number }[];
  recentActivity: { date: string; count: number }[];
}

interface CreatePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreatePrompt: (data: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }) => Promise<void>;
}

function CreatePromptDialog({ open, onOpenChange, onCreatePrompt }: CreatePromptDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    setIsCreating(true);
    try {
      await onCreatePrompt({
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category.trim() || undefined,
        tags: formData.tags.trim() ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined
      });
      
      setFormData({ title: '', content: '', category: '', tags: '' });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating prompt:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Prompt</DialogTitle>
          <DialogDescription>
            Create a new prompt for your library. You can organize it with categories and tags.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter prompt title..."
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              placeholder="Enter your prompt content..."
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={6}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., Marketing, Development"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="tag1, tag2, tag3"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !formData.title.trim() || !formData.content.trim()}>
              {isCreating ? 'Creating...' : 'Create Prompt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LibraryOverview({ stats }: { stats: LibraryStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Prompts</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            Across {stats.categories.length} categories
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Categories</CardTitle>
          <Filter className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.categories.length}</div>
          <p className="text-xs text-muted-foreground">
            {stats.categories[0]?.name} is most popular
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tags</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.tags.length}</div>
          <p className="text-xs text-muted-foreground">
            {stats.tags.slice(0, 2).map(t => t.name).join(', ')}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.recentActivity.reduce((sum, day) => sum + day.count, 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Last 30 days
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LibraryPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Enhanced prompts hook with all functionality
  const {
    prompts,
    loading,
    error,
    refetch,
    search,
    searchResults,
    getSearchSuggestions,
    createPrompt,
    updatePrompt,
    deletePrompt,
    duplicatePrompt,
    getPromptStats,
    // Auto-save functionality
    autoSaveState,
    getAutoSaves,
    restoreAutoSave,
    // Version control
    createVersion,
    getVersionHistory,
    revertToVersion,
    compareVersions,
    branchFromVersion
  } = useEnhancedPrompts({
    enableAutoSave: true,
    enableVersioning: true,
    autoSaveInterval: 5000
  });

  // Local state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPrompts, setSelectedPrompts] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('all');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [autoSaves, setAutoSaves] = useState<any[]>([]);

  // Load auto-saves
  useEffect(() => {
    getAutoSaves().then(setAutoSaves).catch(console.error);
  }, [getAutoSaves]);

  // Get library stats
  const stats = getPromptStats();

  // Handle search with suggestions
  const handleSearch = useCallback((query: SearchQuery) => {
    const results = search(query);
    if (query.query) {
      setSuggestions(getSearchSuggestions(query.query));
    }
    return results;
  }, [search, getSearchSuggestions]);

  // Handle prompt actions
  const handlePromptSelect = (prompt: Prompt) => {
    router.push(`/playground?promptId=${prompt.id}`);
  };

  const handlePromptEdit = (prompt: Prompt) => {
    router.push(`/playground?promptId=${prompt.id}&mode=edit`);
  };

  const handlePromptDuplicate = async (prompt: Prompt) => {
    try {
      const duplicated = await duplicatePrompt(prompt.id);
      if (duplicated) {
        toast({
          title: 'Prompt Duplicated',
          description: `"${prompt.title}" has been duplicated successfully.`
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate prompt.',
        variant: 'destructive'
      });
    }
  };

  const handlePromptDelete = async (prompt: Prompt) => {
    if (!confirm(`Are you sure you want to delete "${prompt.title}"?`)) return;
    
    try {
      const success = await deletePrompt(prompt.id);
      if (success) {
        toast({
          title: 'Prompt Deleted',
          description: `"${prompt.title}" has been deleted.`
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete prompt.',
        variant: 'destructive'
      });
    }
  };

  const handlePromptFavorite = (prompt: Prompt) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(prompt.id)) {
        newFavorites.delete(prompt.id);
      } else {
        newFavorites.add(prompt.id);
      }
      return newFavorites;
    });
  };

  const handleCreatePrompt = async (data: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }) => {
    try {
      const newPrompt = await createPrompt(data);
      if (newPrompt) {
        toast({
          title: 'Prompt Created',
          description: `"${data.title}" has been created successfully.`
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create prompt.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleBulkAction = async (action: string) => {
    const selectedIds = Array.from(selectedPrompts);
    if (selectedIds.length === 0) return;

    switch (action) {
      case 'delete':
        if (confirm(`Delete ${selectedIds.length} selected prompts?`)) {
          for (const id of selectedIds) {
            await deletePrompt(id);
          }
          setSelectedPrompts(new Set());
          toast({
            title: 'Prompts Deleted',
            description: `${selectedIds.length} prompts have been deleted.`
          });
        }
        break;
      case 'favorite':
        selectedIds.forEach(id => {
          setFavorites(prev => new Set([...prev, id]));
        });
        setSelectedPrompts(new Set());
        break;
      case 'export':
        // Handle export logic
        toast({
          title: 'Export Started',
          description: `Exporting ${selectedIds.length} prompts...`
        });
        break;
    }
  };

  // Filter prompts based on active tab
  const getFilteredPrompts = () => {
    switch (activeTab) {
      case 'favorites':
        return prompts.filter(p => favorites.has(p.id));
      case 'drafts':
        return prompts.filter(p => p.isDraft);
      case 'recent':
        return prompts.slice(0, 20); // Last 20 prompts
      default:
        return prompts;
    }
  };

  const filteredPrompts = getFilteredPrompts();
  const displayResults = searchResults || {
    results: filteredPrompts.map(prompt => ({ prompt, score: 1, highlights: {} })),
    total: filteredPrompts.length,
    query: {},
    facets: { categories: stats.categories, tags: stats.tags }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prompt Library</h1>
          <p className="text-muted-foreground">
            Manage, search, and organize your AI prompts with advanced features
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Auto-save indicator */}
          <AutoSaveIndicator
            state={null} // Would be connected to current editing state
            autoSaves={autoSaves}
            compact
          />
          
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Prompt
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Library
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Export All
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload className="h-4 w-4 mr-2" />
                Import Prompts
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Library Overview */}
      <LibraryOverview stats={stats} />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Prompts</TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2">
              <Star className="h-3 w-3" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            {selectedPrompts.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedPrompts.size} selected
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Bulk Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkAction('favorite')}>
                      <Star className="h-4 w-4 mr-2" />
                      Add to Favorites
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('export')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Selected
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleBulkAction('delete')}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-7 w-7 p-0"
              >
                <Grid className="h-3 w-3" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-7 w-7 p-0"
              >
                <List className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Search Interface */}
          <SearchInterface
            onSearch={handleSearch}
            searchResults={searchResults}
            suggestions={suggestions}
            onSuggestionSelect={(suggestion) => {
              // Handle suggestion selection
            }}
            categories={stats.categories}
            tags={stats.tags}
          />

          {/* Search Results */}
          <SearchResults
            searchResponse={displayResults}
            onPromptSelect={handlePromptSelect}
            onPromptEdit={handlePromptEdit}
            onPromptDuplicate={handlePromptDuplicate}
            onPromptDelete={handlePromptDelete}
            onPromptFavorite={handlePromptFavorite}
            favorites={favorites}
          />
        </TabsContent>
      </Tabs>

      {/* Create Prompt Dialog */}
      <CreatePromptDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreatePrompt={handleCreatePrompt}
      />

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 max-w-md">
          <Card className="border-destructive">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Error</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
