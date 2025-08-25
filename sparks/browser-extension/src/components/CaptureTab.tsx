import React, { useState, useEffect } from 'react';
import { useExtensionStore } from '../store/extension-store';
import { useQuickSave } from '../hooks/use-prompts';
import { extractTextSelection, getPageInfo, cn } from '../lib/utils';
import LoadingSpinner from './LoadingSpinner';

interface CaptureTabProps {
  prefilledContent?: {
    title?: string;
    content?: string;
    url?: string;
    context?: string;
  };
}

const CaptureTab: React.FC<CaptureTabProps> = ({ prefilledContent }) => {
  const { capturedContent, setCapturedContent } = useExtensionStore();
  const { quickSave, isLoading, error } = useQuickSave();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('general');
  const [isCapturing, setIsCapturing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize with prefilled content or captured content
  useEffect(() => {
    if (prefilledContent) {
      setTitle(prefilledContent.title || '');
      setContent(prefilledContent.content || '');
    } else if (capturedContent) {
      setTitle(capturedContent.title || '');
      setContent(capturedContent.text || '');
    }
  }, [prefilledContent, capturedContent]);

  const handleCaptureSelection = async () => {
    try {
      setIsCapturing(true);
      
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;

      // Execute content script to get selection
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractTextSelection
      });

      const selection = results[0]?.result;
      if (selection && selection.text) {
        setContent(prev => prev ? `${prev}\n\n${selection.text}` : selection.text);
        
        // Update captured content in store
        setCapturedContent({
          text: selection.text,
          url: tab.url || '',
          title: tab.title || '',
          timestamp: Date.now(),
          context: selection.context
        });
      }
    } catch (error) {
      console.error('Failed to capture selection:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCapturePage = async () => {
    try {
      setIsCapturing(true);
      
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;

      // Execute content script to get page info
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: getPageInfo
      });

      const pageInfo = results[0]?.result;
      if (pageInfo) {
        setTitle(prev => prev || pageInfo.title);
        setContent(prev => {
          const newContent = `URL: ${pageInfo.url}\n\nTitle: ${pageInfo.title}\n\nDescription: ${pageInfo.description || 'No description available'}`;
          return prev ? `${prev}\n\n---\n\n${newContent}` : newContent;
        });
        
        // Update captured content in store
        setCapturedContent({
          text: pageInfo.description || pageInfo.title,
          url: pageInfo.url,
          title: pageInfo.title,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to capture page:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      return;
    }

    try {
      const success = await quickSave({
        title: title.trim(),
        content: content.trim(),
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        category,
        source: 'extension',
        url: capturedContent?.url || prefilledContent?.url
      });

      if (success) {
        setSaveSuccess(true);
        // Clear form after successful save
        setTimeout(() => {
          setTitle('');
          setContent('');
          setTags('');
          setCategory('general');
          setCapturedContent(null);
          setSaveSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to save prompt:', error);
    }
  };

  const handleClear = () => {
    setTitle('');
    setContent('');
    setTags('');
    setCategory('general');
    setCapturedContent(null);
    setSaveSuccess(false);
  };

  return (
    <div className="capture-tab">
      {saveSuccess && (
        <div className="capture-success">
          <div className="capture-success-icon">✅</div>
          <span className="capture-success-text">Prompt saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="capture-error">
          <div className="capture-error-icon">❌</div>
          <span className="capture-error-text">{error}</span>
        </div>
      )}

      <div className="capture-actions">
        <div className="capture-actions-row">
          <button
            className="extension-button extension-button-secondary capture-button"
            onClick={handleCaptureSelection}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <LoadingSpinner size="sm" />
            ) : (
              <span>📝</span>
            )}
            <span>Capture Selection</span>
          </button>
          
          <button
            className="extension-button extension-button-secondary capture-button"
            onClick={handleCapturePage}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <LoadingSpinner size="sm" />
            ) : (
              <span>🌐</span>
            )}
            <span>Capture Page</span>
          </button>
        </div>
      </div>

      <div className="capture-form">
        <div className="capture-form-group">
          <label className="capture-form-label" htmlFor="title">
            Title *
          </label>
          <input
            id="title"
            type="text"
            className="capture-form-input"
            placeholder="Enter a title for your prompt..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
          <div className="capture-form-hint">
            {title.length}/200 characters
          </div>
        </div>

        <div className="capture-form-group">
          <label className="capture-form-label" htmlFor="content">
            Content *
          </label>
          <textarea
            id="content"
            className="capture-form-textarea"
            placeholder="Paste or type your content here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            maxLength={5000}
          />
          <div className="capture-form-hint">
            {content.length}/5000 characters
          </div>
        </div>

        <div className="capture-form-row">
          <div className="capture-form-group capture-form-group-half">
            <label className="capture-form-label" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              className="capture-form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="general">General</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="research">Research</option>
              <option value="creative">Creative</option>
              <option value="technical">Technical</option>
              <option value="learning">Learning</option>
            </select>
          </div>

          <div className="capture-form-group capture-form-group-half">
            <label className="capture-form-label" htmlFor="tags">
              Tags
            </label>
            <input
              id="tags"
              type="text"
              className="capture-form-input"
              placeholder="tag1, tag2, tag3..."
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              maxLength={200}
            />
          </div>
        </div>

        <div className="capture-form-actions">
          <button
            className="extension-button extension-button-secondary"
            onClick={handleClear}
            disabled={isLoading}
          >
            Clear
          </button>
          
          <button
            className={cn(
              'extension-button extension-button-primary',
              (!title.trim() || !content.trim()) && 'extension-button-disabled'
            )}
            onClick={handleSave}
            disabled={isLoading || !title.trim() || !content.trim()}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Save Prompt</span>
              </>
            )}
          </button>
        </div>
      </div>

      {capturedContent && (
        <div className="capture-info">
          <div className="capture-info-header">
            <span className="capture-info-icon">ℹ️</span>
            <span className="capture-info-title">Captured from:</span>
          </div>
          <div className="capture-info-content">
            <div className="capture-info-url">
              {capturedContent.url}
            </div>
            <div className="capture-info-time">
              {new Date(capturedContent.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptureTab;