import type { PlasmoCSConfig } from "plasmo";
import { sendMessageToBackground, extractTextFromSelection, getSelectionContext, getCurrentPageInfo, handleExtensionError } from '../lib/utils';
import type { CapturedContent, ExtensionMessage } from '../lib/types';

// Plasmo content script configuration
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false,
  run_at: "document_end"
};

console.log('Sparks Extension Content Script Loaded');

// State management
let isHighlightMode = false;
let highlightedElements: HTMLElement[] = [];
let captureOverlay: HTMLElement | null = null;

// Initialize content script
function initializeContentScript() {
  try {
    setupMessageListener();
    setupKeyboardShortcuts();
    setupSelectionHandler();
    injectStyles();
    console.log('Content script initialized successfully');
  } catch (error) {
    handleExtensionError(error, 'initializeContentScript');
  }
}

// Set up message listener for background script communication
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
    handleContentMessage(message)
      .then(response => sendResponse(response))
      .catch(error => {
        handleExtensionError(error, 'contentMessageHandler');
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Keep message channel open
  });
}

// Handle messages from background script
async function handleContentMessage(message: ExtensionMessage) {
  switch (message.type) {
    case 'GET_SELECTION_CONTEXT':
      return handleGetSelectionContext(message.payload?.selectedText);
    
    case 'CAPTURE_PAGE_CONTENT':
      return handleCapturePageContent();
    
    case 'TOGGLE_HIGHLIGHT_MODE':
      return handleToggleHighlightMode();
    
    case 'GET_SESSION':
      return handleGetSessionRequest();
    
    default:
      throw new Error(`Unknown content message type: ${message.type}`);
  }
}

// Handle getting selection context
async function handleGetSelectionContext(selectedText?: string) {
  try {
    const text = selectedText || extractTextFromSelection();
    if (!text) {
      return { success: false, error: 'No text selected' };
    }
    
    const context = getSelectionContext(text, 200);
    const pageInfo = getCurrentPageInfo();
    
    return {
      success: true,
      data: {
        selectedText: text,
        context,
        pageInfo
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Handle capturing page content
async function handleCapturePageContent() {
  try {
    const content = extractPageContent();
    const pageInfo = getCurrentPageInfo();
    
    return {
      success: true,
      data: {
        content,
        pageInfo
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Handle session request from main app
async function handleGetSessionRequest() {
  try {
    // Try to get session from main app's local storage or cookies
    const session = getMainAppSession();
    return {
      success: true,
      data: { session }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Extract meaningful content from the page
function extractPageContent(): string {
  // Remove script and style elements
  const elementsToRemove = document.querySelectorAll('script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar');
  const tempDoc = document.cloneNode(true) as Document;
  
  elementsToRemove.forEach(el => {
    const tempEl = tempDoc.querySelector(el.tagName.toLowerCase());
    if (tempEl) tempEl.remove();
  });
  
  // Try to find main content area
  const contentSelectors = [
    'main',
    'article',
    '[role="main"]',
    '.content',
    '.main-content',
    '.post-content',
    '.entry-content',
    '#content',
    '#main'
  ];
  
  let mainContent = '';
  
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      mainContent = element.textContent?.trim() || '';
      if (mainContent.length > 100) break;
    }
  }
  
  // Fallback to body content if no main content found
  if (!mainContent || mainContent.length < 100) {
    mainContent = document.body.textContent?.trim() || '';
  }
  
  // Clean up the content
  return mainContent
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim()
    .substring(0, 5000); // Limit to 5000 characters
}

// Get session from main app (if on same domain)
function getMainAppSession() {
  try {
    // Try to get from localStorage first
    const authKey = 'supabase.auth.token';
    const authData = localStorage.getItem(authKey);
    
    if (authData) {
      return JSON.parse(authData);
    }
    
    // Try alternative storage keys
    const altKeys = [
      'sparks-auth',
      'nextn-auth',
      'supabase-auth-token'
    ];
    
    for (const key of altKeys) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          return JSON.parse(data);
        } catch {
          continue;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting main app session:', error);
    return null;
  }
}

// Set up keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    try {
      // Ctrl+Shift+S - Capture selection
      if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        handleQuickCapture();
      }
      
      // Ctrl+Shift+H - Toggle highlight mode
      if (event.ctrlKey && event.shiftKey && event.key === 'H') {
        event.preventDefault();
        toggleHighlightMode();
      }
      
      // Escape - Exit highlight mode
      if (event.key === 'Escape' && isHighlightMode) {
        event.preventDefault();
        exitHighlightMode();
      }
    } catch (error) {
      handleExtensionError(error, 'keyboardShortcuts');
    }
  });
}

// Handle quick capture shortcut
async function handleQuickCapture() {
  try {
    const selectedText = extractTextFromSelection();
    if (!selectedText) {
      showNotification('Please select some text first', 'warning');
      return;
    }
    
    const context = getSelectionContext(selectedText, 200);
    const pageInfo = getCurrentPageInfo();
    
    // Send to background script for processing
    const response = await sendMessageToBackground({
      type: 'QUICK_SAVE_SELECTION',
      payload: {
        selectedText,
        context,
        pageInfo
      }
    });
    
    if (response.success) {
      showNotification('Selection saved successfully!', 'success');
    } else {
      showNotification('Failed to save selection', 'error');
    }
  } catch (error) {
    handleExtensionError(error, 'handleQuickCapture');
    showNotification('Error capturing selection', 'error');
  }
}

// Set up selection handler
function setupSelectionHandler() {
  let selectionTimeout: NodeJS.Timeout;
  
  document.addEventListener('mouseup', () => {
    clearTimeout(selectionTimeout);
    selectionTimeout = setTimeout(() => {
      const selection = extractTextFromSelection();
      if (selection && selection.length > 10) {
        showSelectionTooltip();
      } else {
        hideSelectionTooltip();
      }
    }, 300);
  });
  
  document.addEventListener('mousedown', () => {
    hideSelectionTooltip();
  });
}

// Show selection tooltip
function showSelectionTooltip() {
  try {
    hideSelectionTooltip(); // Remove existing tooltip
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    const tooltip = document.createElement('div');
    tooltip.id = 'sparks-selection-tooltip';
    tooltip.className = 'sparks-tooltip';
    tooltip.innerHTML = `
      <button class="sparks-tooltip-btn" data-action="save">
        💾 Save as Prompt
      </button>
      <button class="sparks-tooltip-btn" data-action="capture">
        📋 Quick Capture
      </button>
    `;
    
    tooltip.style.position = 'fixed';
    tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    tooltip.style.zIndex = '10000';
    
    document.body.appendChild(tooltip);
    
    // Add event listeners
    tooltip.addEventListener('click', handleTooltipClick);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      hideSelectionTooltip();
    }, 5000);
  } catch (error) {
    handleExtensionError(error, 'showSelectionTooltip');
  }
}

// Hide selection tooltip
function hideSelectionTooltip() {
  const tooltip = document.getElementById('sparks-selection-tooltip');
  if (tooltip) {
    tooltip.remove();
  }
}

// Handle tooltip clicks
async function handleTooltipClick(event: Event) {
  try {
    const target = event.target as HTMLElement;
    const action = target.getAttribute('data-action');
    
    if (!action) return;
    
    const selectedText = extractTextFromSelection();
    if (!selectedText) return;
    
    hideSelectionTooltip();
    
    switch (action) {
      case 'save':
        await openPopupWithSelection(selectedText);
        break;
      case 'capture':
        await handleQuickCapture();
        break;
    }
  } catch (error) {
    handleExtensionError(error, 'handleTooltipClick');
  }
}

// Open popup with selected text
async function openPopupWithSelection(selectedText: string) {
  try {
    const context = getSelectionContext(selectedText, 200);
    const pageInfo = getCurrentPageInfo();
    
    await sendMessageToBackground({
      type: 'OPEN_POPUP_WITH_DATA',
      payload: {
        type: 'SELECTION',
        content: selectedText,
        context,
        ...pageInfo
      }
    });
  } catch (error) {
    handleExtensionError(error, 'openPopupWithSelection');
  }
}

// Toggle highlight mode
function toggleHighlightMode() {
  if (isHighlightMode) {
    exitHighlightMode();
  } else {
    enterHighlightMode();
  }
}

// Enter highlight mode
function enterHighlightMode() {
  isHighlightMode = true;
  document.body.style.cursor = 'crosshair';
  showNotification('Highlight mode active - Click elements to capture', 'info');
  
  // Add click listeners to all elements
  document.addEventListener('click', handleHighlightClick, true);
  document.addEventListener('mouseover', handleHighlightHover);
  document.addEventListener('mouseout', handleHighlightOut);
}

// Exit highlight mode
function exitHighlightMode() {
  isHighlightMode = false;
  document.body.style.cursor = '';
  
  // Remove event listeners
  document.removeEventListener('click', handleHighlightClick, true);
  document.removeEventListener('mouseover', handleHighlightHover);
  document.removeEventListener('mouseout', handleHighlightOut);
  
  // Clear highlights
  clearHighlights();
  hideNotification();
}

// Handle highlight click
function handleHighlightClick(event: Event) {
  event.preventDefault();
  event.stopPropagation();
  
  const element = event.target as HTMLElement;
  const content = element.textContent?.trim();
  
  if (content && content.length > 10) {
    captureElementContent(element);
  }
}

// Handle highlight hover
function handleHighlightHover(event: Event) {
  const element = event.target as HTMLElement;
  if (element.textContent?.trim() && element.textContent.trim().length > 10) {
    element.classList.add('sparks-highlight-hover');
  }
}

// Handle highlight out
function handleHighlightOut(event: Event) {
  const element = event.target as HTMLElement;
  element.classList.remove('sparks-highlight-hover');
}

// Capture element content
async function captureElementContent(element: HTMLElement) {
  try {
    const content = element.textContent?.trim() || '';
    const pageInfo = getCurrentPageInfo();
    
    await sendMessageToBackground({
      type: 'OPEN_POPUP_WITH_DATA',
      payload: {
        type: 'ELEMENT_CAPTURE',
        content,
        elementTag: element.tagName.toLowerCase(),
        ...pageInfo
      }
    });
    
    exitHighlightMode();
  } catch (error) {
    handleExtensionError(error, 'captureElementContent');
  }
}

// Clear highlights
function clearHighlights() {
  highlightedElements.forEach(el => {
    el.classList.remove('sparks-highlight-hover');
  });
  highlightedElements = [];
}

// Show notification
function showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
  try {
    hideNotification(); // Remove existing notification
    
    const notification = document.createElement('div');
    notification.id = 'sparks-notification';
    notification.className = `sparks-notification sparks-notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      hideNotification();
    }, 3000);
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

// Hide notification
function hideNotification() {
  const notification = document.getElementById('sparks-notification');
  if (notification) {
    notification.remove();
  }
}

// Inject styles
function injectStyles() {
  const styles = `
    .sparks-tooltip {
      background: #1f2937;
      color: white;
      padding: 8px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      display: flex;
      gap: 4px;
      animation: sparks-fade-in 0.2s ease-out;
    }
    
    .sparks-tooltip-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      transition: background-color 0.2s;
    }
    
    .sparks-tooltip-btn:hover {
      background: #2563eb;
    }
    
    .sparks-highlight-hover {
      background-color: rgba(59, 130, 246, 0.2) !important;
      outline: 2px solid #3b82f6 !important;
      outline-offset: 1px !important;
    }
    
    .sparks-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 6px;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 10001;
      animation: sparks-slide-in 0.3s ease-out;
      max-width: 300px;
    }
    
    .sparks-notification-success {
      background: #10b981;
    }
    
    .sparks-notification-error {
      background: #ef4444;
    }
    
    .sparks-notification-warning {
      background: #f59e0b;
    }
    
    .sparks-notification-info {
      background: #3b82f6;
    }
    
    @keyframes sparks-fade-in {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes sparks-slide-in {
      from { opacity: 0; transform: translateX(100%); }
      to { opacity: 1; transform: translateX(0); }
    }
  `;
  
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

// Handle toggle highlight mode message
async function handleToggleHighlightMode() {
  toggleHighlightMode();
  return { success: true, data: { isHighlightMode } };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
  initializeContentScript();
}