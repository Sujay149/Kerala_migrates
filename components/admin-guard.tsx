'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Loader2, AlertTriangle } from 'lucide-react'
import { hasPermission } from '@/lib/admin-config'

interface AdminGuardProps {
  children: React.ReactNode
  requiredRole?: 'government' | 'health_center'
  requiredPermissions?: string[]
  fallbackRoute?: string
}

export default function AdminGuard({ 
  children, 
  requiredRole, 
  requiredPermissions = [],
  fallbackRoute = '/auth/signin'
}: AdminGuardProps) {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    if (loading) return

    // Not authenticated
    if (!user) {
      router.push(fallbackRoute)
      return
    }

    // Wait for user profile to load
    if (!userProfile) {
      return
    }

    // User is not an admin
    if (!userProfile.isAdmin) {
      router.push('/dashboard') // Redirect regular users to regular dashboard
      return
    }

    // Check role requirement
    if (requiredRole && userProfile.adminRole !== requiredRole) {
      router.push('/dashboard') // Redirect to appropriate dashboard
      return
    }

    // Check permission requirements
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(permission => 
        userProfile.permissions?.includes(permission)
      )
      
      if (!hasAllPermissions) {
        router.push('/dashboard') // Redirect if missing permissions
        return
      }
    }

    setAuthChecked(true)
  }, [user, userProfile, loading, router, requiredRole, requiredPermissions, fallbackRoute])

  // Show loading while checking authentication
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // Show error if user is not authorized
  if (!user || !userProfile?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have admin privileges to access this page.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}