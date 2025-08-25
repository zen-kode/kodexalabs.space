'use client'

import { useState, useEffect } from 'react'
import { DatabaseFactory } from '@/lib/database-abstraction'
import type { Prompt } from '@/lib/types'
import { useAuth } from './use-auth'

interface UsePromptsReturn {
  prompts: Prompt[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function usePrompts(limit: number = 10): UsePromptsReturn {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const [db] = useState(() => DatabaseFactory.getDatabase())

  const fetchPrompts = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user) {
        setPrompts([])
        return
      }

      const { data, error: fetchError } = await db.getPrompts(user.id, limit)

      if (fetchError) {
        throw fetchError
      }

      setPrompts(data || [])
    } catch (err) {
      console.error('Error fetching prompts:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch prompts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrompts()
  }, [user, limit, db])

  const refetch = async () => {
    await fetchPrompts()
  }

  return {
    prompts,
    loading,
    error,
    refetch
  }
}

export default usePrompts