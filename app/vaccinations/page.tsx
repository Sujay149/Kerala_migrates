"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Menu, Syringe, Plus, Calendar, Shield, CheckCircle, Clock, Search } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

interface Vaccination {
  id: string
  name: string
  type: 'routine' | 'travel' | 'seasonal' | 'booster'
  dateGiven: Date
  nextDue?: Date
  provider: string
  batchNumber?: string
  status: 'completed' | 'overdue' | 'upcoming'
  notes?: string
}

export default function VaccinationsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { user, userProfile } = useAuth()

  // Sample vaccinations data
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setVaccinations([
        {
          id: '1',
          name: 'COVID-19 Pfizer',
          type: 'routine',
          dateGiven: new Date('2024-06-15'),
          nextDue: new Date('2025-06-15'),
          provider: 'City Health Clinic',
          batchNumber: 'PF2024061501',
          status: 'completed',
          notes: 'First dose, no adverse reactions'
        },
        {
          id: '2',
          name: 'Influenza Vaccine',
          type: 'seasonal',
          dateGiven: new Date('2024-10-01'),
          nextDue: new Date('2025-10-01'),
          provider: 'Family Doctor',
          status: 'completed'
        },
        {
          id: '3',
          name: 'Tetanus Booster',
          type: 'booster',
          dateGiven: new Date('2023-03-20'),
          nextDue: new Date('2033-03-20'),
          provider: 'Community Health Center',
          status: 'completed'
        },
        {
          id: '4',
          name: 'Hepatitis B',
          type: 'travel',
          dateGiven: new Date('2024-01-10'),
          provider: 'Travel Clinic',
          status: 'completed'
        },
        {
          id: '5',
          name: 'Annual Flu Shot',
          type: 'seasonal',
          dateGiven: new Date('2023-09-15'),
          nextDue: new Date('2024-09-15'),
          provider: 'Pharmacy Clinic',
          status: 'overdue'
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

  const getStatusColor = (status: Vaccination['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200'
      case 'upcoming': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeColor = (type: Vaccination['type']) => {
    switch (type) {
      case 'routine': return 'bg-blue-100 text-blue-800'
      case 'travel': return 'bg-purple-100 text-purple-800'
      case 'seasonal': return 'bg-orange-100 text-orange-800'
      case 'booster': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredVaccinations = vaccinations.filter(vaccine =>
    vaccine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vaccine.provider.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const completedCount = vaccinations.filter(v => v.status === 'completed').length
  const overdueCount = vaccinations.filter(v => v.status === 'overdue').length
  const upcomingCount = vaccinations.filter(v => v.status === 'upcoming').length

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
            <h1 className="text-lg font-semibold text-gray-900">Vaccinations</h1>
            <div className="w-8" />
          </div>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Syringe className="h-8 w-8 text-blue-600" />
                    Vaccination Records
                  </h1>
                  <Button 
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vaccination
                  </Button>
                </div>
                <p className="text-gray-600">
                  Track your vaccination history and upcoming immunizations
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total</p>
                        <p className="text-2xl font-bold text-gray-900">{vaccinations.length}</p>
                      </div>
                      <Syringe className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Completed</p>
                        <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Overdue</p>
                        <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
                      </div>
                      <Clock className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Protected</p>
                        <p className="text-2xl font-bold text-blue-600">{Math.round((completedCount / vaccinations.length) * 100)}%</p>
                      </div>
                      <Shield className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search vaccinations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {loading ? (
                <div className="grid gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredVaccinations.length === 0 ? (
                    <Card className="text-center py-12">
                      <CardContent>
                        <Syringe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No vaccination records found
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Start tracking your immunizations by adding your first vaccination record.
                        </p>
                        <Button 
                          onClick={() => setShowAddForm(true)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Vaccination
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredVaccinations.map((vaccination) => (
                      <Card key={vaccination.id} className="transition-all duration-200 hover:shadow-md">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg text-gray-900">
                                  {vaccination.name}
                                </h3>
                                <Badge variant="outline" className={getTypeColor(vaccination.type)}>
                                  {vaccination.type.toUpperCase()}
                                </Badge>
                                <Badge variant="outline" className={getStatusColor(vaccination.status)}>
                                  {vaccination.status.toUpperCase()}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>Given: {vaccination.dateGiven.toLocaleDateString()}</span>
                                </div>
                                {vaccination.nextDue && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>Next: {vaccination.nextDue.toLocaleDateString()}</span>
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium">Provider:</span> {vaccination.provider}
                                </div>
                                {vaccination.batchNumber && (
                                  <div>
                                    <span className="font-medium">Batch:</span> {vaccination.batchNumber}
                                  </div>
                                )}
                              </div>
                              
                              {vaccination.notes && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm text-gray-700">
                                    <span className="font-medium">Notes:</span> {vaccination.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}