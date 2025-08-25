# Supabase Setup and Configuration Guide

## Overview
This guide covers the setup and configuration of Supabase for authentication and database operations in your Next.js application.

## Prerequisites
1. A Supabase account (sign up at https://supabase.com)
2. A new Supabase project created

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the following values:
   - Project URL
   - Anon (public) key

## Step 2: Configure Environment Variables

Update your `.env` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
```

## Step 3: Database Schema Setup

Create the following tables in your Supabase database:

### Prompts Table
```sql
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

### User Profiles Table (Optional)
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own profile
CREATE POLICY "Users can only see their own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Step 4: Authentication Setup

### Configure Auth Settings
1. Go to Authentication > Settings in your Supabase dashboard
2. Configure your site URL (e.g., `http://localhost:3000` for development)
3. Set up email templates if needed
4. Configure OAuth providers if required

## Step 5: Usage Examples

### Using the Auth Hook
```tsx
import { useAuth } from '@/hooks/use-auth'

function LoginComponent() {
  const { signIn, user, loading } = useAuth()
  
  const handleLogin = async (email: string, password: string) => {
    const { error } = await signIn(email, password)
    if (error) {
      console.error('Login error:', error.message)
    }
  }
  
  if (loading) return <div>Loading...</div>
  if (user) return <div>Welcome, {user.email}!</div>
  
  // Render login form
}
```

### Using Database Operations
```tsx
import { Database } from '@/lib/database'

// Fetch prompts
const { data: prompts, error } = await Database.select('prompts', {
  orderBy: { column: 'created_at', ascending: false }
})

// Create a new prompt
const { data, error } = await Database.insert('prompts', {
  title: 'My Prompt',
  content: 'Prompt content here',
  category: 'general'
})
```

## Step 6: Migration from Firebase

If you're migrating from Firebase:

1. Export your Firebase data
2. Transform the data to match Supabase schema
3. Import data using Supabase dashboard or API
4. Update your components to use the new auth hooks
5. Replace Firebase imports with Supabase imports

## Security Best Practices

1. Always use Row Level Security (RLS) policies
2. Never expose your service role key in client-side code
3. Use environment variables for sensitive configuration
4. Implement proper error handling
5. Validate user input before database operations

## Troubleshooting

### Common Issues
1. **CORS errors**: Make sure your site URL is configured in Supabase settings
2. **Auth not working**: Check that environment variables are properly set
3. **Database access denied**: Ensure RLS policies are correctly configured
4. **Build errors**: Make sure all imports are correct and dependencies are installed

## Next Steps

1. Set up your database schema
2. Configure authentication settings
3. Test the authentication flow
4. Implement your application logic
5. Deploy to production with proper environment variables