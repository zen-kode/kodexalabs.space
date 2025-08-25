/**
 * Mock Database Adapter for Development
 * 
 * Provides a complete database interface without making any external API calls.
 * Preserves all data in memory/localStorage to simulate database operations
 * while conserving external service quotas during development.
 */

import { Prompt, UserProfile } from './types'

// Mock data storage
class MockStorage {
  private static instance: MockStorage
  private prompts: Map<string, Prompt> = new Map()
  private users: Map<string, UserProfile> = new Map()
  private currentUser: any = null
  private authCallbacks: ((user: any) => void)[] = []

  static getInstance(): MockStorage {
    if (!MockStorage.instance) {
      MockStorage.instance = new MockStorage()
      MockStorage.instance.initializeMockData()
    }
    return MockStorage.instance
  }

  private initializeMockData() {
    // Initialize with some mock data for development
    const mockUserId = 'mock-user-123'
    
    // Auto-sign in development user
    this.currentUser = {
      id: mockUserId,
      email: 'dev@kodexalabs.space',
      user_metadata: {
        full_name: 'Development User'
      },
      created_at: new Date().toISOString()
    }
    
    // Mock user profile
    this.users.set(mockUserId, {
      id: mockUserId,
      email: 'dev@kodexalabs.space',
      full_name: 'Development User',
      avatar_url: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    // Mock prompts
    const mockPrompts: Prompt[] = [
      {
        id: 'prompt-1',
        title: 'Default Prompt',
        content: 'Default prompt content',
        category: 'General',
        tags: ['default'],
        createdAt: new Date().toISOString(),
        user_id: mockUserId
      }
    ]

    mockPrompts.forEach(prompt => {
      this.prompts.set(prompt.id, prompt)
    })

    console.log('[MOCK-DB] 🎭 Mock database initialized with sample data')
  }

  // Auth methods
  async signIn(email: string, password: string) {
    console.log('[MOCK-DB] 🔐 Mock sign in:', email)
    
    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mock authentication - always succeed for development
    if (email === 'dev@kodexalabs.space' || email.includes('@')) {
      this.currentUser = {
        id: 'mock-user-123',
        email: email,
        user_metadata: {
          full_name: email === 'dev@kodexalabs.space' ? 'Development User' : email.split('@')[0]
        },
        created_at: new Date().toISOString()
      }
      
      // Notify auth state change callbacks
      this.authCallbacks.forEach(callback => callback(this.currentUser))
      
      return { user: this.currentUser, error: null }
    }
    
    return { user: null, error: { message: 'Invalid credentials' } }
  }

  async signUp(email: string, password: string) {
    console.log('[MOCK-DB] 📝 Mock sign up:', email)
    
    // Simulate signup delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const newUser = {
      id: `mock-user-${Date.now()}`,
      email: email,
      user_metadata: {
        full_name: email.split('@')[0]
      },
      created_at: new Date().toISOString()
    }
    
    this.currentUser = newUser
    
    // Create user profile
    this.users.set(newUser.id, {
      id: newUser.id,
      email: email,
      full_name: email.split('@')[0],
      avatar_url: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    
    // Notify auth state change callbacks
    this.authCallbacks.forEach(callback => callback(this.currentUser))
    
    return { user: newUser, error: null }
  }

  async signOut() {
    console.log('[MOCK-DB] 🚪 Mock sign out')
    
    this.currentUser = null
    
    // Notify auth state change callbacks
    this.authCallbacks.forEach(callback => callback(null))
    
    return { error: null }
  }

  getCurrentUser() {
    return this.currentUser
  }

  onAuthStateChange(callback: (user: any) => void) {
    this.authCallbacks.push(callback)
    
    // Immediately call with current user
    callback(this.currentUser)
    
    // Return unsubscribe function
    return () => {
      const index = this.authCallbacks.indexOf(callback)
      if (index > -1) {
        this.authCallbacks.splice(index, 1)
      }
    }
  }

  // Prompt methods
  async getPrompts(userId: string, limit = 10) {
    console.log('[MOCK-DB] 📋 Getting prompts for user:', userId)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const userPrompts = Array.from(this.prompts.values())
      .filter(prompt => prompt.user_id === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
    
    return { data: userPrompts, error: null }
  }

  async createPrompt(prompt: Omit<Prompt, 'id' | 'createdAt'> & { user_id: string }) {
    console.log('[MOCK-DB] ➕ Creating prompt:', prompt.title)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const newPrompt: Prompt = {
      ...prompt,
      id: `prompt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    }
    
    this.prompts.set(newPrompt.id, newPrompt)
    
    return { data: newPrompt, error: null }
  }

  async updatePrompt(id: string, updates: Partial<Prompt>) {
    console.log('[MOCK-DB] ✏️ Updating prompt:', id)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 250))
    
    const existingPrompt = this.prompts.get(id)
    if (!existingPrompt) {
      return { data: null, error: { message: 'Prompt not found' } }
    }
    
    const updatedPrompt = { ...existingPrompt, ...updates }
    this.prompts.set(id, updatedPrompt)
    
    return { data: updatedPrompt, error: null }
  }

  async deletePrompt(id: string) {
    console.log('[MOCK-DB] 🗑️ Deleting prompt:', id)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const deleted = this.prompts.delete(id)
    
    if (!deleted) {
      return { error: { message: 'Prompt not found' } }
    }
    
    return { error: null }
  }

  async getPromptById(id: string) {
    console.log('[MOCK-DB] 🔍 Getting prompt by ID:', id)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 150))
    
    const prompt = this.prompts.get(id)
    
    if (!prompt) {
      return { data: null, error: { message: 'Prompt not found' } }
    }
    
    return { data: prompt, error: null }
  }

  // User profile methods
  async getUserProfile(userId: string) {
    console.log('[MOCK-DB] 👤 Getting user profile:', userId)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 180))
    
    const profile = this.users.get(userId)
    
    if (!profile) {
      return { data: null, error: { message: 'User profile not found' } }
    }
    
    return { data: profile, error: null }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    console.log('[MOCK-DB] 👤 Updating user profile:', userId)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const existingProfile = this.users.get(userId)
    if (!existingProfile) {
      return { data: null, error: { message: 'User profile not found' } }
    }
    
    const updatedProfile = {
      ...existingProfile,
      ...updates,
      updated_at: new Date().toISOString()
    }
    
    this.users.set(userId, updatedProfile)
    
    return { data: updatedProfile, error: null }
  }

  // Real-time subscriptions (mock)
  subscribeToPrompts(userId: string, callback: (prompts: Prompt[]) => void) {
    console.log('[MOCK-DB] 🔔 Subscribing to prompts for user:', userId)
    
    // Initial data
    this.getPrompts(userId).then(({ data }) => {
      if (data) callback(data)
    })
    
    // Mock real-time updates (simulate changes every 30 seconds)
    const interval = setInterval(() => {
      this.getPrompts(userId).then(({ data }) => {
        if (data) callback(data)
      })
    }, 30000)
    
    // Return unsubscribe function
    return () => {
      clearInterval(interval)
    }
  }

  subscribeToUserProfile(userId: string, callback: (profile: UserProfile | null) => void) {
    console.log('[MOCK-DB] 🔔 Subscribing to user profile:', userId)
    
    // Initial data
    this.getUserProfile(userId).then(({ data }) => {
      callback(data)
    })
    
    // Mock real-time updates
    const interval = setInterval(() => {
      this.getUserProfile(userId).then(({ data }) => {
        callback(data)
      })
    }, 60000) // Check every minute
    
    // Return unsubscribe function
    return () => {
      clearInterval(interval)
    }
  }

  // Development utilities
  clearAllData() {
    console.log('[MOCK-DB] 🧹 Clearing all mock data')
    this.prompts.clear()
    this.users.clear()
    this.currentUser = null
    this.initializeMockData()
  }

  getStats() {
    return {
      prompts: this.prompts.size,
      users: this.users.size,
      currentUser: this.currentUser?.email || 'None',
      authCallbacks: this.authCallbacks.length
    }
  }
}

// Mock Database Adapter
export class MockDatabaseAdapter {
  private storage: MockStorage

  constructor() {
    this.storage = MockStorage.getInstance()
    console.log('[MOCK-DB] 🎭 Mock Database Adapter initialized - NO EXTERNAL API CALLS')
  }

  // Authentication methods
  async signIn(email: string, password: string) {
    return this.storage.signIn(email, password)
  }

  async signUp(email: string, password: string) {
    return this.storage.signUp(email, password)
  }

  async signOut() {
    return this.storage.signOut()
  }

  getCurrentUser() {
    return this.storage.getCurrentUser()
  }

  onAuthStateChange(callback: (user: any) => void) {
    return this.storage.onAuthStateChange(callback)
  }

  // Prompt methods
  async getPrompts(userId: string, limit?: number) {
    return this.storage.getPrompts(userId, limit)
  }

  async createPrompt(prompt: Omit<Prompt, 'id' | 'createdAt'> & { user_id: string }) {
    return this.storage.createPrompt(prompt)
  }

  async updatePrompt(id: string, updates: Partial<Prompt>) {
    return this.storage.updatePrompt(id, updates)
  }

  async deletePrompt(id: string) {
    return this.storage.deletePrompt(id)
  }

  async getPromptById(id: string) {
    return this.storage.getPromptById(id)
  }

  // User profile methods
  async getUserProfile(userId: string) {
    return this.storage.getUserProfile(userId)
  }

  async updateUserProfile(userId: string, profile: Partial<UserProfile>) {
    return this.storage.updateUserProfile(userId, profile)
  }

  // Real-time subscriptions
  subscribeToPrompts(userId: string, callback: (prompts: Prompt[]) => void) {
    return this.storage.subscribeToPrompts(userId, callback)
  }

  subscribeToUserProfile(userId: string, callback: (profile: UserProfile | null) => void) {
    return this.storage.subscribeToUserProfile(userId, callback)
  }

  // Development utilities
  clearAllData() {
    this.storage.clearAllData()
  }

  getStats() {
    return this.storage.getStats()
  }
}

// Export singleton instance
export const mockDatabase = new MockDatabaseAdapter()
export default mockDatabase