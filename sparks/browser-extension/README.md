# Sparks Browser Extension

A powerful browser extension for capturing and saving web content as prompts, seamlessly integrated with the main Sparks application.

## Features

- 📝 **Quick Capture**: Capture selected text or entire pages with keyboard shortcuts
- 🔗 **Seamless Integration**: Sync with your main Sparks application account
- 📚 **Library Management**: View and manage your saved prompts
- ⚙️ **Customizable Settings**: Configure capture preferences and shortcuts
- 🎨 **Modern UI**: Clean, responsive interface matching the main application

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- A running Sparks main application
- Supabase project credentials

### Installation

1. **Clone and navigate to the extension directory:**
   ```bash
   cd browser-extension
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   PLASMO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   PLASMO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   PLASMO_PUBLIC_MAIN_APP_URL=http://localhost:3000
   ```

4. **Build the extension:**
   ```bash
   npm run build
   ```

5. **Load the extension in your browser:**
   - Open Chrome/Edge and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `build/chrome-mv3-dev` folder

### Development

1. **Start development mode:**
   ```bash
   npm run dev
   ```

2. **The extension will auto-reload when you make changes**

3. **Type checking:**
   ```bash
   npm run type-check
   ```

4. **Clean build artifacts:**
   ```bash
   npm run clean
   ```

## Usage

### Keyboard Shortcuts

- `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac): Quick capture selected text
- `Ctrl+Shift+H` (or `Cmd+Shift+H` on Mac): Toggle highlight mode
- `Escape`: Exit highlight mode

### Capturing Content

1. **Text Selection**: Select any text on a webpage and use the keyboard shortcut or right-click context menu
2. **Page Capture**: Use the extension popup to capture entire page information
3. **Highlight Mode**: Enter highlight mode to interactively select elements

### Managing Prompts

- View all your prompts in the Library tab
- Search and filter by category or tags
- Copy prompts to clipboard
- Open prompts in the main application
- Delete unwanted prompts

## Architecture

### File Structure

```
src/
├── background/          # Service worker for API communication
├── contents/           # Content scripts for webpage interaction
├── popup/             # Main extension popup UI
├── components/        # Reusable React components
├── hooks/            # Custom React hooks
├── lib/              # Utilities and configurations
└── store/            # State management
```

### Key Components

- **Background Service Worker**: Handles API communication, context menus, and extension lifecycle
- **Content Scripts**: Inject functionality into web pages for text capture and interaction
- **Popup Interface**: Main UI for capturing, viewing, and managing prompts
- **Authentication**: Seamless integration with Supabase auth from main application
- **State Management**: Zustand store with Chrome storage persistence

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PLASMO_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `PLASMO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `PLASMO_PUBLIC_MAIN_APP_URL` | URL of your main Sparks application | Yes |
| `PLASMO_PUBLIC_ENABLE_DEBUG` | Enable debug logging | No |

### Extension Settings

Users can configure:
- Auto-save captured content
- Show capture tooltips
- Enable/disable keyboard shortcuts
- Default category for new prompts
- Theme preferences

## Troubleshooting

### Common Issues

1. **Authentication not working**:
   - Ensure you're signed in to the main Sparks application
   - Check that Supabase credentials are correct
   - Try refreshing the extension

2. **Content not capturing**:
   - Check that the extension has permission for the current website
   - Ensure content scripts are properly loaded
   - Try reloading the page

3. **Build errors**:
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check that all environment variables are set
   - Ensure Node.js version is 18+

### Debug Mode

Enable debug mode by setting `PLASMO_PUBLIC_ENABLE_DEBUG=true` in your `.env` file. This will:
- Show detailed error messages
- Log API requests and responses
- Display additional debugging information in the popup

## Contributing

1. Follow the existing code style and patterns
2. Add appropriate TypeScript types
3. Test thoroughly across different websites
4. Update documentation for new features

## Security

- Never commit `.env` files with real credentials
- The extension only requests necessary permissions
- All API communication is encrypted via HTTPS
- User data is stored securely in Supabase

## License

This project is part of the Sparks application suite. See the main project license for details.