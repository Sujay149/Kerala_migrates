'use client'

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  onSnapshot,
  type Unsubscribe,
  type QuerySnapshot,
  type DocumentSnapshot,
  enableNetwork,
  disableNetwork,
} from "firebase/firestore";
import { db } from "./firebase";

// Cache for storing frequently accessed data
class FirestoreCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  set(key: string, data: any, ttl: number = 300000) { // 5 minutes default TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  clear() {
    this.cache.clear()
  }

  delete(key: string) {
    this.cache.delete(key)
  }
}

const firestoreCache = new FirestoreCache()

// Enhanced error handling with retry mechanism
class FirestoreRetry {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        console.warn(`🔄 Firestore operation failed (attempt ${attempt + 1}/${maxRetries}):`, error)

        // Don't retry for certain errors
        if (error instanceof Error) {
          if (error.message.includes('permission-denied') || 
              error.message.includes('not-found') ||
              error.message.includes('invalid-argument')) {
            throw error
          }
        }

        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)))
        }
      }
    }

    throw lastError
  }
}

// Optimized document fetcher with caching
export const getDocumentOptimized = async (
  collectionName: string, 
  documentId: string,
  useCache: boolean = true,
  cacheTTL: number = 300000
): Promise<any | null> => {
  const cacheKey = `doc_${collectionName}_${documentId}`

  // Try cache first
  if (useCache) {
    const cached = firestoreCache.get(cacheKey)
    if (cached) {
      console.log(`📦 Cache hit for ${cacheKey}`)
      return cached
    }
  }

  // Fetch from Firestore with retry
  return FirestoreRetry.withRetry(async () => {
    const docRef = doc(db, collectionName, documentId)
    const docSnap = await getDoc(docRef)
    
    const data = docSnap.exists() ? docSnap.data() : null
    
    // Cache the result
    if (useCache && data) {
      firestoreCache.set(cacheKey, data, cacheTTL)
      console.log(`💾 Cached ${cacheKey}`)
    }
    
    return data
  }, 3, 1000)
}

// Optimized collection query with caching
export const getCollectionOptimized = async (
  collectionName: string,
  constraints: any[] = [],
  useCache: boolean = true,
  cacheTTL: number = 300000
): Promise<any[]> => {
  const cacheKey = `collection_${collectionName}_${JSON.stringify(constraints)}`

  // Try cache first
  if (useCache) {
    const cached = firestoreCache.get(cacheKey)
    if (cached) {
      console.log(`📦 Cache hit for ${cacheKey}`)
      return cached
    }
  }

  // Fetch from Firestore with retry
  return FirestoreRetry.withRetry(async () => {
    let q = collection(db, collectionName) as any
    
    // Apply constraints
    if (constraints.length > 0) {
      q = query(q, ...constraints)
    }
    
    const querySnapshot = await getDocs(q)
    const data = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...(doc.data() as Record<string, any>) 
    }))
    
    // Cache the result
    if (useCache) {
      firestoreCache.set(cacheKey, data, cacheTTL)
      console.log(`💾 Cached ${cacheKey}`)
    }
    
    return data
  }, 3, 1000)
}

// Debounced listener manager to prevent excessive subscriptions
class ListenerManager {
  private listeners = new Map<string, Unsubscribe>()
  private debounceTimers = new Map<string, NodeJS.Timeout>()

  subscribe(
    key: string,
    callback: () => Unsubscribe,
    debounceDelay: number = 500
  ) {
    // Clear existing timer
    const existingTimer = this.debounceTimers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Clear existing listener
    this.unsubscribe(key)

    // Set debounced subscription
    const timer = setTimeout(() => {
      try {
        const unsubscribe = callback()
        this.listeners.set(key, unsubscribe)
        console.log(`👂 Subscribed to ${key}`)
      } catch (error) {
        console.error(`❌ Failed to subscribe to ${key}:`, error)
      }
      this.debounceTimers.delete(key)
    }, debounceDelay)

    this.debounceTimers.set(key, timer)
  }

  unsubscribe(key: string) {
    const unsubscribe = this.listeners.get(key)
    if (unsubscribe) {
      unsubscribe()
      this.listeners.delete(key)
      console.log(`👋 Unsubscribed from ${key}`)
    }

    const timer = this.debounceTimers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.debounceTimers.delete(key)
    }
  }

  unsubscribeAll() {
    this.listeners.forEach((unsubscribe, key) => {
      unsubscribe()
      console.log(`👋 Unsubscribed from ${key}`)
    })
    this.listeners.clear()

    this.debounceTimers.forEach((timer) => {
      clearTimeout(timer)
    })
    this.debounceTimers.clear()
  }
}

export const listenerManager = new ListenerManager()

// Network-aware Firestore operations
export const isOnline = () => {
  return typeof window !== 'undefined' ? navigator.onLine : true
}

export const executeWithNetworkCheck = async <T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T | null> => {
  if (!isOnline()) {
    console.warn('📴 Offline: Operation skipped')
    return fallback ?? null
  }

  try {
    return await operation()
  } catch (error) {
    console.error('🚫 Network operation failed:', error)
    return fallback ?? null
  }
}

// Batch operations for better performance
export class FirestoreBatch {
  private operations: (() => Promise<any>)[] = []
  private batchTimeout: NodeJS.Timeout | null = null

  add(operation: () => Promise<any>) {
    this.operations.push(operation)
    
    // Execute batch after a short delay
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
    }
    
    this.batchTimeout = setTimeout(() => {
      this.execute()
    }, 100) // 100ms delay to collect operations
  }

  private async execute() {
    if (this.operations.length === 0) return

    console.log(`🔄 Executing batch of ${this.operations.length} operations`)
    const operations = [...this.operations]
    this.operations = []

    // Execute operations with some concurrency control
    const results = await Promise.allSettled(
      operations.map(op => FirestoreRetry.withRetry(op, 2, 500))
    )

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`❌ Batch operation ${index} failed:`, result.reason)
      }
    })
  }
}

export const firestoreBatch = new FirestoreBatch()

// Cache management utilities
export const clearFirestoreCache = () => {
  firestoreCache.clear()
  console.log('🧹 Firestore cache cleared')
}

export const invalidateCacheKey = (key: string) => {
  firestoreCache.delete(key)
  console.log(`🗑️ Cache invalidated for ${key}`)
}

// Performance monitoring
class PerformanceMonitor {
  private metrics = new Map<string, number[]>()

  startTimer(operation: string): () => void {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      this.addMetric(operation, duration)
      console.log(`⏱️ ${operation} took ${duration.toFixed(2)}ms`)
    }
  }

  private addMetric(operation: string, duration: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, [])
    }
    const durations = this.metrics.get(operation)!
    durations.push(duration)
    
    // Keep only last 100 measurements
    if (durations.length > 100) {
      durations.shift()
    }
  }

  getAverageTime(operation: string): number {
    const durations = this.metrics.get(operation)
    if (!durations || durations.length === 0) return 0
    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length
  }

  getAllMetrics() {
    const summary: Record<string, { average: number; count: number }> = {}
    this.metrics.forEach((durations, operation) => {
      summary[operation] = {
        average: this.getAverageTime(operation),
        count: durations.length
      }
    })
    return summary
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Cleanup function for when component unmounts
export const cleanup = () => {
  listenerManager.unsubscribeAll()
  clearFirestoreCache()
  console.log('🧹 Firestore optimizations cleaned up')
}