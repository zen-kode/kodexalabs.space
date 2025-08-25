# Building the PromptVerse Browser Extension

This document outlines the steps and considerations for creating the PromptVerse browser extension. The extension will be built using modern web technologies and will integrate seamlessly with the main PromptVerse web application.

## 1. Core Objectives

-   **Capture Content:** Allow users to highlight text on any webpage and send it directly to their PromptVerse library with one click.
-   **Contextual Saving:** Automatically save the source URL, page title, and captured text to preserve context.
-   **In-Page AI Toolkit:** Provide access to core AI functions (enhance, clean, summarize) directly in a context menu on selected text.
-   **Seamless Authentication:** The extension should use the user's existing PromptVerse login session.

## 2. Technology Stack

-   **Framework:** Plasmo (a React & TypeScript framework for building browser extensions). This simplifies the manifest creation, build process, and content script injection.
-   **UI:** React, Tailwind CSS, and ShadCN UI components (shared from the monorepo).
-   **State Management:** Zustand (shared from the monorepo).
-   **Communication:** Web extension messaging APIs for communication between the popup, content scripts, and background service worker.

## 3. File Structure (`apps/browser-extension`)

```
/apps/browser-extension
├── package.json
├── tsconfig.json
├── plasmo.config.ts
├── assets/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── popup.tsx               # Main UI for the extension popup
├── content.tsx             # Content script injected into web pages
├── background.ts           # Background service worker for handling events
└── lib/
    ├── auth.ts             # Logic for managing auth state
    └── api.ts              # Functions to call the PromptVerse backend
```

## 4. Development Steps

1.  **Setup Plasmo:** Initialize a new Plasmo project within the `apps/browser-extension` directory.
2.  **Authentication:**
    -   Implement a mechanism for the extension to securely obtain an auth token from the main web application (e.g., by reading cookies or using a dedicated endpoint).
    -   The background script will manage the user's authentication state.
3.  **Content Script & Context Menu:**
    -   Create a content script that adds a "Send to PromptVerse" option to the right-click context menu when text is selected.
    -   When clicked, the content script will capture the selected text, page URL, and title.
4.  **Background Service Worker:**
    -   The background script will listen for messages from the content script.
    -   On receiving content, it will make a secure API call to the PromptVerse backend to save the new prompt to the user's library.
5.  **Popup UI:**
    -   Design a simple popup that shows the user's login status.
    -   Add a quick-add form to the popup to manually create a new prompt without leaving the current page.
    -   Display recent prompts from the user's library.
6.  **Build & Test:**
    -   Use Plasmo's build commands to compile the extension.
    -   Load the unpacked extension into Chrome/Firefox for testing.
    -   Test content capture on various websites.
    -   Verify that authentication and data syncing work correctly.
