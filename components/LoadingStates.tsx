'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Loader2, Wifi, WifiOff, Database, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

// Basic loading spinner
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg'
  className?: string
}> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <Loader2 className={`animate-spin text-gray-600 ${sizeClasses[size]} ${className}`} />
  )
}

// Page loading skeleton
export const PageLoadingSkeleton: React.FC = () => (
  <div className="min-h-screen bg-white p-4 animate-pulse">
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="h-12 bg-gray-200 rounded-lg"></div>
      
      {/* Content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  </div>
)

// Card loading skeleton
export const CardLoadingSkeleton: React.FC<{
  count?: number
  className?: string
}> = ({ count = 3, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
)

// Smart loading component with network awareness
export const SmartLoading: React.FC<{
  isLoading: boolean
  error?: string | null
  children: React.ReactNode
  fallback?: React.ReactNode
  onRetry?: () => void
  loadingText?: string
}> = ({ 
  isLoading, 
  error, 
  children, 
  fallback, 
  onRetry, 
  loadingText = 'Loading...' 
}) => {
  const { isOnline, connectionQuality } = useNetworkStatus()

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            {!isOnline ? <WifiOff className="w-8 h-8 text-red-600" /> : <Database className="w-8 h-8 text-red-600" />}
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {!isOnline ? 'No Internet Connection' : 'Something went wrong'}
          </h3>
          <p className="text-gray-600 max-w-sm">
            {!isOnline 
              ? 'Please check your internet connection and try again.' 
              : error || 'An unexpected error occurred while loading the content.'}
          </p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        )}
      </div>
    )
  }

  if (isLoading) {
    return fallback || (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center min-h-[200px] space-y-4"
      >
        <div className="relative">
          <LoadingSpinner size="lg" />
          {connectionQuality === 'slow' && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full"
            />
          )}
        </div>
        
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-gray-900">{loadingText}</p>
          {connectionQuality === 'slow' && (
            <p className="text-xs text-yellow-600">Slow connection detected...</p>
          )}
          {!isOnline && (
            <p className="text-xs text-red-600">Working offline</p>
          )}
        </div>
      </motion.div>
    )
  }

  return <>{children}</>
}

// Lazy loading wrapper
export const LazyLoadWrapper: React.FC<{
  children: React.ReactNode
  height?: number
  className?: string
}> = ({ children, height = 200, className = '' }) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const [isLoaded, setIsLoaded] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    if (isVisible) {
      // Simulate loading delay for demonstration
      const timer = setTimeout(() => {
        setIsLoaded(true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  return (
    <div ref={ref} className={className} style={{ minHeight: height }}>
      {isVisible ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {isLoaded ? children : <CardLoadingSkeleton count={1} />}
        </motion.div>
      ) : (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="w-full bg-gray-100 rounded animate-pulse" style={{ height: '80%' }} />
        </div>
      )}
    </div>
  )
}

// Progress indicator for long operations
export const ProgressIndicator: React.FC<{
  progress: number
  status: string
  isVisible: boolean
}> = ({ progress, status, isVisible }) => {
  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[250px] z-50"
    >
      <div className="flex items-center space-x-3">
        <LoadingSpinner size="sm" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{status}</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}%</p>
        </div>
      </div>
    </motion.div>
  )
}

// Connection status indicator
export const ConnectionStatusIndicator: React.FC = () => {
  const { isOnline, connectionQuality } = useNetworkStatus()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        !isOnline 
          ? 'bg-red-100 text-red-700' 
          : connectionQuality === 'slow'
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-green-100 text-green-700'
      }`}
    >
      {!isOnline ? (
        <WifiOff className="w-3 h-3" />
      ) : (
        <Wifi className="w-3 h-3" />
      )}
      <span>
        {!isOnline 
          ? 'Offline' 
          : connectionQuality === 'slow'
          ? 'Slow'
          : 'Online'
        }
      </span>
    </motion.div>
  )
}