import React, { useState, useEffect } from 'react';
import { usePrompts } from '../hooks/use-prompts';
import { useExtensionStore } from '../store/extension-store';
import { formatTimeAgo, cn } from '../lib/utils';
import LoadingSpinner from './LoadingSpinner';
import type { Prompt } from '../lib/types';

const LibraryTab: React.FC = () => {
  const { user } = useExtensionStore();
  const { 
    prompts, 
    isLoading, 
    error, 
    fetchPrompts, 
    deletePrompt, 
    searchPrompts 
  } = usePrompts();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'title'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch prompts on component mount
  useEffect(() => {
    if (user) {
      fetchPrompts();
    }
  }, [user, fetchPrompts]);

  // Handle search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchPrompts(searchQuery.trim());
      } else {
        fetchPrompts();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchPrompts, fetchPrompts]);

  const handleDelete = async (promptId: string) => {
    try {
      await deletePrompt(promptId);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete prompt:', error);
    }
  };

  const handleCopyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const openInMainApp = (promptId: string) => {
    const mainAppUrl = process.env.PLASMO_PUBLIC_MAIN_APP_URL || 'http://localhost:3000';
    chrome.tabs.create({ url: `${mainAppUrl}/playground?promptId=${promptId}` });
  };

  // Filter and sort prompts
  const filteredAndSortedPrompts = React.useMemo(() => {
    let filtered = prompts;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(prompt => prompt.category === selectedCategory);
    }

    // Sort prompts
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
          break;
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [prompts, selectedCategory, sortBy, sortOrder]);

  const categories = React.useMemo(() => {
    const cats = new Set(prompts.map(p => p.category));
    return Array.from(cats).sort();
  }, [prompts]);

  if (isLoading && prompts.length === 0) {
    return (
      <div className="library-loading">
        <LoadingSpinner size="lg" />
        <p className="library-loading-text">Loading your prompts...</p>
      </div>
    );
  }

  return (
    <div className="library-tab">
      {/* Search and filters */}
      <div className="library-controls">
        <div className="library-search">
          <input
            type="text"
            className="library-search-input"
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="library-search-icon">🔍</div>
        </div>

        <div className="library-filters">
          <select
            className="library-filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>

          <select
            className="library-filter-select"
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as typeof sortBy);
              setSortOrder(order as typeof sortOrder);
            }}
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="updated_at-desc">Recently Updated</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="library-error">
          <div className="library-error-icon">❌</div>
          <p className="library-error-text">{error}</p>
          <button
            className="extension-button extension-button-secondary"
            onClick={() => fetchPrompts()}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredAndSortedPrompts.length === 0 && (
        <div className="library-empty">
          <div className="library-empty-icon">📝</div>
          <h3 className="library-empty-title">
            {searchQuery ? 'No prompts found' : 'No prompts yet'}
          </h3>
          <p className="library-empty-text">
            {searchQuery 
              ? 'Try adjusting your search or filters'
              : 'Start capturing web content to build your prompt library'
            }
          </p>
          {searchQuery && (
            <button
              className="extension-button extension-button-secondary"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Prompts list */}
      <div className="library-list">
        {filteredAndSortedPrompts.map((prompt) => (
          <div key={prompt.id} className="library-item">
            <div className="library-item-header">
              <div className="library-item-title-section">
                <h4 className="library-item-title">{prompt.title}</h4>
                <div className="library-item-meta">
                  <span className="library-item-category">
                    {prompt.category}
                  </span>
                  <span className="library-item-date">
                    {formatTimeAgo(prompt.created_at)}
                  </span>
                </div>
              </div>
              
              <div className="library-item-actions">
                <button
                  className="library-item-action"
                  onClick={() => setExpandedPrompt(
                    expandedPrompt === prompt.id ? null : prompt.id
                  )}
                  title={expandedPrompt === prompt.id ? 'Collapse' : 'Expand'}
                >
                  {expandedPrompt === prompt.id ? '🔼' : '🔽'}
                </button>
                
                <button
                  className="library-item-action"
                  onClick={() => handleCopyToClipboard(prompt.content)}
                  title="Copy to clipboard"
                >
                  📋
                </button>
                
                <button
                  className="library-item-action"
                  onClick={() => openInMainApp(prompt.id)}
                  title="Open in main app"
                >
                  🌐
                </button>
                
                <button
                  className="library-item-action library-item-action-danger"
                  onClick={() => setDeleteConfirm(prompt.id)}
                  title="Delete prompt"
                >
                  🗑️
                </button>
              </div>
            </div>

            {expandedPrompt === prompt.id && (
              <div className="library-item-content">
                <div className="library-item-text">
                  {prompt.content}
                </div>
                
                {prompt.tags && prompt.tags.length > 0 && (
                  <div className="library-item-tags">
                    {prompt.tags.map((tag, index) => (
                      <span key={index} className="library-item-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {prompt.source_url && (
                  <div className="library-item-source">
                    <span className="library-item-source-label">Source:</span>
                    <a
                      href={prompt.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="library-item-source-link"
                    >
                      {prompt.source_url}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Delete confirmation */}
            {deleteConfirm === prompt.id && (
              <div className="library-item-delete-confirm">
                <p className="library-item-delete-text">
                  Are you sure you want to delete this prompt?
                </p>
                <div className="library-item-delete-actions">
                  <button
                    className="extension-button extension-button-secondary"
                    onClick={() => setDeleteConfirm(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="extension-button extension-button-danger"
                    onClick={() => handleDelete(prompt.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Loading more indicator */}
      {isLoading && prompts.length > 0 && (
        <div className="library-loading-more">
          <LoadingSpinner size="sm" />
          <span>Loading...</span>
        </div>
      )}
    </div>
  );
};

export default LibraryTab;