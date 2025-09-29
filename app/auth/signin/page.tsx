"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthGuard } from "@/components/auth-guard"
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return localStorage.getItem('medibot_remember') === 'true'
    } catch {
      return false
    }
  })
  const [showVerifiedMessage, setShowVerifiedMessage] = useState(false)
  const { signIn, signInWithGoogle, signInWithFacebook } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check if user just verified their email
  useEffect(() => {
    const verified = searchParams?.get('verified')
    if (verified === 'true') {
      setShowVerifiedMessage(true)
      toast.success("Email verified successfully! You can now sign in.", {
        position: "top-center",
        duration: 5000
      })
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signIn(email, password, rememberMe)
      // persist remember choice
      try { localStorage.setItem('medibot_remember', rememberMe ? 'true' : 'false') } catch {}
      
      // Check if this is an admin login and redirect accordingly
      const { isAdminEmail, getAdminRole, getAdminDashboardRoute } = await import('@/lib/admin-config')
      
      if (isAdminEmail(email)) {
        const adminRole = getAdminRole(email)
        const dashboardRoute = adminRole ? getAdminDashboardRoute(adminRole) : '/migrant-profile'
        
        toast.success("Admin login successful!", {
          position: "top-center"
        })
        router.push(dashboardRoute)
      } else {
        toast.success("Signed in successfully!", {
          position: "top-center"
        })
        router.push("/migrant-profile")
      }
    } catch (error: any) {
      // Check if it's an email verification error
      if (error.message.includes("verify your email")) {
        toast.error(error.message, {
          position: "top-center",
          duration: 6000,
          action: {
            label: 'Verify Email',
            onClick: () => router.push('/verify-email')
          }
        })
      } else {
        toast.error(error.message || "Failed to sign in", {
          position: "top-center"
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
      toast.success("Signed in with Google successfully!", {
        position: "top-center"
      })
      router.push("/migrant-profile")
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google", {
        position: "top-center"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFacebookSignIn = async () => {
    setLoading(true)
    try {
      await signInWithFacebook()
      toast.success("Signed in with Facebook successfully!", {
        position: "top-center"
      })
      router.push("/migrant-profile")
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Facebook", {
        position: "top-center"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard requireAuth={false}>
      <div 
        className="min-h-screen flex items-center justify-center p-4 relative"
        style={{
          backgroundImage: 'url(/loginbg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dark overlay for better readability */}
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="w-full max-w-md bg-card/90 backdrop-blur-md rounded-2xl border border-border shadow-xl p-8 sm:p-10 relative z-10">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Link href="/">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
              >
                 <ArrowLeft className="h-5 w-5" />
                                <p>Back</p>
              </Button>
            </Link>
           
          </div>

          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-5">
                  {/* Remember Me Checkbox */}
                  <div className="flex items-center mt-2">
                    <input
                      id="rememberMe"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="accent-primary h-4 w-4 rounded border-border focus:ring-primary"
                    />
                    <label htmlFor="rememberMe" className="ml-2 text-muted-foreground text-sm select-none cursor-pointer">Remember Me</label>
                  </div>
              <div className="w-14 h-14 relative">
                <Image 
                  src="/kerala-digital-health-logo.svg" 
                  alt="Government of Kerala Digital Health Record Logo" 
                  width={56} 
                  height={56} 
                  className="rounded-full border-2 border-border shadow-sm"
                />
              </div>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70 font-bold text-2xl tracking-tight">
                Medibot
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-muted-foreground text-sm">Sign in to access your dashboard</p>
          </div>

          {/* Email Verification Success Message */}
          {showVerifiedMessage && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-green-400 font-medium">Email Verified Successfully!</p>
                  <p className="text-green-300/80">You can now sign in to your account.</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-foreground font-medium text-sm">Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-muted border-border focus:border-primary focus:ring-primary text-foreground h-11 rounded-lg text-sm placeholder-muted-foreground"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-foreground font-medium text-sm">Password</label>
                <Link 
                  href="/auth/forgot-password" 
                  className="text-primary hover:text-primary/80 text-xs hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-muted border-border focus:border-primary focus:ring-primary text-foreground h-11 rounded-lg pr-12 text-sm placeholder-muted-foreground"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-md transition-all duration-200 text-sm font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-card text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                variant="outline"
                className="h-11 bg-muted border-border hover:bg-muted/80 hover:border-border text-foreground rounded-lg text-sm transition-all"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                onClick={handleFacebookSignIn}
                disabled={loading}
                variant="outline"
                className="h-11 bg-muted border-border hover:bg-muted/80 hover:border-border text-foreground rounded-lg text-sm transition-all"
              >
                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
            </div>

            {/* Admin Login Indicator */}
            <div className="mt-6 p-3 bg-muted/50 border border-border/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Admin Access:</strong> Government & Health Center administrators can sign in with their official credentials
                </span>
              </div>
            </div>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link 
                href="/auth/signup" 
                className="text-primary hover:text-primary/80 hover:underline font-medium"
              >
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  )
}