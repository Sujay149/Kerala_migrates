"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Menu, Bell, Plus, Calendar, Clock, Pill, Stethoscope, Activity, AlertTriangle, Check, X } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

interface Reminder {
  id: string
  title: string
  type: 'medication' | 'appointment' | 'exercise' | 'checkup' | 'lab_test'
  description: string
  time: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'as_needed'
  isActive: boolean
  nextReminder: Date
  lastTriggered?: Date
  reminderMethods: ('push' | 'sms' | 'email')[]
}

export default function RemindersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { user, userProfile } = useAuth()

  // Sample reminders data
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setReminders([
        {
          id: '1',
          title: 'Morning Medication',
          type: 'medication',
          description: 'Take Lisinopril 10mg and Aspirin 75mg',
          time: '08:00',
          frequency: 'daily',
          isActive: true,
          nextReminder: new Date('2024-12-22T08:00:00'),
          lastTriggered: new Date('2024-12-21T08:00:00'),
          reminderMethods: ['push', 'sms']
        },
        {
          id: '2',
          title: 'Evening Medication',
          type: 'medication',
          description: 'Take Metformin 500mg',
          time: '20:00',
          frequency: 'daily',
          isActive: true,
          nextReminder: new Date('2024-12-21T20:00:00'),
          reminderMethods: ['push']
        },
        {
          id: '3',
          title: 'Cardiology Appointment',
          type: 'appointment',
          description: 'Follow-up appointment with Dr. Sarah Wilson',
          time: '10:00',
          frequency: 'as_needed',
          isActive: true,
          nextReminder: new Date('2024-12-28T09:00:00'),
          reminderMethods: ['push', 'email']
        },
        {
          id: '4',
          title: 'Morning Walk',
          type: 'exercise',
          description: '30-minute walk in the park',
          time: '07:00',
          frequency: 'daily',
          isActive: false,
          nextReminder: new Date('2024-12-22T07:00:00'),
          reminderMethods: ['push']
        },
        {
          id: '5',
          title: 'Blood Pressure Check',
          type: 'checkup',
          description: 'Monthly blood pressure monitoring',
          time: '09:00',
          frequency: 'monthly',
          isActive: true,
          nextReminder: new Date('2025-01-01T09:00:00'),
          lastTriggered: new Date('2024-12-01T09:00:00'),
          reminderMethods: ['push', 'sms', 'email']
        },
        {
          id: '6',
          title: 'Lab Work',
          type: 'lab_test',
          description: 'Quarterly blood work and cholesterol check',
          time: '08:30',
          frequency: 'monthly',
          isActive: true,
          nextReminder: new Date('2025-03-01T08:30:00'),
          reminderMethods: ['push', 'email']
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

  const getTypeColor = (type: Reminder['type']) => {
    switch (type) {
      case 'medication': return 'bg-green-100 text-green-800'
      case 'appointment': return 'bg-blue-100 text-blue-800'
      case 'exercise': return 'bg-purple-100 text-purple-800'
      case 'checkup': return 'bg-orange-100 text-orange-800'
      case 'lab_test': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: Reminder['type']) => {
    switch (type) {
      case 'medication': return <Pill className="h-4 w-4" />
      case 'appointment': return <Stethoscope className="h-4 w-4" />
      case 'exercise': return <Activity className="h-4 w-4" />
      case 'checkup': return <Calendar className="h-4 w-4" />
      case 'lab_test': return <AlertTriangle className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getTypeName = (type: Reminder['type']) => {
    switch (type) {
      case 'medication': return 'Medication'
      case 'appointment': return 'Appointment'
      case 'exercise': return 'Exercise'
      case 'checkup': return 'Health Check'
      case 'lab_test': return 'Lab Test'
      default: return type
    }
  }

  const getFrequencyColor = (frequency: Reminder['frequency']) => {
    switch (frequency) {
      case 'daily': return 'bg-blue-100 text-blue-800'
      case 'weekly': return 'bg-green-100 text-green-800'
      case 'monthly': return 'bg-purple-100 text-purple-800'
      case 'as_needed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(reminder => 
      reminder.id === id ? { ...reminder, isActive: !reminder.isActive } : reminder
    ))
    toast.success('Reminder updated')
  }

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== id))
    toast.success('Reminder deleted')
  }

  const markAsComplete = (id: string) => {
    const reminder = reminders.find(r => r.id === id)
    if (reminder) {
      setReminders(prev => prev.map(r => 
        r.id === id ? { ...r, lastTriggered: new Date() } : r
      ))
      toast.success(`${reminder.title} marked as complete`)
    }
  }

  const activeReminders = reminders.filter(r => r.isActive).length
  const todayReminders = reminders.filter(r => {
    const today = new Date()
    const reminderDate = new Date(r.nextReminder)
    return r.isActive && reminderDate.toDateString() === today.toDateString()
  }).length

  const upcomingReminders = reminders.filter(r => {
    const now = new Date()
    const reminderDate = new Date(r.nextReminder)
    const hoursDiff = (reminderDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    return r.isActive && hoursDiff > 0 && hoursDiff <= 24
  })

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
            <h1 className="text-lg font-semibold text-gray-900">Reminders</h1>
            <div className="w-8" />
          </div>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Bell className="h-8 w-8 text-blue-600" />
                    Health Reminders
                  </h1>
                  <Button 
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Reminder
                  </Button>
                </div>
                <p className="text-gray-600">
                  Stay on top of your health with personalized reminders and notifications
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Reminders</p>
                        <p className="text-2xl font-bold text-gray-900">{activeReminders}</p>
                      </div>
                      <Bell className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Today</p>
                        <p className="text-2xl font-bold text-green-600">{todayReminders}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Next 24h</p>
                        <p className="text-2xl font-bold text-orange-600">{upcomingReminders.length}</p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming Reminders Alert */}
              {upcomingReminders.length > 0 && (
                <Card className="mb-8 border-orange-200 bg-orange-50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <h3 className="font-medium text-orange-900">
                        Upcoming Reminders (Next 24 Hours)
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {upcomingReminders.slice(0, 3).map((reminder) => (
                        <div key={reminder.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(reminder.type)}
                            <span className="text-orange-800">{reminder.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-orange-700">
                              {new Date(reminder.nextReminder).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-green-600 border-green-300 hover:bg-green-50"
                              onClick={() => markAsComplete(reminder.id)}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reminders List */}
              <Card>
                <CardHeader>
                  <CardTitle>All Reminders</CardTitle>
                  <CardDescription>Manage your health reminders and notifications</CardDescription>
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
                  ) : reminders.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No reminders set
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Create your first reminder to stay on top of your health
                      </p>
                      <Button 
                        onClick={() => setShowAddForm(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Reminder
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reminders
                        .sort((a, b) => new Date(a.nextReminder).getTime() - new Date(b.nextReminder).getTime())
                        .map((reminder) => (
                        <div key={reminder.id} className="flex items-center justify-between p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(reminder.type)}
                              <Switch
                                checked={reminder.isActive}
                                onCheckedChange={() => toggleReminder(reminder.id)}
                              />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className={`font-semibold ${reminder.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                                  {reminder.title}
                                </h3>
                                <Badge variant="outline" className={getTypeColor(reminder.type)}>
                                  {getTypeName(reminder.type)}
                                </Badge>
                                <Badge variant="outline" className={getFrequencyColor(reminder.frequency)}>
                                  {reminder.frequency.replace('_', ' ')}
                                </Badge>
                              </div>
                              
                              <p className={`text-sm mb-2 ${reminder.isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                                {reminder.description}
                              </p>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{reminder.time}</span>
                                </div>
                                <div>
                                  <span className="font-medium">Next:</span> {new Date(reminder.nextReminder).toLocaleDateString()}
                                </div>
                                {reminder.lastTriggered && (
                                  <div>
                                    <span className="font-medium">Last:</span> {new Date(reminder.lastTriggered).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 mt-2">
                                {reminder.reminderMethods.map((method) => (
                                  <Badge key={method} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                    {method.toUpperCase()}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {reminder.isActive && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-green-600 border-green-300 hover:bg-green-50"
                                onClick={() => markAsComplete(reminder.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => deleteReminder(reminder.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
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