"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Menu, Settings as SettingsIcon, User, Bell, Shield, Smartphone, Moon, Sun, Globe, Lock, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

interface UserSettings {
  // Profile Settings
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  emergencyContact: string
  
  // Notification Settings
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  medicationReminders: boolean
  appointmentReminders: boolean
  healthInsights: boolean
  
  // Privacy Settings
  dataSharing: boolean
  analyticsTracking: boolean
  locationServices: boolean
  
  // App Settings
  darkMode: boolean
  language: string
  timezone: string
  units: 'metric' | 'imperial'
}

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settings, setSettings] = useState<UserSettings>({
    // Profile Settings
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1990-05-15',
    emergencyContact: '+1 (555) 987-6543',
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    medicationReminders: true,
    appointmentReminders: true,
    healthInsights: false,
    
    // Privacy Settings
    dataSharing: false,
    analyticsTracking: true,
    locationServices: true,
    
    // App Settings
    darkMode: false,
    language: 'en',
    timezone: 'America/New_York',
    units: 'imperial'
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const { user, userProfile, logout } = useAuth()

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const saveSettings = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success("Settings saved successfully")
    setLoading(false)
  }

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match")
      return
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success("Password changed successfully")
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setLoading(false)
  }

  const exportData = () => {
    toast.success("Data export initiated. You'll receive an email with your data.")
  }

  const deleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      toast.success("Account deletion request submitted")
    }
  }

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
            <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
            <div className="w-8" />
          </div>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                  <SettingsIcon className="h-8 w-8 text-blue-600" />
                  Settings
                </h1>
                <p className="text-gray-600">
                  Manage your account preferences and application settings
                </p>
              </div>

              <div className="space-y-8">
                {/* Profile Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>Update your personal information and contact details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={settings.firstName}
                          onChange={(e) => handleSettingChange('firstName', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={settings.lastName}
                          onChange={(e) => handleSettingChange('lastName', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={settings.email}
                          onChange={(e) => handleSettingChange('email', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={settings.phone}
                          onChange={(e) => handleSettingChange('phone', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={settings.dateOfBirth}
                          onChange={(e) => handleSettingChange('dateOfBirth', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyContact">Emergency Contact</Label>
                        <Input
                          id="emergencyContact"
                          value={settings.emergencyContact}
                          onChange={(e) => handleSettingChange('emergencyContact', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Password Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Password & Security
                    </CardTitle>
                    <CardDescription>Update your password and security settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      onClick={changePassword} 
                      disabled={loading || !currentPassword || !newPassword}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? 'Changing...' : 'Change Password'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notifications
                    </CardTitle>
                    <CardDescription>Manage how and when you receive notifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="emailNotifications" className="font-medium">Email Notifications</Label>
                          <p className="text-sm text-gray-600">Receive notifications via email</p>
                        </div>
                        <Switch
                          id="emailNotifications"
                          checked={settings.emailNotifications}
                          onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="smsNotifications" className="font-medium">SMS Notifications</Label>
                          <p className="text-sm text-gray-600">Receive notifications via text message</p>
                        </div>
                        <Switch
                          id="smsNotifications"
                          checked={settings.smsNotifications}
                          onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="pushNotifications" className="font-medium">Push Notifications</Label>
                          <p className="text-sm text-gray-600">Receive push notifications on your device</p>
                        </div>
                        <Switch
                          id="pushNotifications"
                          checked={settings.pushNotifications}
                          onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="medicationReminders" className="font-medium">Medication Reminders</Label>
                          <p className="text-sm text-gray-600">Get reminded to take your medications</p>
                        </div>
                        <Switch
                          id="medicationReminders"
                          checked={settings.medicationReminders}
                          onCheckedChange={(checked) => handleSettingChange('medicationReminders', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="appointmentReminders" className="font-medium">Appointment Reminders</Label>
                          <p className="text-sm text-gray-600">Get reminded about upcoming appointments</p>
                        </div>
                        <Switch
                          id="appointmentReminders"
                          checked={settings.appointmentReminders}
                          onCheckedChange={(checked) => handleSettingChange('appointmentReminders', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="healthInsights" className="font-medium">Health Insights</Label>
                          <p className="text-sm text-gray-600">Receive AI-powered health insights</p>
                        </div>
                        <Switch
                          id="healthInsights"
                          checked={settings.healthInsights}
                          onCheckedChange={(checked) => handleSettingChange('healthInsights', checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Privacy Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Privacy & Data
                    </CardTitle>
                    <CardDescription>Control your privacy and data sharing preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="dataSharing" className="font-medium">Data Sharing</Label>
                          <p className="text-sm text-gray-600">Share anonymized data to improve our services</p>
                        </div>
                        <Switch
                          id="dataSharing"
                          checked={settings.dataSharing}
                          onCheckedChange={(checked) => handleSettingChange('dataSharing', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="analyticsTracking" className="font-medium">Analytics Tracking</Label>
                          <p className="text-sm text-gray-600">Allow analytics to help us improve the app</p>
                        </div>
                        <Switch
                          id="analyticsTracking"
                          checked={settings.analyticsTracking}
                          onCheckedChange={(checked) => handleSettingChange('analyticsTracking', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="locationServices" className="font-medium">Location Services</Label>
                          <p className="text-sm text-gray-600">Allow app to access your location for emergency features</p>
                        </div>
                        <Switch
                          id="locationServices"
                          checked={settings.locationServices}
                          onCheckedChange={(checked) => handleSettingChange('locationServices', checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* App Preferences */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      App Preferences
                    </CardTitle>
                    <CardDescription>Customize your app experience</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="darkMode" className="font-medium">Dark Mode</Label>
                        <p className="text-sm text-gray-600">Use dark theme throughout the app</p>
                      </div>
                      <Switch
                        id="darkMode"
                        checked={settings.darkMode}
                        onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="language">Language</Label>
                        <select
                          id="language"
                          value={settings.language}
                          onChange={(e) => handleSettingChange('language', e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="units">Units</Label>
                        <select
                          id="units"
                          value={settings.units}
                          onChange={(e) => handleSettingChange('units', e.target.value as 'metric' | 'imperial')}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="imperial">Imperial (lb, ft, °F)</option>
                          <option value="metric">Metric (kg, cm, °C)</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Data Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Data Management
                    </CardTitle>
                    <CardDescription>Manage your data and account</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button 
                        onClick={exportData} 
                        variant="outline"
                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                      >
                        Export My Data
                      </Button>
                      <Button 
                        onClick={deleteAccount} 
                        variant="outline"
                        className="border-red-600 text-red-600 hover:bg-red-50"
                      >
                        Delete Account
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Export includes all your health data, settings, and activity history. 
                      Account deletion is permanent and cannot be undone.
                    </p>
                  </CardContent>
                </Card>

                {/* Save Settings */}
                <div className="flex justify-end">
                  <Button 
                    onClick={saveSettings} 
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 px-8"
                  >
                    {loading ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}