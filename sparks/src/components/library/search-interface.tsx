'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, X, Calendar, Tag, Folder, SortAsc, SortDesc, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
// Command components removed - not available in current UI library
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { SearchQuery, SearchResponse } from '@/lib/types';

interface SearchInterfaceProps {
  onSearch: (query: SearchQuery) => SearchResponse;
  searchResults: SearchResponse | null;
  suggestions: string[];
  onSuggestionSelect: (suggestion: string) => void;
  categories: { name: string; count: number }[];
  tags: { name: string; count: number }[];
  className?: string;
}

interface SearchFilters {
  query: string;
  category: string;
  selectedTags: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  sortBy: 'relevance' | 'date' | 'title' | 'category';
  sortOrder: 'asc' | 'desc';
}

export function SearchInterface({
  onSearch,
  searchResults,
  suggestions,
  onSuggestionSelect,
  categories,
  tags,
  className
}: SearchInterfaceProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    selectedTags: [],
    dateRange: { start: null, end: null },
    sortBy: 'relevance',
    sortOrder: 'desc'
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('prompt-search-history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    }
  }, []);

  // Save search history to localStorage
  const saveSearchHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('prompt-search-history', JSON.stringify(newHistory));
  }, [searchHistory]);

  // Debounced search
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return (searchQuery: SearchQuery) => {
      clearTimeout(timeoutId);
      setIsSearching(true);
      
      timeoutId = setTimeout(() => {
        onSearch(searchQuery);
        setIsSearching(false);
        
        if (searchQuery.query) {
          saveSearchHistory(searchQuery.query);
        }
      }, 300);
    };
  }, [onSearch, saveSearchHistory]);

  // Perform search when filters change
  useEffect(() => {
    const searchQuery: SearchQuery = {
      query: filters.query || undefined,
      category: filters.category || undefined,
      tags: filters.selectedTags.length > 0 ? filters.selectedTags : undefined,
      dateRange: (filters.dateRange.start && filters.dateRange.end) ? {
        start: filters.dateRange.start.toISOString(),
        end: filters.dateRange.end.toISOString()
      } : undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      limit: 20,
      offset: 0
    };

    debouncedSearch(searchQuery);
  }, [filters, debouncedSearch]);

  const handleQueryChange = (value: string) => {
    setFilters(prev => ({ ...prev, query: value }));
    setShowSuggestions(value.length > 0);
  };

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({ ...prev, category: category === 'all' ? '' : category }));
  };

  const handleTagToggle = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag]
    }));
  };

  const handleTagRemove = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.filter(t => t !== tag)
    }));
  };

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { start, end }
    }));
  };

  const handleSortChange = (sortBy: string, sortOrder?: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any || prev.sortOrder
    }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      category: '',
      selectedTags: [],
      dateRange: { start: null, end: null },
      sortBy: 'relevance',
      sortOrder: 'desc'
    });
  };

  const hasActiveFilters = filters.category || filters.selectedTags.length > 0 || 
    filters.dateRange.start || filters.dateRange.end;

  const filteredSuggestions = suggestions.filter(s => 
    s.toLowerCase().includes(filters.query.toLowerCase()) && s !== filters.query
  ).slice(0, 5);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts, tags, categories..."
            value={filters.query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => setShowSuggestions(filters.query.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="pl-10 pr-12"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Search Suggestions */}
        {showSuggestions && (filteredSuggestions.length > 0 || searchHistory.length > 0) && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto">
            <CardContent className="p-2">
              {filteredSuggestions.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                    Suggestions
                  </div>
                  {filteredSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded"
                      onClick={() => {
                        handleQueryChange(suggestion);
                        onSuggestionSelect(suggestion);
                        setShowSuggestions(false);
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              
              {searchHistory.length > 0 && (
                <div className="space-y-1 mt-2">
                  <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                    Recent Searches
                  </div>
                  {searchHistory.slice(0, 5).map((query, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded text-muted-foreground"
                      onClick={() => {
                        handleQueryChange(query);
                        setShowSuggestions(false);
                      }}
                    >
                      {query}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
              {(filters.category ? 1 : 0) + filters.selectedTags.length + (filters.dateRange.start ? 1 : 0)}
            </Badge>
          )}
        </Button>

        {/* Quick Sort */}
        <Select value={`${filters.sortBy}-${filters.sortOrder}`} onValueChange={(value) => {
          const [sortBy, sortOrder] = value.split('-');
          handleSortChange(sortBy, sortOrder);
        }}>
          <SelectTrigger className="w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance-desc">Most Relevant</SelectItem>
            <SelectItem value="date-desc">Newest First</SelectItem>
            <SelectItem value="date-asc">Oldest First</SelectItem>
            <SelectItem value="title-asc">Title A-Z</SelectItem>
            <SelectItem value="title-desc">Title Z-A</SelectItem>
            <SelectItem value="category-asc">Category A-Z</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {filters.category && (
            <Badge variant="secondary" className="gap-1">
              <Folder className="h-3 w-3" />
              {filters.category}
              <button
                onClick={() => handleCategoryChange('')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="h-2 w-2" />
              </button>
            </Badge>
          )}
          
          {filters.selectedTags.map(tag => (
            <Badge key={tag} variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" />
              {tag}
              <button
                onClick={() => handleTagRemove(tag)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="h-2 w-2" />
              </button>
            </Badge>
          ))}
          
          {filters.dateRange.start && filters.dateRange.end && (
            <Badge variant="secondary" className="gap-1">
              <Calendar className="h-3 w-3" />
              {filters.dateRange.start.toLocaleDateString()} - {filters.dateRange.end.toLocaleDateString()}
              <button
                onClick={() => handleDateRangeChange(null, null)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="h-2 w-2" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Advanced Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={filters.category || 'all'} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.name} value={category.name}>
                        {category.name} ({category.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {filters.dateRange.start && filters.dateRange.end
                        ? `${filters.dateRange.start.toLocaleDateString()} - ${filters.dateRange.end.toLocaleDateString()}`
                        : 'Select date range'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="range"
                      selected={{
                        from: filters.dateRange.start || undefined,
                        to: filters.dateRange.end || undefined
                      }}
                      onSelect={(range) => {
                        handleDateRangeChange(range?.from || null, range?.to || null);
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Tags Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {tags.slice(0, 20).map(tag => (
                  <Badge
                    key={tag.name}
                    variant={filters.selectedTags.includes(tag.name) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/80"
                    onClick={() => handleTagToggle(tag.name)}
                  >
                    {tag.name} ({tag.count})
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results Summary */}
      {searchResults && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {searchResults.total} result{searchResults.total !== 1 ? 's' : ''}
            {filters.query && ` for "${filters.query}"`}
          </span>
          
          {searchResults.total > 0 && (
            <div className="flex items-center gap-2">
              <span>Sort by:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSortChange(filters.sortBy, filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                className="gap-1 h-auto p-1"
              >
                {filters.sortBy}
                {filters.sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchInterface;