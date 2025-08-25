'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { DatabaseFactory, DatabaseProvider } from '@/lib/database-abstraction'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  provider: DatabaseProvider
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signInWithGitHub: () => Promise<{ error: any }>
  signInWithDiscord: () => Promise<{ error: any }>
  switchProvider: (provider: DatabaseProvider) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [provider, setProvider] = useState<DatabaseProvider>(
    DatabaseFactory.getCurrentProvider()
  )
  const [db] = useState(() => DatabaseFactory.getDatabase())

  useEffect(() => {
    // Get initial session based on provider
    const initializeAuth = async () => {
      try {
        // Use database abstraction layer for all providers
        const currentUser = db.getCurrentUser()
        setUser(currentUser)
        
        // Set session based on user state
        if (currentUser) {
          setSession({ user: currentUser } as Session)
        } else {
          setSession(null)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const unsubscribe = db.onAuthStateChange((user) => {
      setUser(user)
      // Set session based on user state for all providers
      setSession(user ? { user } as Session : null)
      setLoading(false)
    })

    return unsubscribe
  }, [provider, db])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await db.signIn(email, password)
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await db.signUp(email, password)
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await db.signOut()
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { error } = await db.signInWithGoogle()
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signInWithGitHub = async () => {
    try {
      const { error } = await db.signInWithGitHub()
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signInWithDiscord = async () => {
    try {
      const { error } = await db.signInWithDiscord()
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const switchProvider = (newProvider: DatabaseProvider) => {
    setLoading(true)
    setUser(null)
    setSession(null)
    setProvider(newProvider)
    DatabaseFactory.switchProvider(newProvider)
    // Re-initialize with new provider
    window.location.reload()
  }

  const value = {
    user,
    session,
    loading,
    provider,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithGitHub,
    signInWithDiscord,
    switchProvider,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}