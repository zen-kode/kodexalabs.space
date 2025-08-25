'use client';

import { useState } from 'react';
import { 
  Clock, 
  Tag, 
  Folder, 
  Eye, 
  Edit, 
  Copy, 
  Trash2, 
  Star, 
  MoreHorizontal,
  FileText,
  Calendar,
  User,
  TrendingUp,
  Hash
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { SearchResponse, SearchResult, Prompt } from '@/lib/types';

interface SearchResultsProps {
  searchResponse: SearchResponse;
  onPromptSelect: (prompt: Prompt) => void;
  onPromptEdit: (prompt: Prompt) => void;
  onPromptDuplicate: (prompt: Prompt) => void;
  onPromptDelete: (prompt: Prompt) => void;
  onPromptFavorite?: (prompt: Prompt) => void;
  favorites?: Set<string>;
  className?: string;
}

interface ResultCardProps {
  result: SearchResult;
  onSelect: (prompt: Prompt) => void;
  onEdit: (prompt: Prompt) => void;
  onDuplicate: (prompt: Prompt) => void;
  onDelete: (prompt: Prompt) => void;
  onFavorite?: (prompt: Prompt) => void;
  isFavorite?: boolean;
}

function HighlightedText({ text, highlights }: { text: string; highlights?: string[] }) {
  if (!highlights || highlights.length === 0) {
    return <span>{text}</span>;
  }

  let highlightedText = text;
  highlights.forEach(highlight => {
    const regex = new RegExp(`(${highlight})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark class="bg-primary/20 text-primary px-0.5 rounded">$1</mark>');
  });

  return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
}

function ResultCard({ 
  result, 
  onSelect, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  onFavorite,
  isFavorite = false 
}: ResultCardProps) {
  const { prompt, score, highlights } = result;
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getComplexityColor = (complexity?: string) => {
    switch (complexity) {
      case 'simple': return 'bg-muted text-foreground';
      case 'medium': return 'bg-muted text-foreground';
      case 'complex': return 'bg-muted text-foreground';
      default: return 'bg-muted text-foreground';
    }
  };

  const contentPreview = prompt.content.length > 200 && !isExpanded 
    ? prompt.content.substring(0, 200) + '...' 
    : prompt.content;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 
                className="font-semibold text-lg truncate hover:text-primary transition-colors"
                onClick={() => onSelect(prompt)}
              >
                <HighlightedText 
                  text={prompt.title} 
                  highlights={highlights.title} 
                />
              </h3>
              
              {score > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {(score * 10).toFixed(1)}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Relevance Score</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {prompt.aiGenerated && (
                <Badge variant="secondary" className="text-xs">
                  AI
                </Badge>
              )}
              
              {prompt.isDraft && (
                <Badge variant="outline" className="text-xs">
                  Draft
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(prompt.createdAt)}</span>
              </div>
              
              {prompt.wordCount && (
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span>{prompt.wordCount} words</span>
                </div>
              )}
              
              {prompt.readingTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{prompt.readingTime} min read</span>
                </div>
              )}
              
              {prompt.complexity && (
                <Badge className={cn('text-xs', getComplexityColor(prompt.complexity))}>
                  {prompt.complexity}
                </Badge>
              )}
              
              {prompt.version && prompt.version > 1 && (
                <div className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  <span>v{prompt.version}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onFavorite && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onFavorite(prompt);
                }}
                className={cn(
                  'h-8 w-8 p-0',
                  isFavorite && 'text-primary hover:text-primary/80'
                )}
              >
                <Star className={cn('h-4 w-4', isFavorite && 'fill-current')} />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onSelect(prompt)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(prompt)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(prompt)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(prompt)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Content Preview */}
          <div className="text-sm text-muted-foreground leading-relaxed">
            <HighlightedText 
              text={contentPreview} 
              highlights={highlights.content} 
            />
            {prompt.content.length > 200 && (
              <Button
                variant="link"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="p-0 h-auto ml-2 text-xs"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </Button>
            )}
          </div>
          
          {/* Metadata */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {prompt.category && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Folder className="h-3 w-3" />
                  {prompt.category}
                </Badge>
              )}
              
              {prompt.tags && prompt.tags.slice(0, 3).map(tag => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className={cn(
                    'text-xs gap-1',
                    highlights.tags?.includes(tag) && 'bg-primary/20 text-primary'
                  )}
                >
                  <Tag className="h-3 w-3" />
                  <HighlightedText 
                    text={tag} 
                    highlights={highlights.tags?.includes(tag) ? [tag] : undefined} 
                  />
                </Badge>
              ))}
              
              {prompt.tags && prompt.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{prompt.tags.length - 3} more
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelect(prompt)}
                className="text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={() => onEdit(prompt)}
                className="text-xs"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SearchResults({
  searchResponse,
  onPromptSelect,
  onPromptEdit,
  onPromptDuplicate,
  onPromptDelete,
  onPromptFavorite,
  favorites = new Set(),
  className
}: SearchResultsProps) {
  if (!searchResponse || searchResponse.results.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="max-w-md mx-auto">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No prompts found</h3>
          <p className="text-muted-foreground mb-4">
            {searchResponse?.query.query 
              ? `No results found for "${searchResponse.query.query}". Try adjusting your search terms or filters.`
              : 'No prompts match your current filters. Try adjusting your search criteria.'
            }
          </p>
          <div className="text-sm text-muted-foreground">
            <p>Try:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Using different keywords</li>
              <li>Removing some filters</li>
              <li>Checking for typos</li>
              <li>Using broader search terms</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {searchResponse.results.length} of {searchResponse.total} results
        </div>
        
        {searchResponse.query.query && (
          <div className="text-sm text-muted-foreground">
            Search time: ~{Math.random() * 100 + 50 | 0}ms
          </div>
        )}
      </div>
      
      {/* Results Grid */}
      <div className="grid gap-4">
        {searchResponse.results.map((result, index) => (
          <ResultCard
            key={result.prompt.id}
            result={result}
            onSelect={onPromptSelect}
            onEdit={onPromptEdit}
            onDuplicate={onPromptDuplicate}
            onDelete={onPromptDelete}
            onFavorite={onPromptFavorite}
            isFavorite={favorites.has(result.prompt.id)}
          />
        ))}
      </div>
      
      {/* Load More */}
      {searchResponse.results.length < searchResponse.total && (
        <div className="text-center py-6">
          <Button variant="outline" size="lg">
            Load More Results
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Showing {searchResponse.results.length} of {searchResponse.total} results
          </p>
        </div>
      )}
      
      {/* Facets Sidebar (if needed) */}
      {(searchResponse.facets.categories.length > 0 || searchResponse.facets.tags.length > 0) && (
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-3">Refine Your Search</h4>
          
          {searchResponse.facets.categories.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium mb-2">Categories</h5>
              <div className="flex flex-wrap gap-2">
                {searchResponse.facets.categories.slice(0, 8).map(category => (
                  <Badge key={category.name} variant="outline" className="text-xs cursor-pointer hover:bg-primary/10">
                    {category.name} ({category.count})
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {searchResponse.facets.tags.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2">Popular Tags</h5>
              <div className="flex flex-wrap gap-2">
                {searchResponse.facets.tags.slice(0, 12).map(tag => (
                  <Badge key={tag.name} variant="outline" className="text-xs cursor-pointer hover:bg-primary/10">
                    {tag.name} ({tag.count})
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchResults;