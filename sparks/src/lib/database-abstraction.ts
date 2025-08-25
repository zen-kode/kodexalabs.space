'use client'

import { Prompt, UserProfile, ApiResponse } from './types'

// Database provider types
export type DatabaseProvider = 'firebase' | 'supabase'

// Common database operations interface
export interface DatabaseAdapter {
  // Authentication
  signIn(email: string, password: string): Promise<{ user: any; error: any }>
  signUp(email: string, password: string): Promise<{ user: any; error: any }>
  signOut(): Promise<{ error: any }>
  getCurrentUser(): any
  onAuthStateChange(callback: (user: any) => void): () => void
  
  // OAuth Authentication
  signInWithGoogle(): Promise<{ user: any; error: any }>
  signInWithGitHub(): Promise<{ user: any; error: any }>
  signInWithDiscord(): Promise<{ user: any; error: any }>

  // Prompts operations
  getPrompts(userId: string, limit?: number): Promise<{ data: Prompt[] | null; error: any }>
  createPrompt(prompt: Omit<Prompt, 'id' | 'createdAt'> & { user_id: string }): Promise<{ data: Prompt | null; error: any }>
  updatePrompt(id: string, updates: Partial<Prompt>): Promise<{ data: Prompt | null; error: any }>
  deletePrompt(id: string): Promise<{ error: any }>
  getPromptById(id: string): Promise<{ data: Prompt | null; error: any }>

  // User profile operations
  getUserProfile(userId: string): Promise<{ data: UserProfile | null; error: any }>
  updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<{ data: UserProfile | null; error: any }>

  // Real-time subscriptions
  subscribeToPrompts(userId: string, callback: (prompts: Prompt[]) => void): () => void
  subscribeToUserProfile(userId: string, callback: (profile: UserProfile | null) => void): () => void
}

// Firebase adapter implementation
class FirebaseAdapter implements DatabaseAdapter {
  private auth: any
  private db: any
  private firestore: any

  constructor() {
    this.initializeFirebase()
  }

  private async initializeFirebase() {
    if (typeof window !== 'undefined') {
      const { auth } = await import('./firebase')
      const { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, limit, onSnapshot } = await import('firebase/firestore')
      const { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } = await import('firebase/auth')
      
      this.auth = auth
      this.db = getFirestore()
      this.firestore = { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, limit, onSnapshot }
    }
  }

  async signIn(email: string, password: string) {
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      const result = await signInWithEmailAndPassword(this.auth, email, password)
      return { user: result.user, error: null }
    } catch (error) {
      return { user: null, error }
    }
  }

  async signUp(email: string, password: string) {
    try {
      const { createUserWithEmailAndPassword } = await import('firebase/auth')
      const result = await createUserWithEmailAndPassword(this.auth, email, password)
      return { user: result.user, error: null }
    } catch (error) {
      return { user: null, error }
    }
  }

  async signOut() {
    try {
      const { signOut } = await import('firebase/auth')
      await signOut(this.auth)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  getCurrentUser() {
    return this.auth?.currentUser
  }

  onAuthStateChange(callback: (user: any) => void) {
    if (!this.auth) return () => {}
    const { onAuthStateChanged } = require('firebase/auth')
    return onAuthStateChanged(this.auth, callback)
  }

  async signInWithGoogle() {
    try {
      const { GoogleAuthProvider, signInWithPopup } = require('firebase/auth')
      const provider = new GoogleAuthProvider()
      provider.addScope('profile')
      provider.addScope('email')
      
      const result = await signInWithPopup(this.auth, provider)
      return { user: result.user, error: null }
    } catch (error) {
      return { user: null, error }
    }
  }

  async signInWithGitHub() {
    try {
      const { GithubAuthProvider, signInWithPopup } = require('firebase/auth')
      const provider = new GithubAuthProvider()
      provider.addScope('user:email')
      
      const result = await signInWithPopup(this.auth, provider)
      return { user: result.user, error: null }
    } catch (error) {
      return { user: null, error }
    }
  }

  async signInWithDiscord() {
    try {
      const { OAuthProvider, signInWithPopup } = require('firebase/auth')
      const provider = new OAuthProvider('oidc.discord')
      provider.addScope('identify')
      provider.addScope('email')
      
      const result = await signInWithPopup(this.auth, provider)
      return { user: result.user, error: null }
    } catch (error) {
      return { user: null, error }
    }
  }

  async getPrompts(userId: string, limitCount = 10) {
    try {
      const q = this.firestore.query(
        this.firestore.collection(this.db, 'prompts'),
        this.firestore.where('user_id', '==', userId),
        this.firestore.orderBy('createdAt', 'desc'),
        this.firestore.limit(limitCount)
      )
      const snapshot = await this.firestore.getDocs(q)
      const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async createPrompt(prompt: Omit<Prompt, 'id' | 'createdAt'> & { user_id: string }) {
    try {
      const docRef = await this.firestore.addDoc(
        this.firestore.collection(this.db, 'prompts'),
        {
          ...prompt,
          createdAt: new Date().toISOString()
        }
      )
      const doc = await this.firestore.getDoc(docRef)
      const data = { id: doc.id, ...doc.data() }
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async updatePrompt(id: string, updates: Partial<Prompt>) {
    try {
      const docRef = this.firestore.doc(this.db, 'prompts', id)
      await this.firestore.updateDoc(docRef, updates)
      const doc = await this.firestore.getDoc(docRef)
      const data = { id: doc.id, ...doc.data() }
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async deletePrompt(id: string) {
    try {
      await this.firestore.deleteDoc(this.firestore.doc(this.db, 'prompts', id))
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  async getPromptById(id: string) {
    try {
      const doc = await this.firestore.getDoc(this.firestore.doc(this.db, 'prompts', id))
      if (doc.exists()) {
        const data = { id: doc.id, ...doc.data() }
        return { data, error: null }
      }
      return { data: null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async getUserProfile(userId: string) {
    try {
      const doc = await this.firestore.getDoc(this.firestore.doc(this.db, 'users', userId))
      if (doc.exists()) {
        const data = { id: doc.id, ...doc.data() }
        return { data, error: null }
      }
      return { data: null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async updateUserProfile(userId: string, profile: Partial<UserProfile>) {
    try {
      const docRef = this.firestore.doc(this.db, 'users', userId)
      await this.firestore.updateDoc(docRef, profile)
      const doc = await this.firestore.getDoc(docRef)
      const data = { id: doc.id, ...doc.data() }
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  subscribeToPrompts(userId: string, callback: (prompts: Prompt[]) => void) {
    const q = this.firestore.query(
      this.firestore.collection(this.db, 'prompts'),
      this.firestore.where('user_id', '==', userId),
      this.firestore.orderBy('createdAt', 'desc')
    )
    return this.firestore.onSnapshot(q, (snapshot: any) => {
      const prompts = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
      callback(prompts)
    })
  }

  subscribeToUserProfile(userId: string, callback: (profile: UserProfile | null) => void) {
    const docRef = this.firestore.doc(this.db, 'users', userId)
    return this.firestore.onSnapshot(docRef, (doc: any) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() })
      } else {
        callback(null)
      }
    })
  }
}

// Supabase adapter implementation
import { supabase } from './supabase'

class SupabaseAdapter implements DatabaseAdapter {
  private supabase: any

  constructor() {
    this.supabase = supabase
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password })
    return { user: data.user, error }
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({ email, password })
    return { user: data.user, error }
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut()
    return { error }
  }

  getCurrentUser() {
    return this.supabase.auth.getUser()
  }

  onAuthStateChange(callback: (user: any) => void) {
    const { data: { subscription } } = this.supabase.auth.onAuthStateChange((_event: any, session: any) => {
      callback(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }

  async signInWithGoogle() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { user: data.user, error }
  }

  async signInWithGitHub() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { user: data.user, error }
  }

  async signInWithDiscord() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { user: data.user, error }
  }

  async getPrompts(userId: string, limitCount = 10) {
    return await this.supabase
      .from('prompts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limitCount)
  }

  async createPrompt(prompt: Omit<Prompt, 'id' | 'createdAt'> & { user_id: string }) {
    return await this.supabase
      .from('prompts')
      .insert([prompt])
      .select()
      .single()
  }

  async updatePrompt(id: string, updates: Partial<Prompt>) {
    return await this.supabase
      .from('prompts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
  }

  async deletePrompt(id: string) {
    return await this.supabase
      .from('prompts')
      .delete()
      .eq('id', id)
  }

  async getPromptById(id: string) {
    return await this.supabase
      .from('prompts')
      .select('*')
      .eq('id', id)
      .single()
  }

  async getUserProfile(userId: string) {
    return await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
  }

  async updateUserProfile(userId: string, profile: Partial<UserProfile>) {
    return await this.supabase
      .from('users')
      .update(profile)
      .eq('id', userId)
      .select()
      .single()
  }

  subscribeToPrompts(userId: string, callback: (prompts: Prompt[]) => void) {
    const subscription = this.supabase
      .channel('prompts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'prompts', filter: `user_id=eq.${userId}` },
        () => {
          // Refetch prompts when changes occur
          this.getPrompts(userId).then(({ data }) => {
            if (data) callback(data)
          })
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }

  subscribeToUserProfile(userId: string, callback: (profile: UserProfile | null) => void) {
    const subscription = this.supabase
      .channel('user_profile')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
        () => {
          // Refetch profile when changes occur
          this.getUserProfile(userId).then(({ data }) => {
            callback(data)
          })
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }
}

// Mock Database Adapter for Development
class MockDatabaseAdapter implements DatabaseAdapter {
  private mockStorage: any

  constructor() {
    // Import mock database dynamically to avoid issues
    if (typeof window !== 'undefined') {
      import('./mock-database').then(({ mockDatabase }) => {
        this.mockStorage = mockDatabase
      })
    }
    console.log('[DATABASE] 🎭 Using Mock Database - NO EXTERNAL API CALLS')
  }

  async signIn(email: string, password: string) {
    if (!this.mockStorage) {
      const { mockDatabase } = await import('./mock-database')
      this.mockStorage = mockDatabase
    }
    return this.mockStorage.signIn(email, password)
  }

  async signUp(email: string, password: string) {
    if (!this.mockStorage) {
      const { mockDatabase } = await import('./mock-database')
      this.mockStorage = mockDatabase
    }
    return this.mockStorage.signUp(email, password)
  }

  async signOut() {
    if (!this.mockStorage) {
      const { mockDatabase } = await import('./mock-database')
      this.mockStorage = mockDatabase
    }
    return this.mockStorage.signOut()
  }

  getCurrentUser() {
    return this.mockStorage?.getCurrentUser() || null
  }

  onAuthStateChange(callback: (user: any) => void) {
    if (!this.mockStorage) {
      import('./mock-database').then(({ mockDatabase }) => {
        this.mockStorage = mockDatabase
        return mockDatabase.onAuthStateChange(callback)
      })
      return () => {}
    }
    return this.mockStorage.onAuthStateChange(callback)
  }

  async signInWithGoogle() {
    // Mock OAuth implementation
    const mockUser = { id: 'mock-google-user', email: 'user@kodexalabs.space', provider: 'google' }
    return { user: mockUser, error: null }
  }

  async signInWithGitHub() {
    // Mock OAuth implementation
    const mockUser = { id: 'mock-github-user', email: 'user@github.com', provider: 'github' }
    return { user: mockUser, error: null }
  }

  async signInWithDiscord() {
    // Mock OAuth implementation
    const mockUser = { id: 'mock-discord-user', email: 'user@discord.com', provider: 'discord' }
    return { user: mockUser, error: null }
  }

  async getPrompts(userId: string, limit?: number) {
    if (!this.mockStorage) {
      const { mockDatabase } = await import('./mock-database')
      this.mockStorage = mockDatabase
    }
    return this.mockStorage.getPrompts(userId, limit)
  }

  async createPrompt(prompt: Omit<Prompt, 'id' | 'createdAt'> & { user_id: string }) {
    if (!this.mockStorage) {
      const { mockDatabase } = await import('./mock-database')
      this.mockStorage = mockDatabase
    }
    return this.mockStorage.createPrompt(prompt)
  }

  async updatePrompt(id: string, updates: Partial<Prompt>) {
    if (!this.mockStorage) {
      const { mockDatabase } = await import('./mock-database')
      this.mockStorage = mockDatabase
    }
    return this.mockStorage.updatePrompt(id, updates)
  }

  async deletePrompt(id: string) {
    if (!this.mockStorage) {
      const { mockDatabase } = await import('./mock-database')
      this.mockStorage = mockDatabase
    }
    return this.mockStorage.deletePrompt(id)
  }

  async getPromptById(id: string) {
    if (!this.mockStorage) {
      const { mockDatabase } = await import('./mock-database')
      this.mockStorage = mockDatabase
    }
    return this.mockStorage.getPromptById(id)
  }

  async getUserProfile(userId: string) {
    if (!this.mockStorage) {
      const { mockDatabase } = await import('./mock-database')
      this.mockStorage = mockDatabase
    }
    return this.mockStorage.getUserProfile(userId)
  }

  async updateUserProfile(userId: string, profile: Partial<UserProfile>) {
    if (!this.mockStorage) {
      const { mockDatabase } = await import('./mock-database')
      this.mockStorage = mockDatabase
    }
    return this.mockStorage.updateUserProfile(userId, profile)
  }

  subscribeToPrompts(userId: string, callback: (prompts: Prompt[]) => void) {
    if (!this.mockStorage) {
      import('./mock-database').then(({ mockDatabase }) => {
        this.mockStorage = mockDatabase
        return mockDatabase.subscribeToPrompts(userId, callback)
      })
      return () => {}
    }
    return this.mockStorage.subscribeToPrompts(userId, callback)
  }

  subscribeToUserProfile(userId: string, callback: (profile: UserProfile | null) => void) {
    if (!this.mockStorage) {
      import('./mock-database').then(({ mockDatabase }) => {
        this.mockStorage = mockDatabase
        return mockDatabase.subscribeToUserProfile(userId, callback)
      })
      return () => {}
    }
    return this.mockStorage.subscribeToUserProfile(userId, callback)
  }
}

// Database factory
class DatabaseFactory {
  private static instance: DatabaseAdapter | null = null
  private static provider: DatabaseProvider | null = null

  static getDatabase(provider?: DatabaseProvider): DatabaseAdapter {
    const selectedProvider = provider || (process.env.NEXT_PUBLIC_DATABASE_PROVIDER as DatabaseProvider) || 'supabase'

    // Force mock database in development to conserve external API quotas, unless explicitly set to 'supabase'
    const isDevelopment = process.env.NODE_ENV === 'development' && selectedProvider !== 'supabase' ||
                         process.env.NEXT_PUBLIC_DATABASE_PROVIDER === 'firebase' ||
                         !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                         process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy') ||
                         process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id') ||
                         process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_project_id')

    if (!this.instance || this.provider !== selectedProvider) {
      this.provider = selectedProvider

      if (isDevelopment) {
        console.log('[DATABASE] 🎭 Development mode detected - using Mock Database to conserve API quotas')
        this.instance = new MockDatabaseAdapter()
      } else {
        switch (selectedProvider) {
          case 'firebase':
            this.instance = new FirebaseAdapter()
            break
          case 'supabase':
          default:
            this.instance = new SupabaseAdapter()
            break
        }
      }
    }
    
    return this.instance
  }

  static getCurrentProvider(): DatabaseProvider {
    const selectedProvider = (process.env.NEXT_PUBLIC_DATABASE_PROVIDER as DatabaseProvider) || 'supabase'
    const isDevelopment = process.env.NODE_ENV === 'development' && selectedProvider !== 'supabase' ||
                         process.env.NEXT_PUBLIC_DATABASE_PROVIDER === 'firebase' ||
                         !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                         process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy')

    if (isDevelopment) {
      return 'firebase' // Return firebase to indicate development mode
    }
    
    return this.provider || (process.env.NEXT_PUBLIC_DATABASE_PROVIDER as DatabaseProvider) || 'supabase'
  }

  static switchProvider(provider: DatabaseProvider): DatabaseAdapter {
    this.instance = null
    return this.getDatabase(provider)
  }

  static isDevelopmentMode(): boolean {
    return process.env.NODE_ENV === 'development' || 
           process.env.NEXT_PUBLIC_DATABASE_PROVIDER === 'firebase' ||
           !process.env.NEXT_PUBLIC_SUPABASE_URL ||
           process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy') ||
           process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id') ||
           process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_project_id')
  }
}

// Export the main interface
export const db = DatabaseFactory.getDatabase()
export { DatabaseFactory }
export default db
// Add this debug line to see which provider is being used
console.log('Current provider:', DatabaseFactory.getCurrentProvider());