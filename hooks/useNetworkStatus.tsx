'use client'

import React, { useState, useEffect } from 'react'

interface NetworkStatus {
  isOnline: boolean
  isFirestoreConnected: boolean
  connectionQuality: 'good' | 'slow' | 'offline'
}

export const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: true,
    isFirestoreConnected: true,
    connectionQuality: 'good'
  })

  useEffect(() => {
    // Initial status
    setNetworkStatus(prev => ({
      ...prev,
      isOnline: navigator.onLine
    }))

    const handleOnline = async () => {
      console.log('🌐 Network came online')
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: true,
        connectionQuality: 'good'
      }))
      
      // Try to reconnect Firestore
      try {
        const { goOnline } = await import('@/lib/firebase')
        await goOnline()
        setNetworkStatus(prev => ({
          ...prev,
          isFirestoreConnected: true
        }))
      } catch (error) {
        console.error('Failed to reconnect Firestore:', error)
      }
    }

    const handleOffline = async () => {
      console.log('📴 Network went offline')
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        isFirestoreConnected: false,
        connectionQuality: 'offline'
      }))
      
      // Try to disconnect Firestore gracefully
      try {
        const { goOffline } = await import('@/lib/firebase')
        await goOffline()
      } catch (error) {
        console.error('Failed to disconnect Firestore:', error)
      }
    }

    // Connection quality monitoring - less aggressive
    const checkConnectionQuality = () => {
      if (!navigator.onLine) {
        setNetworkStatus(prev => ({ ...prev, connectionQuality: 'offline' }))
        return
      }

      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

      if (connection) {
        const { effectiveType, downlink, rtt } = connection
        
        let quality: 'good' | 'slow' | 'offline' = 'good'
        
        // Only mark as slow for truly bad connections
        if (effectiveType === 'slow-2g' || downlink < 0.25 || rtt > 3000) {
          quality = 'slow'
        }

        setNetworkStatus(prev => ({
          ...prev,
          connectionQuality: quality
        }))
      }
    }

    // Event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check connection quality periodically
    const qualityInterval = setInterval(checkConnectionQuality, 10000) // Check every 10 seconds

    // Initial connection quality check
    checkConnectionQuality()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(qualityInterval)
    }
  }, [])

  return networkStatus
}

// Connection status component - only show offline warning
export const ConnectionStatus: React.FC = () => {
  const { isOnline, connectionQuality } = useNetworkStatus()

  // Only show when truly offline
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 px-4 py-2 text-sm text-center bg-red-500 text-white">
        📴 You are offline. Some features may not work.
      </div>
    )
  }

  return null // Don't show warnings for slow connections
}