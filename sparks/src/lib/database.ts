import { supabase } from './supabase'
import type { PostgrestError } from '@supabase/supabase-js'

// Database types
export type { PostgrestError }

// Generic database operations
export class Database {
  // Select data from a table
  static async select<T = any>(table: string, options?: {
    columns?: string
    filter?: Record<string, any>
    orderBy?: { column: string; ascending?: boolean }
    limit?: number
  }) {
    let query = supabase.from(table).select(options?.columns || '*')
    
    if (options?.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }
    
    if (options?.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true })
    }
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    const { data, error } = await query
    return { data: data as T[], error }
  }
  
  // Insert data into a table
  static async insert<T = any>(table: string, data: any | any[]) {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
    return { data: result as T[], error }
  }
  
  // Update data in a table
  static async update<T = any>(table: string, data: any, filter: Record<string, any>) {
    let query = supabase.from(table).update(data)
    
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value)
    })
    
    const { data: result, error } = await query.select()
    return { data: result as T[], error }
  }
  
  // Delete data from a table
  static async delete(table: string, filter: Record<string, any>) {
    let query = supabase.from(table).delete()
    
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value)
    })
    
    const { error } = await query
    return { error }
  }
  
  // Count records in a table
  static async count(table: string, filter?: Record<string, any>) {
    let query = supabase.from(table).select('*', { count: 'exact', head: true })
    
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }
    
    const { count, error } = await query
    return { count, error }
  }
}

// Export supabase instance for direct access
export { supabase }