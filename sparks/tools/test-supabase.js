// Test script to verify Supabase connection
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔍 Testing Supabase connection...')
  console.log('URL:', supabaseUrl)
  console.log('Key:', supabaseKey.substring(0, 20) + '...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection successful!')
    console.log('Session data:', data.session ? 'User logged in' : 'No active session')
    
    // Test database access (this will fail if no tables exist, which is expected)
    try {
      const { data: testData, error: dbError } = await supabase
        .from('prompts')
        .select('count')
        .limit(1)
      
      if (dbError) {
        console.log('⚠️  Database table "prompts" not found (expected if not created yet)')
        console.log('   Error:', dbError.message)
      } else {
        console.log('✅ Database access working - prompts table exists')
      }
    } catch (dbErr) {
      console.log('⚠️  Database test failed (expected if tables not created):', dbErr.message)
    }
    
    return true
  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
    return false
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Supabase verification complete!')
    console.log('Next steps:')
    console.log('1. Create database tables using the SQL from docs/supabase-setup.md')
    console.log('2. Configure authentication settings in Supabase dashboard')
    console.log('3. Test authentication flow in your application')
  } else {
    console.log('\n❌ Supabase verification failed. Please check your configuration.')
    process.exit(1)
  }
}).catch(err => {
  console.error('❌ Test script error:', err)
  process.exit(1)
})