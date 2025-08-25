# Development Mode Guide - Supabase Conservation

*Comprehensive guide for conserving Supabase free tier resources during development*

## Overview

This guide explains how the application automatically conserves Supabase's free tier quota (5,000 requests/month) during development by using a mock database system that provides full functionality without making external API calls.

## Current Configuration

### Development Mode (Active)

The application is currently configured for development mode with:

- **Database Provider**: Mock Database (no external calls)
- **Supabase Integration**: Disabled and commented out
- **Firebase Config**: Mock/dummy values
- **API Quota Usage**: 0 requests (fully conserved)

### Configuration Files

#### `.env` Configuration
```env
# Database Provider Selection - DEVELOPMENT MODE
# Using Firebase to conserve Supabase free tier (5,000 requests/month)
NEXT_PUBLIC_DATABASE_PROVIDER=firebase

# Supabase Configuration - DISABLED FOR DEVELOPMENT
# Uncomment and use these for production deployment
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Firebase Configuration - ACTIVE FOR DEVELOPMENT
# Using dummy/mock Firebase config to avoid external API calls
NEXT_PUBLIC_FIREBASE_API_KEY=development-mode-no-api-calls
# ... other mock Firebase configs
```

## How It Works

### Automatic Detection

The system automatically detects development mode based on:

1. **Environment Variable**: `NEXT_PUBLIC_DATABASE_PROVIDER=firebase`
2. **Missing Supabase URL**: No valid Supabase URL configured
3. **Development Environment**: `NODE_ENV=development`
4. **Dummy Credentials**: Mock/dummy API keys detected

### Mock Database Features

The mock database provides full functionality:

#### ✅ **Authentication**
- Sign in/up with any email (always succeeds)
- Session management
- Auth state changes
- User profiles

#### ✅ **Data Operations**
- Create, read, update, delete prompts
- User profile management
- Real-time subscriptions (simulated)
- Data persistence in memory

#### ✅ **Development Features**
- Pre-populated sample data
- Realistic API delays (200-800ms)
- Console logging for debugging
- Statistics and utilities

### Sample Data Included

The mock database includes:
- **Sample User**: `dev@kodexalabs.space`
- **Sample Prompts**: 3 pre-created prompts
- **Categories**: Marketing, Development, Creative
- **Realistic Timestamps**: Spread over recent days

## Development Workflow

### 1. Current State Verification

Check that development mode is active:

```bash
# Check environment configuration
cat .env | grep DATABASE_PROVIDER
# Should show: NEXT_PUBLIC_DATABASE_PROVIDER=firebase

# Start development server
npm run dev:next-only
# Look for console message: "🎭 Development mode detected - using Mock Database"
```

### 2. Working with Mock Data

#### Authentication
```typescript
// Any email works in development
const { user, error } = await signIn('dev@kodexalabs.space', 'any-password')
const { user, error } = await signIn('test@test.com', 'password123')
```

#### Data Operations
```typescript
// All CRUD operations work normally
const { data: prompts } = await getPrompts(userId)
const { data: newPrompt } = await createPrompt({
  title: 'Test Prompt',
  content: 'This is a test prompt',
  category: 'Testing',
  user_id: userId
})
```

### 3. Development Benefits

#### 🚀 **Speed**
- No network latency
- Instant responses
- No rate limiting
- Offline development

#### 💰 **Cost Savings**
- Zero API requests to Supabase
- Full quota preserved for production
- No accidental quota consumption
- Free development environment

#### 🛠️ **Development Features**
- Consistent sample data
- Predictable responses
- Easy debugging
- No external dependencies

## Switching to Production

### When to Switch

Switch to production mode when:
- Development is complete
- Ready for deployment
- Need real user authentication
- Require persistent data storage
- Testing production workflows

### Step 1: Update Environment Variables

Edit `.env` file:

```env
# Change from development to production
NEXT_PUBLIC_DATABASE_PROVIDER=supabase

# Uncomment and configure Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key

# Comment out or remove Firebase mock config
# NEXT_PUBLIC_FIREBASE_API_KEY=development-mode-no-api-calls
# ... other Firebase configs
```

### Step 2: Verify Supabase Setup

```bash
# Test Supabase connection
node test-supabase.js

# Should show:
# ✅ Supabase connection successful!
# ✅ Database access working
```

### Step 3: Database Schema Setup

Ensure your Supabase database has the required tables:

```sql
-- Run in Supabase SQL Editor
CREATE TABLE prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own prompts
CREATE POLICY "Users can only see their own prompts" ON prompts
  FOR ALL USING (auth.uid() = user_id);
```

### Step 4: Test Production Mode

```bash
# Restart development server
npm run dev:next-only

# Look for console message: "Using Supabase Database"
# Test authentication with real credentials
# Verify data persistence
```

## Quick Switch Commands

### Switch to Development Mode

```bash
# Update .env
sed -i 's/NEXT_PUBLIC_DATABASE_PROVIDER=supabase/NEXT_PUBLIC_DATABASE_PROVIDER=firebase/' .env

# Comment out Supabase URLs
sed -i 's/^NEXT_PUBLIC_SUPABASE_URL/#NEXT_PUBLIC_SUPABASE_URL/' .env
sed -i 's/^NEXT_PUBLIC_SUPABASE_ANON_KEY/#NEXT_PUBLIC_SUPABASE_ANON_KEY/' .env

echo "✅ Switched to development mode - Supabase quota conserved"
```

### Switch to Production Mode

```bash
# Update .env
sed -i 's/NEXT_PUBLIC_DATABASE_PROVIDER=firebase/NEXT_PUBLIC_DATABASE_PROVIDER=supabase/' .env

# Uncomment Supabase URLs
sed -i 's/^#NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL/' .env
sed -i 's/^#NEXT_PUBLIC_SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY/' .env

echo "✅ Switched to production mode - Using Supabase"
```

## Monitoring & Debugging

### Development Mode Indicators

Look for these console messages:

```
[DATABASE] 🎭 Development mode detected - using Mock Database to conserve API quotas
[MOCK-DB] 🎭 Mock Database Adapter initialized - NO EXTERNAL API CALLS
[MOCK-DB] 🎭 Mock database initialized with sample data
```

### Production Mode Indicators

```
[DATABASE] Using Supabase Database
[SUPABASE] Connection established
```

### Debug Commands

```bash
# Check current database provider
node -e "console.log('Provider:', process.env.NEXT_PUBLIC_DATABASE_PROVIDER)"

# Test database connection
node -e "import('./src/lib/database-abstraction.js').then(({DatabaseFactory}) => console.log('Mode:', DatabaseFactory.isDevelopmentMode()))"

# View mock database stats (development mode only)
node -e "import('./src/lib/mock-database.js').then(({mockDatabase}) => console.log('Stats:', mockDatabase.getStats()))"
```

## Quota Management

### Supabase Free Tier Limits

- **API Requests**: 5,000/month
- **Database Size**: 500MB
- **Bandwidth**: 5GB
- **Auth Users**: 50,000

### Development Impact

Typical development usage without conservation:
- **Daily Development**: ~200-500 requests
- **Testing/Debugging**: ~100-300 requests
- **Monthly Development**: ~3,000-4,000 requests
- **Remaining for Production**: ~1,000-2,000 requests

### With Mock Database

- **Development Requests**: 0
- **Full Quota Available**: 5,000 requests for production
- **Cost Savings**: 100% quota preservation

## Best Practices

### 1. Development Phase

- ✅ Keep `NEXT_PUBLIC_DATABASE_PROVIDER=firebase`
- ✅ Use mock database for all development
- ✅ Test features with sample data
- ✅ Verify UI/UX without external dependencies

### 2. Testing Phase

- ✅ Periodically test with real Supabase (limited)
- ✅ Verify authentication flows
- ✅ Test data persistence
- ✅ Switch back to mock after testing

### 3. Pre-Production

- ✅ Final testing with Supabase
- ✅ Database schema verification
- ✅ Performance testing
- ✅ Security policy testing

### 4. Production Deployment

- ✅ Switch to `NEXT_PUBLIC_DATABASE_PROVIDER=supabase`
- ✅ Configure production environment variables
- ✅ Monitor quota usage
- ✅ Set up alerts for quota limits

## Troubleshooting

### Issue: Mock Database Not Working

**Symptoms**: Errors about missing database methods

**Solution**:
```bash
# Verify environment variable
echo $NEXT_PUBLIC_DATABASE_PROVIDER
# Should be 'firebase'

# Check for console errors
# Restart development server
npm run dev:next-only
```

### Issue: Accidentally Using Supabase

**Symptoms**: Network requests to supabase.co in browser dev tools

**Solution**:
```bash
# Immediately switch to development mode
sed -i 's/NEXT_PUBLIC_DATABASE_PROVIDER=supabase/NEXT_PUBLIC_DATABASE_PROVIDER=firebase/' .env

# Comment out Supabase credentials
sed -i 's/^NEXT_PUBLIC_SUPABASE/#NEXT_PUBLIC_SUPABASE/' .env

# Restart server
npm run dev:next-only
```

### Issue: Data Not Persisting

**Symptoms**: Data disappears on page refresh

**Expected**: This is normal in development mode (mock database uses memory)

**Solution**: This is intentional for development. Switch to production mode for persistence.

### Issue: Authentication Always Succeeds

**Symptoms**: Any email/password combination works

**Expected**: This is normal in development mode for easy testing

**Solution**: This is intentional for development. Switch to production mode for real authentication.

## Migration Checklist

### From Development to Production

- [ ] Update `NEXT_PUBLIC_DATABASE_PROVIDER=supabase`
- [ ] Uncomment Supabase URL and key
- [ ] Verify Supabase database schema
- [ ] Test authentication with real users
- [ ] Verify data persistence
- [ ] Test all CRUD operations
- [ ] Monitor quota usage
- [ ] Set up production monitoring

### From Production to Development

- [ ] Update `NEXT_PUBLIC_DATABASE_PROVIDER=firebase`
- [ ] Comment out Supabase credentials
- [ ] Verify mock database activation
- [ ] Test with sample data
- [ ] Confirm zero external requests
- [ ] Continue development work

## Advanced Configuration

### Custom Mock Data

Modify `src/lib/mock-database.ts` to add custom sample data:

```typescript
// Add custom prompts
const customPrompts: Prompt[] = [
  {
    id: 'custom-1',
    title: 'Your Custom Prompt',
    content: 'Custom content here',
    category: 'Custom',
    tags: ['custom', 'development'],
    createdAt: new Date().toISOString(),
    user_id: mockUserId
  }
]
```

### Environment-Specific Configuration

Create environment-specific files:

```bash
# Development environment
cp .env .env.development

# Production environment
cp .env .env.production

# Switch environments
cp .env.development .env  # For development
cp .env.production .env   # For production
```

### Automated Switching

Add npm scripts to `package.json`:

```json
{
  "scripts": {
    "dev:mock": "cp .env.development .env && npm run dev:next-only",
    "dev:supabase": "cp .env.production .env && npm run dev:next-only",
    "switch:dev": "cp .env.development .env",
    "switch:prod": "cp .env.production .env"
  }
}
```

## Enhanced Development Workflow

### 1. Interactive Development Server

```bash
# Start interactive development server
npm run dev
```

This command will:
- Display a welcome banner with system information
- Auto-detect your backend configuration
- Provide an interactive menu for backend selection
- Validate environment variables
- Start the appropriate development servers

### 2. Direct Backend Selection

```bash
# Firebase with Genkit AI integration
npm run dev:firebase

# Supabase for production-ready development
npm run dev:supabase

# Automatic detection based on .env file
npm run dev:auto
```

### 3. Development Utilities

```bash
# Check current configuration
npm run dev:status

# Setup environment interactively
npm run dev:setup

# Fallback options
npm run dev:next-only  # Next.js only
npm run dev:simple     # Next.js on port 9002
```

### 3. Development Benefits

#### 🚀 **Speed**
- No network latency
- Instant responses
- No rate limiting
- Offline development

#### 💰 **Cost Savings**
- Zero API requests to Supabase
- Full quota preserved for production
- No accidental quota consumption
- Free development environment

#### 🛠️ **Development Features**
- Consistent sample data
- Predictable responses
- Easy debugging
- No external dependencies

## Switching to Production

### When to Switch

Switch to production mode when:
- Development is complete
- Ready for deployment
- Need real user authentication
- Require persistent data storage
- Testing production workflows

### Step 1: Update Environment Variables

Edit `.env` file:

```env
# Change from development to production
NEXT_PUBLIC_DATABASE_PROVIDER=supabase

# Uncomment and configure Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key

# Comment out or remove Firebase mock config
# NEXT_PUBLIC_FIREBASE_API_KEY=development-mode-no-api-calls
# ... other Firebase configs
```

### Step 2: Verify Supabase Setup

```bash
# Test Supabase connection
node test-supabase.js

# Should show:
# ✅ Supabase connection successful!
# ✅ Database access working
```

### Step 3: Database Schema Setup

Ensure your Supabase database has the required tables:

```sql
-- Run in Supabase SQL Editor
CREATE TABLE prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own prompts
CREATE POLICY "Users can only see their own prompts" ON prompts
  FOR ALL USING (auth.uid() = user_id);
```

### Step 4: Test Production Mode

```bash
# Restart development server
npm run dev:next-only

# Look for console message: "Using Supabase Database"
# Test authentication with real credentials
# Verify data persistence
```

## Quick Switch Commands

### Switch to Development Mode

```bash
# Update .env
sed -i 's/NEXT_PUBLIC_DATABASE_PROVIDER=supabase/NEXT_PUBLIC_DATABASE_PROVIDER=firebase/' .env

# Comment out Supabase URLs
sed -i 's/^NEXT_PUBLIC_SUPABASE_URL/#NEXT_PUBLIC_SUPABASE_URL/' .env
sed -i 's/^NEXT_PUBLIC_SUPABASE_ANON_KEY/#NEXT_PUBLIC_SUPABASE_ANON_KEY/' .env

echo "✅ Switched to development mode - Supabase quota conserved"
```

### Switch to Production Mode

```bash
# Update .env
sed -i 's/NEXT_PUBLIC_DATABASE_PROVIDER=firebase/NEXT_PUBLIC_DATABASE_PROVIDER=supabase/' .env

# Uncomment Supabase URLs
sed -i 's/^#NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL/' .env
sed -i 's/^#NEXT_PUBLIC_SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY/' .env

echo "✅ Switched to production mode - Using Supabase"
```

## Monitoring & Debugging

### Development Mode Indicators

Look for these console messages:

```
[DATABASE] 🎭 Development mode detected - using Mock Database to conserve API quotas
[MOCK-DB] 🎭 Mock Database Adapter initialized - NO EXTERNAL API CALLS
[MOCK-DB] 🎭 Mock database initialized with sample data
```

### Production Mode Indicators

```
[DATABASE] Using Supabase Database
[SUPABASE] Connection established
```

### Debug Commands

```bash
# Check current database provider
node -e "console.log('Provider:', process.env.NEXT_PUBLIC_DATABASE_PROVIDER)"

# Test database connection
node -e "import('./src/lib/database-abstraction.js').then(({DatabaseFactory}) => console.log('Mode:', DatabaseFactory.isDevelopmentMode()))"

# View mock database stats (development mode only)
node -e "import('./src/lib/mock-database.js').then(({mockDatabase}) => console.log('Stats:', mockDatabase.getStats()))"
```

## Quota Management

### Supabase Free Tier Limits

- **API Requests**: 5,000/month
- **Database Size**: 500MB
- **Bandwidth**: 5GB
- **Auth Users**: 50,000

### Development Impact

Typical development usage without conservation:
- **Daily Development**: ~200-500 requests
- **Testing/Debugging**: ~100-300 requests
- **Monthly Development**: ~3,000-4,000 requests
- **Remaining for Production**: ~1,000-2,000 requests

### With Mock Database

- **Development Requests**: 0
- **Full Quota Available**: 5,000 requests for production
- **Cost Savings**: 100% quota preservation

## Best Practices

### 1. Development Phase

- ✅ Keep `NEXT_PUBLIC_DATABASE_PROVIDER=firebase`
- ✅ Use mock database for all development
- ✅ Test features with sample data
- ✅ Verify UI/UX without external dependencies

### 2. Testing Phase

- ✅ Periodically test with real Supabase (limited)
- ✅ Verify authentication flows
- ✅ Test data persistence
- ✅ Switch back to mock after testing

### 3. Pre-Production

- ✅ Final testing with Supabase
- ✅ Database schema verification
- ✅ Performance testing
- ✅ Security policy testing

### 4. Production Deployment

- ✅ Switch to `NEXT_PUBLIC_DATABASE_PROVIDER=supabase`
- ✅ Configure production environment variables
- ✅ Monitor quota usage
- ✅ Set up alerts for quota limits

## Troubleshooting

### Issue: Mock Database Not Working

**Symptoms**: Errors about missing database methods

**Solution**:
```bash
# Verify environment variable
echo $NEXT_PUBLIC_DATABASE_PROVIDER
# Should be 'firebase'

# Check for console errors
# Restart development server
npm run dev:next-only
```

### Issue: Accidentally Using Supabase

**Symptoms**: Network requests to supabase.co in browser dev tools

**Solution**:
```bash
# Immediately switch to development mode
sed -i 's/NEXT_PUBLIC_DATABASE_PROVIDER=supabase/NEXT_PUBLIC_DATABASE_PROVIDER=firebase/' .env

# Comment out Supabase credentials
sed -i 's/^NEXT_PUBLIC_SUPABASE/#NEXT_PUBLIC_SUPABASE/' .env

# Restart server
npm run dev:next-only
```

### Issue: Data Not Persisting

**Symptoms**: Data disappears on page refresh

**Expected**: This is normal in development mode (mock database uses memory)

**Solution**: This is intentional for development. Switch to production mode for persistence.

### Issue: Authentication Always Succeeds

**Symptoms**: Any email/password combination works

**Expected**: This is normal in development mode for easy testing

**Solution**: This is intentional for development. Switch to production mode for real authentication.

## Migration Checklist

### From Development to Production

- [ ] Update `NEXT_PUBLIC_DATABASE_PROVIDER=supabase`
- [ ] Uncomment Supabase URL and key
- [ ] Verify Supabase database schema
- [ ] Test authentication with real users
- [ ] Verify data persistence
- [ ] Test all CRUD operations
- [ ] Monitor quota usage
- [ ] Set up production monitoring

### From Production to Development

- [ ] Update `NEXT_PUBLIC_DATABASE_PROVIDER=firebase`
- [ ] Comment out Supabase credentials
- [ ] Verify mock database activation
- [ ] Test with sample data
- [ ] Confirm zero external requests
- [ ] Continue development work

## Advanced Configuration

### Custom Mock Data

Modify `src/lib/mock-database.ts` to add custom sample data:

```typescript
// Add custom prompts
const customPrompts: Prompt[] = [
  {
    id: 'custom-1',
    title: 'Your Custom Prompt',
    content: 'Custom content here',
    category: 'Custom',
    tags: ['custom', 'development'],
    createdAt: new Date().toISOString(),
    user_id: mockUserId
  }
]
```

### Environment-Specific Configuration

Create environment-specific files:

```bash
# Development environment
cp .env .env.development

# Production environment
cp .env .env.production

# Switch environments
cp .env.development .env  # For development
cp .env.production .env   # For production
```

### Automated Switching

Add npm scripts to `package.json`:

```json
{
  "scripts": {
    "dev:mock": "cp .env.development .env && npm run dev:next-only",
    "dev:supabase": "cp .env.production .env && npm run dev:next-only",
    "switch:dev": "cp .env.development .env",
    "switch:prod": "cp .env.production .env"
  }
}
```

## Summary

The development mode configuration successfully:

✅ **Conserves Supabase Quota**: Zero API requests during development
✅ **Maintains Full Functionality**: All features work with mock data
✅ **Enables Offline Development**: No internet required
✅ **Provides Easy Switching**: Simple environment variable changes
✅ **Includes Sample Data**: Ready-to-use development data
✅ **Supports Real Testing**: Easy switch to production for testing

Your Supabase free tier quota of 5,000 requests/month is now fully preserved for production use, while maintaining a complete development environment with all application features functional.

---

*Last updated: 2024-12-19*
*For technical details, see `src/lib/database-abstraction.ts` and `src/lib/mock-database.ts`*