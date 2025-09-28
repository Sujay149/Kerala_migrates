"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { PageTransition, FadeInUp, SlideIn, ScaleIn, StaggeredFadeIn, StaggeredChild } from "@/components/PageTransition"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Menu, Activity, Plus, TrendingUp, Heart, Thermometer, Scale, Droplets, Eye, Calendar } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

interface HealthMetric {
  id: string
  type: 'blood_pressure' | 'weight' | 'temperature' | 'heart_rate' | 'blood_sugar' | 'sleep' | 'steps'
  value: string
  unit: string
  date: Date
  notes?: string
  target?: string
}

interface VitalSigns {
  systolic?: number
  diastolic?: number
  heartRate?: number
  temperature?: number
  weight?: number
  bloodSugar?: number
}

export default function HealthTrackingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<string>('')
  const [isMobile, setIsMobile] = useState(false)
  const { user, userProfile } = useAuth()

  // Sample health data
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setHealthMetrics([
        {
          id: '1',
          type: 'blood_pressure',
          value: '120/80',
          unit: 'mmHg',
          date: new Date(),
          notes: 'Morning reading, feeling good',
          target: '120/80'
        },
        {
          id: '2',
          type: 'weight',
          value: '75.2',
          unit: 'kg',
          date: new Date(Date.now() - 86400000),
          target: '70'
        },
        {
          id: '3',
          type: 'heart_rate',
          value: '72',
          unit: 'bpm',
          date: new Date(Date.now() - 3600000),
          target: '60-80'
        },
        {
          id: '4',
          type: 'temperature',
          value: '98.6',
          unit: '°F',
          date: new Date(Date.now() - 7200000),
          target: '98.6'
        },
        {
          id: '5',
          type: 'blood_sugar',
          value: '95',
          unit: 'mg/dL',
          date: new Date(Date.now() - 10800000),
          notes: 'Fasting reading',
          target: '70-100'
        },
        {
          id: '6',
          type: 'steps',
          value: '8500',
          unit: 'steps',
          date: new Date(Date.now() - 86400000),
          target: '10000'
        },
        {
          id: '7',
          type: 'sleep',
          value: '7.5',
          unit: 'hours',
          date: new Date(Date.now() - 86400000),
          target: '8'
        }
      ])
      setLoading(false)
    }, 1000)

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const getMetricIcon = (type: HealthMetric['type']) => {
    switch (type) {
      case 'blood_pressure': return <Heart className="h-5 w-5 text-red-500" />
      case 'weight': return <Scale className="h-5 w-5 text-blue-500" />
      case 'heart_rate': return <Activity className="h-5 w-5 text-pink-500" />
      case 'temperature': return <Thermometer className="h-5 w-5 text-orange-500" />
      case 'blood_sugar': return <Droplets className="h-5 w-5 text-purple-500" />
      case 'steps': return <Activity className="h-5 w-5 text-green-500" />
      case 'sleep': return <Eye className="h-5 w-5 text-indigo-500" />
      default: return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getMetricName = (type: HealthMetric['type']) => {
    switch (type) {
      case 'blood_pressure': return 'Blood Pressure'
      case 'weight': return 'Weight'
      case 'heart_rate': return 'Heart Rate'
      case 'temperature': return 'Temperature'
      case 'blood_sugar': return 'Blood Sugar'
      case 'steps': return 'Daily Steps'
      case 'sleep': return 'Sleep'
      default: return type
    }
  }

  const getProgressColor = (type: HealthMetric['type'], value: string, target?: string) => {
    if (!target) return 'bg-gray-200'
    
    const numValue = parseFloat(value)
    switch (type) {
      case 'weight':
        const targetWeight = parseFloat(target)
        const difference = Math.abs(numValue - targetWeight)
        if (difference <= 2) return 'bg-green-500'
        if (difference <= 5) return 'bg-yellow-500'
        return 'bg-red-500'
      case 'steps':
        const targetSteps = parseFloat(target)
        const percentage = (numValue / targetSteps) * 100
        if (percentage >= 100) return 'bg-green-500'
        if (percentage >= 75) return 'bg-yellow-500'
        return 'bg-red-500'
      case 'sleep':
        const targetSleep = parseFloat(target)
        const sleepDiff = Math.abs(numValue - targetSleep)
        if (sleepDiff <= 0.5) return 'bg-green-500'
        if (sleepDiff <= 1) return 'bg-yellow-500'
        return 'bg-red-500'
      default:
        return 'bg-blue-500'
    }
  }

  const calculateProgress = (type: HealthMetric['type'], value: string, target?: string) => {
    if (!target) return 0
    
    const numValue = parseFloat(value)
    switch (type) {
      case 'steps':
        return Math.min((numValue / parseFloat(target)) * 100, 100)
      case 'sleep':
        const targetSleep = parseFloat(target)
        const sleepPercentage = (numValue / targetSleep) * 100
        return Math.min(sleepPercentage, 100)
      default:
        return 75 // Default progress for other metrics
    }
  }

  // Get latest metrics for dashboard
  const getLatestMetrics = () => {
    const types = ['blood_pressure', 'weight', 'heart_rate', 'temperature', 'blood_sugar', 'steps', 'sleep']
    return types.map(type => {
      const latest = healthMetrics
        .filter(m => m.type === type)
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0]
      return latest
    }).filter(Boolean)
  }

  const latestMetrics = getLatestMetrics()

  return (
    <AuthGuard>
      <PageTransition>
        <div className="min-h-screen bg-white flex">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          
          <div className="flex-1 flex flex-col lg:ml-64">
            {/* Mobile Header */}
            <SlideIn direction="down" className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-50"
              >
                <Menu className="h-6 w-6 text-gray-800" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">Health Tracking</h1>
              <div className="w-8" />
            </SlideIn>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-6 lg:p-8 bg-gray-50/30">
              <div className="max-w-7xl mx-auto">
                {/* Header */}
                <FadeInUp className="mb-6 md:mb-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
                    <div className="space-y-2">
                      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
                        <ScaleIn delay={0.2}>
                          <div className="p-3 bg-blue-100 rounded-full">
                            <Activity className="h-8 w-8 text-blue-600" />
                          </div>
                        </ScaleIn>
                        Health Tracking
                      </h1>
                      <p className="text-gray-600 text-base md:text-lg max-w-2xl">
                        Monitor your vital signs and health metrics over time with detailed insights
                      </p>
                    </div>
                    <SlideIn direction="right" delay={0.3}>
                      <Button 
                        onClick={() => setShowAddForm(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 w-full md:w-auto"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add New Reading
                      </Button>
                    </SlideIn>
                  </div>
                </FadeInUp>

                {/* Quick Stats */}
                <StaggeredFadeIn staggerDelay={0.1}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                    <StaggeredChild>
                      <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 rounded-xl">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-3 bg-red-100 rounded-full">
                              <Heart className="h-6 w-6 text-red-600" />
                            </div>
                            <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">
                              Normal
                            </Badge>
                          </div>
                          <h3 className="text-sm font-medium text-gray-600 mb-1">Blood Pressure</h3>
                          <p className="text-2xl font-bold text-gray-900">
                            {healthMetrics.find(m => m.type === 'blood_pressure')?.value || '--'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">mmHg</p>
                        </CardContent>
                      </Card>
                    </StaggeredChild>

                    <StaggeredChild>
                      <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 rounded-xl">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-3 bg-blue-100 rounded-full">
                              <Activity className="h-6 w-6 text-blue-600" />
                            </div>
                            <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">
                              Good
                            </Badge>
                          </div>
                          <h3 className="text-sm font-medium text-gray-600 mb-1">Heart Rate</h3>
                          <p className="text-2xl font-bold text-gray-900">
                            {healthMetrics.find(m => m.type === 'heart_rate')?.value || '--'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">bpm</p>
                        </CardContent>
                      </Card>
                    </StaggeredChild>

                    <StaggeredChild>
                      <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 rounded-xl">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-3 bg-yellow-100 rounded-full">
                              <Thermometer className="h-6 w-6 text-yellow-600" />
                            </div>
                            <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">
                              Normal
                            </Badge>
                          </div>
                          <h3 className="text-sm font-medium text-gray-600 mb-1">Temperature</h3>
                          <p className="text-2xl font-bold text-gray-900">
                            {healthMetrics.find(m => m.type === 'temperature')?.value || '--'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">°F</p>
                        </CardContent>
                      </Card>
                    </StaggeredChild>

                    <StaggeredChild>
                      <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 rounded-xl">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-3 bg-green-100 rounded-full">
                              <Scale className="h-6 w-6 text-green-600" />
                            </div>
                            <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200">
                              On Track
                            </Badge>
                          </div>
                          <h3 className="text-sm font-medium text-gray-600 mb-1">Weight</h3>
                          <p className="text-2xl font-bold text-gray-900">
                            {healthMetrics.find(m => m.type === 'weight')?.value || '--'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">kg</p>
                        </CardContent>
                      </Card>
                    </StaggeredChild>
                  </div>
                </StaggeredFadeIn>

                {/* Additional Stats Cards */}
                <StaggeredFadeIn staggerDelay={0.1}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                    <StaggeredChild>
                      <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 rounded-xl">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Today's Readings</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {healthMetrics.filter(m => 
                                  m.date.toDateString() === new Date().toDateString()
                                ).length}
                              </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                              <Activity className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </StaggeredChild>
                    
                    <StaggeredChild>
                      <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 rounded-xl">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">This Week</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {healthMetrics.filter(m => {
                                  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                                  return m.date >= weekAgo
                                }).length}
                              </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                              <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </StaggeredChild>
                    
                    <StaggeredChild>
                      <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 rounded-xl">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Metrics Tracked</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {new Set(healthMetrics.map(m => m.type)).size}
                              </p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-full">
                              <Heart className="h-6 w-6 text-red-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </StaggeredChild>
                    
                    <StaggeredChild>
                      <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 rounded-xl">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Health Score</p>
                              <p className="text-2xl font-bold text-gray-900">85%</p>
                            </div>
                            <Badge className="bg-green-100 text-green-800 border-0">Good</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </StaggeredChild>
                  </div>
                </StaggeredFadeIn>

                {/* Latest Metrics Dashboard */}
                <FadeInUp delay={0.4} className="mb-8">
                  <Card className="bg-white border-0 shadow-lg rounded-xl">
                    <CardHeader className="pb-6">
                      <CardTitle className="text-gray-900 text-xl font-bold">Latest Readings</CardTitle>
                      <CardDescription className="text-gray-600">Your most recent health measurements</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className="h-24 bg-gray-200 rounded-lg"></div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <StaggeredFadeIn staggerDelay={0.1}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {getLatestMetrics().map((metric, index) => (
                              <StaggeredChild key={metric.id}>
                                <div className="p-6 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-white hover:shadow-md transition-all duration-300">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-blue-100 rounded-lg">
                                        {getMetricIcon(metric.type)}
                                      </div>
                                      <span className="font-semibold text-gray-900">
                                        {getMetricName(metric.type)}
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                      {metric.date.toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="mb-3">
                                    <span className="text-2xl font-bold text-gray-900">
                                      {metric.value}
                                    </span>
                                    <span className="text-gray-600 ml-2">
                                      {metric.unit}
                                    </span>
                                  </div>
                                  {metric.target && (
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm text-gray-600">
                                        <span>Target: {metric.target}</span>
                                        <span>{Math.round(calculateProgress(metric.type, metric.value, metric.target))}%</span>
                                      </div>
                                      <Progress 
                                        value={calculateProgress(metric.type, metric.value, metric.target)} 
                                        className="h-2 bg-gray-200"
                                      />
                                    </div>
                                  )}
                                </div>
                              </StaggeredChild>
                            ))}
                          </div>
                        </StaggeredFadeIn>
                      )}
                    </CardContent>
                  </Card>
                </FadeInUp>

                {/* Recent Readings */}
                <FadeInUp delay={0.5}>
                  <Card className="bg-white border-0 shadow-lg rounded-xl">
                    <CardHeader className="pb-6">
                      <CardTitle className="text-gray-900 text-xl font-bold">Recent Readings</CardTitle>
                      <CardDescription className="text-gray-600">Complete history of your health measurements</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="space-y-4">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className="h-20 bg-gray-200 rounded-lg"></div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <StaggeredFadeIn staggerDelay={0.05}>
                          <div className="space-y-4">
                            {healthMetrics
                              .sort((a, b) => b.date.getTime() - a.date.getTime())
                              .map((metric) => (
                              <StaggeredChild key={metric.id}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border border-gray-100 rounded-xl bg-gray-50/30 hover:bg-white hover:shadow-md transition-all duration-300">
                                  <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                      {getMetricIcon(metric.type)}
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-gray-900">
                                        {getMetricName(metric.type)}
                                      </h3>
                                      <p className="text-sm text-gray-600">
                                        {metric.date.toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-left sm:text-right">
                                    <p className="font-bold text-gray-900 text-lg">
                                      {metric.value} {metric.unit}
                                    </p>
                                    {metric.target && (
                                      <p className="text-sm text-gray-600">
                                        Target: {metric.target}
                                      </p>
                                    )}
                                  </div>
                                  {metric.notes && (
                                    <div className="text-sm text-gray-700 mt-3 sm:mt-0 sm:max-w-xs bg-gray-100 p-3 rounded-lg">
                                      {metric.notes}
                                    </div>
                                  )}
                                </div>
                              </StaggeredChild>
                            ))}
                          </div>
                        </StaggeredFadeIn>
                      )}
                    </CardContent>
                  </Card>
                </FadeInUp>
              </div>
            </main>
          </div>
        </div>
      </PageTransition>
    </AuthGuard>
  )
}