"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Menu, Brain, TrendingUp, TrendingDown, BarChart3, PieChart, AlertCircle, CheckCircle, Target, Calendar } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

interface HealthInsight {
  id: string
  type: 'trend' | 'recommendation' | 'risk' | 'achievement'
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
  category: 'cardiovascular' | 'weight' | 'activity' | 'sleep' | 'medication' | 'general'
  date: Date
  actionable: boolean
}

interface HealthScore {
  overall: number
  cardiovascular: number
  weight: number
  activity: number
  sleep: number
  medication: number
}

export default function HealthInsightsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [insights, setInsights] = useState<HealthInsight[]>([])
  const [healthScores, setHealthScores] = useState<HealthScore>({
    overall: 85,
    cardiovascular: 88,
    weight: 82,
    activity: 75,
    sleep: 90,
    medication: 95
  })
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month')
  const [isMobile, setIsMobile] = useState(false)
  const { user, userProfile } = useAuth()

  // Sample insights data
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setInsights([
        {
          id: '1',
          type: 'achievement',
          title: 'Excellent Blood Pressure Control',
          description: 'Your blood pressure has been consistently in the normal range for the past 2 weeks. Keep up the great work!',
          severity: 'low',
          category: 'cardiovascular',
          date: new Date(),
          actionable: false
        },
        {
          id: '2',
          type: 'recommendation',
          title: 'Increase Daily Activity',
          description: 'Your step count has decreased by 15% this month. Consider adding a 20-minute walk to your daily routine.',
          severity: 'medium',
          category: 'activity',
          date: new Date(Date.now() - 86400000),
          actionable: true
        },
        {
          id: '3',
          type: 'trend',
          title: 'Weight Trending Upward',
          description: 'Your weight has increased by 2.5kg over the past month. Consider reviewing your diet and exercise routine.',
          severity: 'medium',
          category: 'weight',
          date: new Date(Date.now() - 172800000),
          actionable: true
        },
        {
          id: '4',
          type: 'risk',
          title: 'Medication Adherence Alert',
          description: 'You\'ve missed taking your medication 3 times this week. Consistent medication adherence is crucial for your health.',
          severity: 'high',
          category: 'medication',
          date: new Date(Date.now() - 259200000),
          actionable: true
        },
        {
          id: '5',
          type: 'achievement',
          title: 'Excellent Sleep Quality',
          description: 'Your sleep duration has been consistently 7-8 hours with good quality scores. This supports overall health.',
          severity: 'low',
          category: 'sleep',
          date: new Date(Date.now() - 345600000),
          actionable: false
        },
        {
          id: '6',
          type: 'trend',
          title: 'Heart Rate Variability Improved',
          description: 'Your resting heart rate has improved by 8% over the past quarter, indicating better cardiovascular fitness.',
          severity: 'low',
          category: 'cardiovascular',
          date: new Date(Date.now() - 432000000),
          actionable: false
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

  const getSeverityColor = (severity: HealthInsight['severity']) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: HealthInsight['type']) => {
    switch (type) {
      case 'achievement': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'recommendation': return <Target className="h-5 w-5 text-blue-500" />
      case 'trend': return <TrendingUp className="h-5 w-5 text-purple-500" />
      case 'risk': return <AlertCircle className="h-5 w-5 text-red-500" />
      default: return <Brain className="h-5 w-5 text-gray-500" />
    }
  }

  const getCategoryName = (category: HealthInsight['category']) => {
    switch (category) {
      case 'cardiovascular': return 'Cardiovascular'
      case 'weight': return 'Weight Management'
      case 'activity': return 'Physical Activity'
      case 'sleep': return 'Sleep Health'
      case 'medication': return 'Medication'
      case 'general': return 'General Health'
      default: return category
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filteredInsights = insights.filter(insight => {
    const now = new Date()
    const timeframe = selectedTimeframe === 'week' ? 7 : selectedTimeframe === 'month' ? 30 : 90
    const cutoff = new Date(now.getTime() - timeframe * 24 * 60 * 60 * 1000)
    return insight.date >= cutoff
  })

  const achievementCount = filteredInsights.filter(i => i.type === 'achievement').length
  const actionableCount = filteredInsights.filter(i => i.actionable).length
  const riskCount = filteredInsights.filter(i => i.type === 'risk').length

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="flex-1 flex flex-col lg:ml-64">
          {/* Mobile Header */}
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="p-2"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Health Insights</h1>
            <div className="w-8" />
          </div>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Brain className="h-8 w-8 text-blue-600" />
                    Health Insights
                  </h1>
                  <div className="flex gap-2">
                    {(['week', 'month', 'quarter'] as const).map((timeframe) => (
                      <Button
                        key={timeframe}
                        variant={selectedTimeframe === timeframe ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTimeframe(timeframe)}
                        className={selectedTimeframe === timeframe ? "bg-blue-600 hover:bg-blue-700" : ""}
                      >
                        {timeframe === 'quarter' ? '3 Months' : timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
                <p className="text-gray-600">
                  AI-powered analysis of your health trends and personalized recommendations
                </p>
              </div>

              {/* Health Scores */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <Card className="text-center">
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold mb-2 text-gray-900">
                      {healthScores.overall}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Overall</div>
                    <Progress value={healthScores.overall} className="h-2" />
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardContent className="p-6">
                    <div className={`text-2xl font-bold mb-2 ${getScoreColor(healthScores.cardiovascular)}`}>
                      {healthScores.cardiovascular}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Heart</div>
                    <Progress value={healthScores.cardiovascular} className="h-2" />
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardContent className="p-6">
                    <div className={`text-2xl font-bold mb-2 ${getScoreColor(healthScores.weight)}`}>
                      {healthScores.weight}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Weight</div>
                    <Progress value={healthScores.weight} className="h-2" />
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardContent className="p-6">
                    <div className={`text-2xl font-bold mb-2 ${getScoreColor(healthScores.activity)}`}>
                      {healthScores.activity}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Activity</div>
                    <Progress value={healthScores.activity} className="h-2" />
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardContent className="p-6">
                    <div className={`text-2xl font-bold mb-2 ${getScoreColor(healthScores.sleep)}`}>
                      {healthScores.sleep}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Sleep</div>
                    <Progress value={healthScores.sleep} className="h-2" />
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardContent className="p-6">
                    <div className={`text-2xl font-bold mb-2 ${getScoreColor(healthScores.medication)}`}>
                      {healthScores.medication}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Medication</div>
                    <Progress value={healthScores.medication} className="h-2" />
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Insights</p>
                        <p className="text-2xl font-bold text-gray-900">{filteredInsights.length}</p>
                      </div>
                      <Brain className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Achievements</p>
                        <p className="text-2xl font-bold text-green-600">{achievementCount}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Action Items</p>
                        <p className="text-2xl font-bold text-orange-600">{actionableCount}</p>
                      </div>
                      <Target className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Risk Alerts</p>
                        <p className="text-2xl font-bold text-red-600">{riskCount}</p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Insights List */}
              <Card>
                <CardHeader>
                  <CardTitle>Health Insights & Recommendations</CardTitle>
                  <CardDescription>
                    Personalized insights based on your health data for the selected timeframe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-20 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredInsights.length === 0 ? (
                        <div className="text-center py-12">
                          <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No insights available
                          </h3>
                          <p className="text-gray-500">
                            Continue tracking your health data to receive personalized insights.
                          </p>
                        </div>
                      ) : (
                        filteredInsights.map((insight) => (
                          <div 
                            key={insight.id} 
                            className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {getTypeIcon(insight.type)}
                                  <h3 className="font-semibold text-lg text-gray-900">
                                    {insight.title}
                                  </h3>
                                  <Badge variant="outline" className={getSeverityColor(insight.severity)}>
                                    {insight.severity.toUpperCase()}
                                  </Badge>
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                    {getCategoryName(insight.category)}
                                  </Badge>
                                </div>
                                <p className="text-gray-600 mb-3 leading-relaxed">
                                  {insight.description}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {insight.date.toLocaleDateString()}
                                  </div>
                                  {insight.actionable && (
                                    <Badge className="bg-orange-100 text-orange-800 text-xs">
                                      Action Required
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {insight.actionable && (
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                  Take Action
                                </Button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}