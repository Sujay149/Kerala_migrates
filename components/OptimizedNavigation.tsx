'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

// Preload routes for faster navigation
class RoutePreloader {
  private preloadedRoutes = new Set<string>()
  private router: any

  constructor(router: any) {
    this.router = router
  }

  preload(route: string) {
    if (!this.preloadedRoutes.has(route)) {
      this.router.prefetch(route)
      this.preloadedRoutes.add(route)
      console.log(`🚀 Preloaded route: ${route}`)
    }
  }

  preloadMultiple(routes: string[]) {
    routes.forEach(route => this.preload(route))
  }
}

let routePreloader: RoutePreloader | null = null

// Hook for route preloading
export const useRoutePreloader = () => {
  const router = useRouter()

  useEffect(() => {
    if (!routePreloader) {
      routePreloader = new RoutePreloader(router)
    }
  }, [router])

  return {
    preload: (route: string) => routePreloader?.preload(route),
    preloadMultiple: (routes: string[]) => routePreloader?.preloadMultiple(routes)
  }
}

// Optimized navigation hook with loading states
export const useOptimizedNavigation = () => {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)
  const [navigationProgress, setNavigationProgress] = useState(0)
  const navigationTimeout = useRef<NodeJS.Timeout | null>(null)

  const navigate = useCallback(async (href: string, options?: { replace?: boolean }) => {
    setIsNavigating(true)
    setNavigationProgress(0)

    // Simulate progress for user feedback
    const progressInterval = setInterval(() => {
      setNavigationProgress(prev => Math.min(prev + 10, 90))
    }, 50)

    try {
      // Start navigation
      const startTime = performance.now()
      
      if (options?.replace) {
        router.replace(href)
      } else {
        router.push(href)
      }

      // Set timeout for navigation completion
      navigationTimeout.current = setTimeout(() => {
        clearInterval(progressInterval)
        setNavigationProgress(100)
        
        setTimeout(() => {
          setIsNavigating(false)
          setNavigationProgress(0)
        }, 200)
      }, 100)

      const endTime = performance.now()
      console.log(`🚀 Navigation to ${href} took ${(endTime - startTime).toFixed(2)}ms`)

    } catch (error) {
      console.error('Navigation error:', error)
      clearInterval(progressInterval)
      setIsNavigating(false)
      setNavigationProgress(0)
    }
  }, [router])

  useEffect(() => {
    return () => {
      if (navigationTimeout.current) {
        clearTimeout(navigationTimeout.current)
      }
    }
  }, [])

  return {
    navigate,
    isNavigating,
    navigationProgress
  }
}

// Intersection observer for link preloading
export const useLinkPreloader = () => {
  const { preload } = useRoutePreloader()
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLElement
            const href = link.getAttribute('data-preload-href')
            if (href) {
              preload(href)
              observerRef.current?.unobserve(link)
            }
          }
        })
      },
      {
        rootMargin: '100px' // Start preloading when link is 100px from viewport
      }
    )

    return () => {
      observerRef.current?.disconnect()
    }
  }, [preload])

  const observeLink = useCallback((element: HTMLElement | null) => {
    if (element && observerRef.current) {
      observerRef.current.observe(element)
    }
  }, [])

  return { observeLink }
}

// Enhanced FastLink with better performance
interface FastLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  prefetch?: boolean
  replace?: boolean
  scroll?: boolean
  onNavigationStart?: () => void
  onNavigationComplete?: () => void
}

export const SuperFastLink: React.FC<FastLinkProps> = ({
  href,
  children,
  className = '',
  prefetch = true,
  replace = false,
  scroll = true,
  onNavigationStart,
  onNavigationComplete
}) => {
  const { navigate } = useOptimizedNavigation()
  const { observeLink } = useLinkPreloader()
  const linkRef = useRef<HTMLAnchorElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (prefetch) {
      observeLink(linkRef.current)
    }
  }, [prefetch, observeLink])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    onNavigationStart?.()
    
    navigate(href, { replace }).finally(() => {
      onNavigationComplete?.()
    })
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
    if (prefetch && routePreloader) {
      routePreloader.preload(href)
    }
  }

  return (
    <motion.a
      ref={linkRef}
      href={href}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      className={`cursor-pointer transition-all duration-150 ${className}`}
      data-preload-href={prefetch ? href : undefined}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 4px 8px rgba(0,0,0,0.1)' : 'none'
      }}
    >
      {children}
    </motion.a>
  )
}

// Page transition wrapper
export const PageTransitionWrapper: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ 
        duration: 0.15,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  )
}

// Navigation progress bar
export const NavigationProgressBar: React.FC = () => {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleStart = () => {
      setIsVisible(true)
      setProgress(0)
    }

    const handleComplete = () => {
      setProgress(100)
      setTimeout(() => {
        setIsVisible(false)
        setProgress(0)
      }, 200)
    }

    // Listen for Next.js router events if available
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleStart)
      
      // Custom navigation events
      window.addEventListener('navigation-start', handleStart as EventListener)
      window.addEventListener('navigation-complete', handleComplete as EventListener)

      return () => {
        window.removeEventListener('beforeunload', handleStart)
        window.removeEventListener('navigation-start', handleStart as EventListener)
        window.removeEventListener('navigation-complete', handleComplete as EventListener)
      }
    }
  }, [])

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: progress / 100 }}
      className="fixed top-0 left-0 h-1 bg-blue-500 z-50 origin-left"
      style={{ width: '100vw' }}
    />
  )
}

// Route cache manager
class RouteCacheManager {
  private cache = new Map<string, any>()
  private maxCacheSize = 10

  set(route: string, data: any) {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(route, data)
    console.log(`📦 Cached data for route: ${route}`)
  }

  get(route: string) {
    return this.cache.get(route)
  }

  clear() {
    this.cache.clear()
    console.log('🧹 Route cache cleared')
  }

  delete(route: string) {
    this.cache.delete(route)
    console.log(`🗑️ Removed cache for route: ${route}`)
  }
}

export const routeCacheManager = new RouteCacheManager()

// Optimized page component wrapper
export const OptimizedPage: React.FC<{
  children: React.ReactNode
  cacheKey?: string
  preloadRoutes?: string[]
}> = ({ children, cacheKey, preloadRoutes = [] }) => {
  const { preloadMultiple } = useRoutePreloader()
  
  useEffect(() => {
    // Preload related routes
    if (preloadRoutes.length > 0) {
      preloadMultiple(preloadRoutes)
    }

    // Cache page data if needed
    if (cacheKey) {
      routeCacheManager.set(cacheKey, { timestamp: Date.now() })
    }
  }, [preloadRoutes, cacheKey, preloadMultiple])

  return (
    <PageTransitionWrapper>
      {children}
    </PageTransitionWrapper>
  )
}