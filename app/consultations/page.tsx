"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Menu, Stethoscope, Plus, Calendar, Clock, User, MapPin, FileText, Phone, Video, Search } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

interface Consultation {
  id: string
  doctorName: string
  specialty: string
  date: Date
  time: string
  type: 'in-person' | 'video' | 'phone'
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  location?: string
  reason: string
  notes?: string
  followUp?: Date
  prescriptions?: string[]
  cost?: number
}

export default function ConsultationsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isMobile, setIsMobile] = useState(false)
  const { user, userProfile } = useAuth()

  // Sample consultations data
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setConsultations([
        {
          id: '1',
          doctorName: 'Dr. Sarah Wilson',
          specialty: 'Cardiology',
          date: new Date('2024-12-28'),
          time: '10:00 AM',
          type: 'in-person',
          status: 'scheduled',
          location: 'City Medical Center, Room 205',
          reason: 'Regular heart checkup',
          cost: 150
        },
        {
          id: '2',
          doctorName: 'Dr. Michael Chen',
          specialty: 'Endocrinology',
          date: new Date('2024-12-15'),
          time: '2:30 PM',
          type: 'video',
          status: 'completed',
          reason: 'Diabetes management review',
          notes: 'Blood sugar levels improving. Continue current medication.',
          prescriptions: ['Metformin 500mg twice daily', 'Insulin as needed'],
          followUp: new Date('2025-03-15'),
          cost: 120
        },
        {
          id: '3',
          doctorName: 'Dr. Emily Rodriguez',
          specialty: 'General Practice',
          date: new Date('2024-11-20'),
          time: '11:15 AM',
          type: 'in-person',
          status: 'completed',
          location: 'Family Health Clinic',
          reason: 'Annual physical examination',
          notes: 'Overall health is good. Blood pressure slightly elevated.',
          prescriptions: ['Lisinopril 10mg daily'],
          cost: 200
        },
        {
          id: '4',
          doctorName: 'Dr. James Thompson',
          specialty: 'Orthopedics',
          date: new Date('2024-10-05'),
          time: '9:00 AM',
          type: 'phone',
          status: 'completed',
          reason: 'Follow-up on knee pain',
          notes: 'Pain has subsided. Physical therapy recommended.',
          cost: 80
        },
        {
          id: '5',
          doctorName: 'Dr. Lisa Park',
          specialty: 'Dermatology',
          date: new Date('2024-09-10'),
          time: '3:00 PM',
          type: 'in-person',
          status: 'no-show',
          location: 'Skin Care Institute',
          reason: 'Mole examination',
          cost: 180
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

  const getStatusColor = (status: Consultation['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      case 'no-show': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: Consultation['type']) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />
      case 'phone': return <Phone className="h-4 w-4" />
      case 'in-person': return <User className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  const filteredConsultations = consultations.filter(consultation => {
    const matchesSearch = consultation.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         consultation.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         consultation.reason.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = selectedStatus === 'all' || consultation.status === selectedStatus
    
    return matchesSearch && matchesStatus
  })

  const upcomingCount = consultations.filter(c => c.status === 'scheduled').length
  const completedCount = consultations.filter(c => c.status === 'completed').length
  const totalCost = consultations.filter(c => c.status === 'completed').reduce((sum, c) => sum + (c.cost || 0), 0)

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
            <h1 className="text-lg font-semibold text-gray-900">Consultations</h1>
            <div className="w-8" />
          </div>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Stethoscope className="h-8 w-8 text-blue-600" />
                    Medical Consultations
                  </h1>
                  <Button 
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Consultation
                  </Button>
                </div>
                <p className="text-gray-600">
                  Manage your medical appointments and consultation history
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total</p>
                        <p className="text-2xl font-bold text-gray-900">{consultations.length}</p>
                      </div>
                      <Stethoscope className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Upcoming</p>
                        <p className="text-2xl font-bold text-blue-600">{upcomingCount}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-blue-600" />
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
                      <FileText className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Cost</p>
                        <p className="text-2xl font-bold text-gray-900">${totalCost}</p>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800">YTD</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by doctor, specialty, or reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no-show">No Show</option>
                </select>
              </div>

              {loading ? (
                <div className="space-y-4">
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
                <div className="space-y-4">
                  {filteredConsultations.length === 0 ? (
                    <Card className="text-center py-12">
                      <CardContent>
                        <Stethoscope className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No consultations found
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Schedule your first consultation or adjust your search filters.
                        </p>
                        <Button 
                          onClick={() => setShowAddForm(true)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Schedule Consultation
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredConsultations
                      .sort((a, b) => b.date.getTime() - a.date.getTime())
                      .map((consultation) => (
                      <Card key={consultation.id} className="transition-all duration-200 hover:shadow-md">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg text-gray-900">
                                  {consultation.doctorName}
                                </h3>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  {consultation.specialty}
                                </Badge>
                                <Badge variant="outline" className={getStatusColor(consultation.status)}>
                                  {consultation.status.toUpperCase()}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>{consultation.date.toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>{consultation.time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getTypeIcon(consultation.type)}
                                  <span className="capitalize">{consultation.type.replace('-', ' ')}</span>
                                </div>
                                {consultation.cost && (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Cost:</span>
                                    <span>${consultation.cost}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="mb-3">
                                <span className="font-medium text-gray-900">Reason:</span>
                                <span className="ml-2 text-gray-600">{consultation.reason}</span>
                              </div>
                              
                              {consultation.location && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{consultation.location}</span>
                                </div>
                              )}
                              
                              {consultation.notes && (
                                <div className="mb-3">
                                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                    <span className="font-medium">Notes:</span> {consultation.notes}
                                  </p>
                                </div>
                              )}
                              
                              {consultation.prescriptions && consultation.prescriptions.length > 0 && (
                                <div className="mb-3">
                                  <p className="font-medium text-gray-900 mb-2">Prescriptions:</p>
                                  <div className="space-y-1 ml-4">
                                    {consultation.prescriptions.map((prescription, index) => (
                                      <p key={index} className="text-sm text-gray-600">• {prescription}</p>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {consultation.followUp && (
                                <div className="flex items-center gap-2 text-sm text-blue-600">
                                  <Calendar className="h-4 w-4" />
                                  <span>Follow-up: {consultation.followUp.toLocaleDateString()}</span>
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