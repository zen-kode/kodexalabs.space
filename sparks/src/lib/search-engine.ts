'use client';

import type { Prompt, SearchQuery, SearchResult, SearchResponse } from './types';

/**
 * Advanced search engine for prompt library
 * Provides full-text search, filtering, and ranking capabilities
 */
export class SearchEngine {
  private stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'the', 'this', 'but', 'they', 'have',
    'had', 'what', 'said', 'each', 'which', 'do', 'how', 'their', 'if'
  ]);

  /**
   * Extract keywords from text for search indexing
   */
  extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.stopWords.has(word))
      .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
      .slice(0, 50); // Limit to 50 keywords
  }

  /**
   * Calculate text similarity score using Jaccard similarity
   */
  private calculateSimilarity(query: string[], target: string[]): number {
    const querySet = new Set(query);
    const targetSet = new Set(target);
    const intersection = new Set([...querySet].filter(x => targetSet.has(x)));
    const union = new Set([...querySet, ...targetSet]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Calculate relevance score for a prompt against a search query
   */
  private calculateRelevanceScore(prompt: Prompt, queryTerms: string[]): number {
    let score = 0;
    const titleKeywords = this.extractKeywords(prompt.title);
    const contentKeywords = this.extractKeywords(prompt.content);
    const allKeywords = [...titleKeywords, ...contentKeywords, ...(prompt.tags || [])];

    // Title matches get higher weight
    const titleScore = this.calculateSimilarity(queryTerms, titleKeywords) * 3;
    
    // Content matches
    const contentScore = this.calculateSimilarity(queryTerms, contentKeywords) * 2;
    
    // Tag matches get highest weight
    const tagScore = this.calculateSimilarity(queryTerms, prompt.tags || []) * 4;
    
    // Category exact match
    const categoryScore = prompt.category && queryTerms.includes(prompt.category.toLowerCase()) ? 2 : 0;

    score = titleScore + contentScore + tagScore + categoryScore;

    // Boost for exact phrase matches
    const queryPhrase = queryTerms.join(' ');
    if (prompt.title.toLowerCase().includes(queryPhrase)) score += 2;
    if (prompt.content.toLowerCase().includes(queryPhrase)) score += 1;

    return Math.min(score, 10); // Cap at 10
  }

  /**
   * Generate search highlights for matched terms
   */
  private generateHighlights(prompt: Prompt, queryTerms: string[]) {
    const highlights: { title?: string[]; content?: string[]; tags?: string[] } = {};

    // Highlight title matches
    const titleMatches = queryTerms.filter(term => 
      prompt.title.toLowerCase().includes(term.toLowerCase())
    );
    if (titleMatches.length > 0) {
      highlights.title = titleMatches;
    }

    // Highlight content matches (first 3 sentences with matches)
    const contentMatches = queryTerms.filter(term => 
      prompt.content.toLowerCase().includes(term.toLowerCase())
    );
    if (contentMatches.length > 0) {
      const sentences = prompt.content.split(/[.!?]+/).slice(0, 3);
      const matchingSentences = sentences.filter(sentence => 
        contentMatches.some(term => sentence.toLowerCase().includes(term.toLowerCase()))
      );
      highlights.content = matchingSentences.slice(0, 2);
    }

    // Highlight tag matches
    const tagMatches = (prompt.tags || []).filter(tag => 
      queryTerms.some(term => tag.toLowerCase().includes(term.toLowerCase()))
    );
    if (tagMatches.length > 0) {
      highlights.tags = tagMatches;
    }

    return highlights;
  }

  /**
   * Filter prompts based on search criteria
   */
  private filterPrompts(prompts: Prompt[], query: SearchQuery): Prompt[] {
    return prompts.filter(prompt => {
      // Category filter
      if (query.category && prompt.category !== query.category) {
        return false;
      }

      // Tags filter (must have all specified tags)
      if (query.tags && query.tags.length > 0) {
        const promptTags = prompt.tags || [];
        if (!query.tags.every(tag => promptTags.includes(tag))) {
          return false;
        }
      }

      // Date range filter
      if (query.dateRange) {
        const promptDate = new Date(prompt.createdAt);
        const startDate = new Date(query.dateRange.start);
        const endDate = new Date(query.dateRange.end);
        if (promptDate < startDate || promptDate > endDate) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Generate facets for search results
   */
  private generateFacets(prompts: Prompt[]) {
    const categories = new Map<string, number>();
    const tags = new Map<string, number>();

    prompts.forEach(prompt => {
      // Count categories
      if (prompt.category) {
        categories.set(prompt.category, (categories.get(prompt.category) || 0) + 1);
      }

      // Count tags
      (prompt.tags || []).forEach(tag => {
        tags.set(tag, (tags.get(tag) || 0) + 1);
      });
    });

    return {
      categories: Array.from(categories.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      tags: Array.from(tags.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20)
    };
  }

  /**
   * Main search function
   */
  search(prompts: Prompt[], query: SearchQuery): SearchResponse {
    // Start with all prompts
    let filteredPrompts = [...prompts];

    // Apply filters
    filteredPrompts = this.filterPrompts(filteredPrompts, query);

    // If there's a search query, calculate relevance scores
    let results: SearchResult[] = [];
    
    if (query.query && query.query.trim()) {
      const queryTerms = this.extractKeywords(query.query);
      
      results = filteredPrompts
        .map(prompt => {
          const score = this.calculateRelevanceScore(prompt, queryTerms);
          return {
            prompt,
            score,
            highlights: this.generateHighlights(prompt, queryTerms)
          };
        })
        .filter(result => result.score > 0) // Only include results with some relevance
        .sort((a, b) => b.score - a.score); // Sort by relevance
    } else {
      // No search query, return all filtered prompts
      results = filteredPrompts.map(prompt => ({
        prompt,
        score: 1,
        highlights: {}
      }));
    }

    // Apply sorting if specified
    if (query.sortBy && query.sortBy !== 'relevance') {
      results.sort((a, b) => {
        let comparison = 0;
        
        switch (query.sortBy) {
          case 'date':
            comparison = new Date(a.prompt.createdAt).getTime() - new Date(b.prompt.createdAt).getTime();
            break;
          case 'title':
            comparison = a.prompt.title.localeCompare(b.prompt.title);
            break;
          case 'category':
            comparison = (a.prompt.category || '').localeCompare(b.prompt.category || '');
            break;
        }
        
        return query.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 20;
    const total = results.length;
    const paginatedResults = results.slice(offset, offset + limit);

    // Generate facets from all filtered prompts (before pagination)
    const facets = this.generateFacets(filteredPrompts);

    return {
      results: paginatedResults,
      total,
      query,
      facets
    };
  }

  /**
   * Get search suggestions based on query
   */
  getSuggestions(prompts: Prompt[], query: string, limit: number = 5): string[] {
    if (!query || query.length < 2) return [];

    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();

    prompts.forEach(prompt => {
      // Title suggestions
      if (prompt.title.toLowerCase().includes(queryLower)) {
        suggestions.add(prompt.title);
      }

      // Tag suggestions
      (prompt.tags || []).forEach(tag => {
        if (tag.toLowerCase().includes(queryLower)) {
          suggestions.add(tag);
        }
      });

      // Category suggestions
      if (prompt.category && prompt.category.toLowerCase().includes(queryLower)) {
        suggestions.add(prompt.category);
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Calculate reading time for content
   */
  calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Determine content complexity
   */
  determineComplexity(content: string): 'simple' | 'medium' | 'complex' {
    const wordCount = content.split(/\s+/).length;
    const sentenceCount = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / sentenceCount;
    
    if (wordCount < 50 && avgWordsPerSentence < 15) return 'simple';
    if (wordCount < 200 && avgWordsPerSentence < 25) return 'medium';
    return 'complex';
  }
}

// Export singleton instance
export const searchEngine = new SearchEngine();