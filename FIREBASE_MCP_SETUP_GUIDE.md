# Firebase Studio MCP Configuration Guide

## Overview

This guide helps you configure Model Context Protocol (MCP) servers for Firebase Studio integration, enabling enhanced AI-assisted development with external tools and data sources.

## What's Configured

Your project now includes MCP server configuration for:
- **GitHub** - Repository management and code operations
- **Puppeteer** - Browser automation and testing
- **Brave Search** - Web search capabilities
- **TestSprite** - Automated testing framework
- **shadcn/ui** - UI component library integration

## Configuration Files

### 1. MCP Server Configuration (`.idx/mcp.json`)

✅ **Already Created** - Defines all available MCP servers and their connection parameters.

### 2. Environment Variables (`.env`)

✅ **Already Created** - Contains API keys and configuration for MCP servers.

## Setup Instructions

### Step 1: Configure API Keys

Edit the `.env` file in your project root and replace placeholder values:

```bash
# GitHub Personal Access Token
# 1. Go to https://github.com/settings/tokens
# 2. Generate a new token with repo permissions
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your_actual_token_here

# Brave Search API Key
# 1. Go to https://api.search.brave.com/app/keys
# 2. Create a new API key
BRAVE_API_KEY=BSA_your_actual_api_key_here
```

### Step 2: Firebase Configuration

Your Firebase environment variables are already configured in `sparks/.env`. Make sure to update:

```bash
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-actual-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=your-actual-api-key
# ... other Firebase config values
```

### Step 3: Verify MCP Server Installation

Run these commands to ensure MCP servers are properly installed:

```bash
# Check if Firebase CLI is installed
firebase --version

# Install Firebase CLI if needed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Verify project configuration
firebase projects:list
```

## Using MCP Servers in Firebase Studio

### GitHub Integration

```
# Example prompts you can use:
"Create a new branch for feature development"
"Push current changes to GitHub repository"
"Create a pull request with current changes"
"Search for similar code patterns in the repository"
```

### Puppeteer for Testing

```
# Example prompts:
"Take a screenshot of the current application"
"Test the login flow automatically"
"Navigate to the dashboard and verify elements"
"Run end-to-end tests on the application"
```

### Brave Search for Research

```
# Example prompts:
"Search for Firebase best practices"
"Find documentation about Next.js deployment"
"Look up solutions for authentication issues"
"Research React component patterns"
```

### TestSprite for Quality Assurance

```
# Example prompts:
"Generate test cases for the authentication system"
"Create integration tests for the database layer"
"Analyze code coverage and suggest improvements"
"Run automated testing suite"
```

## Firebase Studio Workflow Enhancement

With MCP servers configured, Firebase Studio can now:

1. **Code Management**: Automatically commit, push, and manage Git operations
2. **Testing**: Run automated tests and generate test cases
3. **Research**: Search for solutions and documentation
4. **UI Development**: Access shadcn/ui components and patterns
5. **Browser Testing**: Automate user interface testing

## Troubleshooting

### Common Issues

**MCP Server Not Found**
- Ensure the server paths in `.idx/mcp.json` are correct
- Check if the MCP server packages are installed globally

**Authentication Errors**
- Verify API keys in `.env` file are correct and active
- Check token permissions for GitHub integration

**Firebase Connection Issues**
- Run `firebase login` to authenticate
- Verify project ID matches your Firebase console
- Check network connectivity and firewall settings

### Verification Commands

```bash
# Test Firebase connection
firebase projects:list

# Verify environment variables
echo $GITHUB_PERSONAL_ACCESS_TOKEN
echo $BRAVE_API_KEY

# Check MCP configuration
cat .idx/mcp.json
```

## Advanced Configuration

### Custom MCP Servers

To add additional MCP servers, edit `.idx/mcp.json`:

```json
{
  "mcpServers": {
    "your-custom-server": {
      "command": "node",
      "args": ["path/to/your/server.js"],
      "env": {
        "CUSTOM_API_KEY": "${CUSTOM_API_KEY}"
      }
    }
  }
}
```

### Environment-Specific Configuration

Create separate configuration files for different environments:
- `.idx/mcp.development.json`
- `.idx/mcp.production.json`

## Security Best Practices

1. **Never commit API keys** - Always use environment variables
2. **Rotate tokens regularly** - Update GitHub and API tokens periodically
3. **Limit permissions** - Use minimal required permissions for tokens
4. **Monitor usage** - Track API usage and set up alerts

## Next Steps

1. ✅ MCP servers configured
2. 🔄 **Update API keys in `.env`**
3. 🔄 **Test Firebase connection**
4. 🔄 **Verify MCP server functionality**
5. 🔄 **Start using enhanced AI assistance**

## Resources

- [Firebase Studio MCP Documentation](https://firebase.blog/posts/2025/07/supercharge-firebase-studio-with-mcp)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- [GitHub API Documentation](https://docs.github.com/en/rest)

---

**Status**: MCP servers configured and ready for use with Firebase Studio
**Last Updated**: 2025-08-25
**Configuration Files**: `.idx/mcp.json`, `.env`, `sparks/.env`