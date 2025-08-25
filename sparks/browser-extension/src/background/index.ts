import { supabase, getExtensionSession, signInWithMainApp } from '../lib/supabase';
import type { ExtensionMessage, ExtensionMessageResponse, SavePromptRequest } from '../lib/types';
import { handleExtensionError } from '../lib/utils';

// Background script for Sparks browser extension
console.log('Sparks Extension Background Script Loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    // Set up initial context menu
    await setupContextMenu();
    
    // Try to authenticate with main app
    await attemptAutoAuthentication();
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('Extension started');
  await attemptAutoAuthentication();
});

// Set up context menu items
async function setupContextMenu() {
  try {
    // Remove existing context menus
    await chrome.contextMenus.removeAll();
    
    // Add context menu for selected text
    chrome.contextMenus.create({
      id: 'save-selection-as-prompt',
      title: 'Save selection as prompt',
      contexts: ['selection'],
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    });
    
    // Add context menu for page
    chrome.contextMenus.create({
      id: 'capture-page-content',
      title: 'Capture page for prompt',
      contexts: ['page'],
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    });
    
    console.log('Context menu set up successfully');
  } catch (error) {
    handleExtensionError(error, 'setupContextMenu');
  }
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    if (!tab?.id) return;
    
    switch (info.menuItemId) {
      case 'save-selection-as-prompt':
        await handleSaveSelection(info, tab);
        break;
      case 'capture-page-content':
        await handleCapturePage(info, tab);
        break;
    }
  } catch (error) {
    handleExtensionError(error, 'contextMenuClick');
  }
});

// Handle saving selected text as prompt
async function handleSaveSelection(info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab) {
  try {
    const selectedText = info.selectionText;
    if (!selectedText || !tab.id) return;
    
    // Send message to content script to get more context
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'GET_SELECTION_CONTEXT',
      payload: { selectedText }
    });
    
    // Open popup with pre-filled data
    await openPopupWithData({
      type: 'SELECTION',
      content: selectedText,
      context: response?.context || '',
      url: tab.url || '',
      title: tab.title || '',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    handleExtensionError(error, 'handleSaveSelection');
  }
}

// Handle capturing page content
async function handleCapturePage(info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab) {
  try {
    if (!tab.id) return;
    
    // Send message to content script to capture page content
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'CAPTURE_PAGE_CONTENT'
    });
    
    if (response?.content) {
      await openPopupWithData({
        type: 'PAGE_CAPTURE',
        content: response.content,
        url: tab.url || '',
        title: tab.title || '',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    handleExtensionError(error, 'handleCapturePage');
  }
}

// Open popup with pre-filled data
async function openPopupWithData(data: any) {
  try {
    // Store data temporarily
    await chrome.storage.local.set({ 'popup-prefill-data': data });
    
    // Open popup
    await chrome.action.openPopup();
    
  } catch (error) {
    handleExtensionError(error, 'openPopupWithData');
  }
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(response => sendResponse(response))
    .catch(error => {
      handleExtensionError(error, 'messageHandler');
      sendResponse({ success: false, error: error.message });
    });
  
  return true; // Keep message channel open for async response
});

// Main message handler
async function handleMessage(
  message: ExtensionMessage, 
  sender: chrome.runtime.MessageSender
): Promise<ExtensionMessageResponse> {
  switch (message.type) {
    case 'SAVE_PROMPT':
      return await handleSavePrompt(message.payload as SavePromptRequest);
    
    case 'GET_AUTH_STATUS':
      return await handleGetAuthStatus();
    
    case 'AUTHENTICATE':
      return await handleAuthenticate();
    
    case 'SIGN_OUT':
      return await handleSignOut();
    
    case 'GET_USER_PROMPTS':
      return await handleGetUserPrompts(message.payload?.limit);
    
    case 'ERROR_LOG':
      return await handleErrorLog(message.payload);
    
    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

// Handle saving prompt to database
async function handleSavePrompt(request: SavePromptRequest): Promise<ExtensionMessageResponse> {
  try {
    const session = await getExtensionSession();
    if (!session?.user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    const promptData = {
      user_id: session.user.id,
      title: request.title,
      content: request.content,
      description: request.description || null,
      category: request.category || 'web-capture',
      tags: request.tags || [],
      metadata: {
        source: 'extension',
        url: request.sourceUrl,
        capturedAt: request.timestamp,
        ...request.metadata
      }
    };
    
    const { data, error } = await supabase
      .from('prompts')
      .insert(promptData)
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Handle authentication status check
async function handleGetAuthStatus(): Promise<ExtensionMessageResponse> {
  try {
    const session = await getExtensionSession();
    return {
      success: true,
      data: {
        isAuthenticated: !!session?.user,
        user: session?.user || null,
        session: session
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Handle authentication
async function handleAuthenticate(): Promise<ExtensionMessageResponse> {
  try {
    const success = await signInWithMainApp();
    if (success) {
      const session = await getExtensionSession();
      return {
        success: true,
        data: {
          isAuthenticated: true,
          user: session?.user || null,
          session: session
        }
      };
    } else {
      return { success: false, error: 'Failed to authenticate with main app' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Handle sign out
async function handleSignOut(): Promise<ExtensionMessageResponse> {
  try {
    await supabase.auth.signOut();
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Handle getting user prompts
async function handleGetUserPrompts(limit = 10): Promise<ExtensionMessageResponse> {
  try {
    const session = await getExtensionSession();
    if (!session?.user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Handle error logging
async function handleErrorLog(errorData: any): Promise<ExtensionMessageResponse> {
  try {
    // Log error to console
    console.error('[Extension Error]', errorData);
    
    // In a production environment, you might want to send this to a logging service
    // For now, we'll just store it locally for debugging
    const errors = await chrome.storage.local.get(['error-logs']) || { 'error-logs': [] };
    const errorLogs = errors['error-logs'] || [];
    
    errorLogs.push({
      ...errorData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 errors
    const recentErrors = errorLogs.slice(-50);
    await chrome.storage.local.set({ 'error-logs': recentErrors });
    
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Attempt automatic authentication on startup
async function attemptAutoAuthentication() {
  try {
    console.log('Attempting auto-authentication...');
    const success = await signInWithMainApp();
    if (success) {
      console.log('Auto-authentication successful');
    } else {
      console.log('Auto-authentication failed - user needs to sign in manually');
    }
  } catch (error) {
    console.log('Auto-authentication error:', error);
  }
}

// Handle tab updates to refresh context menu
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Refresh context menu for new page
    await setupContextMenu();
  }
});

// Keep service worker alive
setInterval(() => {
  console.log('Service worker heartbeat');
}, 30000); // Every 30 seconds