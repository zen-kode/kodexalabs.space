import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Text processing utilities
export function extractTextFromSelection(): string | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }
  return selection.toString().trim();
}

export function getSelectionContext(selection: string, contextLength = 100): string {
  const range = window.getSelection()?.getRangeAt(0);
  if (!range) return selection;

  const container = range.commonAncestorContainer;
  const fullText = container.textContent || '';
  const selectionStart = fullText.indexOf(selection);
  
  if (selectionStart === -1) return selection;

  const start = Math.max(0, selectionStart - contextLength);
  const end = Math.min(fullText.length, selectionStart + selection.length + contextLength);
  
  return fullText.substring(start, end);
}

export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .trim();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// URL and page utilities
export function getCurrentPageInfo() {
  return {
    url: window.location.href,
    title: document.title,
    domain: window.location.hostname,
    timestamp: new Date().toISOString()
  };
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Storage utilities
export function setStorageItem(key: string, value: any): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => {
      resolve();
    });
  });
}

export function getStorageItem<T>(key: string): Promise<T | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] || null);
    });
  });
}

export function removeStorageItem(key: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove([key], () => {
      resolve();
    });
  });
}

// Message passing utilities
export function sendMessageToBackground(message: any): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

export function sendMessageToTab(tabId: number, message: any): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

// Validation utilities
export function validatePromptData(data: any): boolean {
  return (
    typeof data.title === 'string' &&
    data.title.trim().length > 0 &&
    typeof data.content === 'string' &&
    data.content.trim().length > 0
  );
}

// Time utilities
export function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

// Error handling utilities
export function handleExtensionError(error: any, context: string): void {
  console.error(`[Sparks Extension] Error in ${context}:`, error);
  
  // Send error to background script for logging
  sendMessageToBackground({
    type: 'ERROR_LOG',
    payload: {
      error: error.message || error,
      context,
      timestamp: new Date().toISOString(),
      url: window.location?.href
    }
  }).catch(() => {
    // Silently fail if background script is not available
  });
}

// Theme utilities
export function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: 'light' | 'dark' | 'system'): void {
  const actualTheme = theme === 'system' ? getSystemTheme() : theme;
  
  if (actualTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}