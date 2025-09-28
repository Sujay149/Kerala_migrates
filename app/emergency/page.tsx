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
import { Menu, Phone, AlertTriangle, MapPin, Heart, User, Clock, Shield } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

interface EmergencyContact {
  id: string
  name: string
  relationship: string
  phone: string
  isPrimary: boolean
}

interface MedicalInfo {
  bloodType: string
  allergies: string[]
  medications: string[]
  medicalConditions: string[]
  emergencyNotes: string
}

export default function EmergencyPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo>({
    bloodType: 'O+',
    allergies: ['Penicillin', 'Shellfish'],
    medications: ['Aspirin 75mg daily', 'Lisinopril 10mg'],
    medicalConditions: ['Hypertension', 'Diabetes Type 2'],
    emergencyNotes: 'Contact Dr. Smith at City Hospital for medical history'
  })
  const [loading, setLoading] = useState(true)
  const [currentLocation, setCurrentLocation] = useState<string>('')
  const [isMobile, setIsMobile] = useState(false)
  const { user, userProfile } = useAuth()

  // Sample emergency contacts data
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setEmergencyContacts([
        {
          id: '1',
          name: 'John Doe',
          relationship: 'Spouse',
          phone: '+1 (555) 123-4567',
          isPrimary: true
        },
        {
          id: '2',
          name: 'Jane Smith',
          relationship: 'Sister',
          phone: '+1 (555) 987-6543',
          isPrimary: false
        },
        {
          id: '3',
          name: 'Dr. Wilson',
          relationship: 'Primary Care Physician',
          phone: '+1 (555) 456-7890',
          isPrimary: false
        }
      ])
      setLoading(false)
    }, 1000)

    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`)
        },
        () => {
          setCurrentLocation('Location access denied')
        }
      )
    }

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const callEmergencyServices = () => {
    // In a real app, this would trigger emergency services
    toast.success("Emergency services would be contacted")
    // window.location.href = 'tel:911'
  }

  const callEmergencyContact = (phone: string, name: string) => {
    toast.success(`Calling ${name}`)
    // window.location.href = `tel:${phone}`
  }

  const shareLocation = () => {
    if (navigator.share && currentLocation) {
      navigator.share({
        title: 'My Emergency Location',
        text: `I need help. My current location is: ${currentLocation}`,
        url: `https://maps.google.com/?q=${currentLocation}`
      }).then(() => {
        toast.success("Location shared successfully")
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(`Emergency location: ${currentLocation}`)
        toast.success("Location copied to clipboard")
      })
    } else {
      navigator.clipboard.writeText(`Emergency location: ${currentLocation}`)
      toast.success("Location copied to clipboard")
    }
  }

  const emergencyNumbers = [
    { name: 'Emergency Services', number: '911', color: 'bg-red-600 hover:bg-red-700' },
    { name: 'Poison Control', number: '1-800-222-1222', color: 'bg-purple-600 hover:bg-purple-700' },
    { name: 'Mental Health Crisis', number: '988', color: 'bg-blue-600 hover:bg-blue-700' }
  ]

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
            <h1 className="text-lg font-semibold text-gray-900">Emergency</h1>
            <div className="w-8" />
          </div>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  Emergency Assistance
                </h1>
                <p className="text-gray-600">
                  Quick access to emergency services and your medical information
                </p>
              </div>

              {/* Emergency Alert Banner */}
              <Card className="mb-8 border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                    <h2 className="text-lg font-semibold text-red-900">
                      In Case of Life-Threatening Emergency
                    </h2>
                  </div>
                  <p className="text-red-700 mb-4">
                    If you are experiencing a medical emergency, call emergency services immediately.
                  </p>
                  <Button 
                    onClick={callEmergencyServices}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold text-lg px-8 py-3"
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Call 911
                  </Button>
                </CardContent>
              </Card>

              {/* Emergency Numbers */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Emergency Hotlines</CardTitle>
                  <CardDescription>Quick dial emergency and crisis support numbers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {emergencyNumbers.map((service) => (
                      <Button
                        key={service.number}
                        className={`${service.color} text-white p-6 h-auto flex-col gap-2`}
                        onClick={() => {
                          toast.success(`Calling ${service.name}`)
                          // window.location.href = `tel:${service.number}`
                        }}
                      >
                        <Phone className="h-6 w-6" />
                        <span className="font-semibold">{service.name}</span>
                        <span className="text-sm opacity-90">{service.number}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Location Sharing */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Location Sharing</CardTitle>
                  <CardDescription>Share your current location for emergency response</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Current Location</p>
                      <p className="text-sm text-gray-600">
                        {currentLocation || 'Getting location...'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={shareLocation}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!currentLocation}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Share Location
                  </Button>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Emergency Contacts */}
                <Card>
                  <CardHeader>
                    <CardTitle>Emergency Contacts</CardTitle>
                    <CardDescription>People to contact in case of emergency</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-16 bg-gray-200 rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {emergencyContacts.map((contact) => (
                          <div key={contact.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <User className="h-5 w-5 text-gray-600" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-gray-900">{contact.name}</h3>
                                  {contact.isPrimary && (
                                    <Badge className="bg-blue-100 text-blue-800 text-xs">Primary</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{contact.relationship}</p>
                                <p className="text-sm text-gray-500">{contact.phone}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => callEmergencyContact(contact.phone, contact.name)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Medical Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Medical Information</CardTitle>
                    <CardDescription>Critical medical details for emergency responders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Blood Type */}
                      <div className="flex items-center gap-3">
                        <Heart className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="font-medium text-gray-900">Blood Type</p>
                          <p className="text-sm text-gray-600">{medicalInfo.bloodType}</p>
                        </div>
                      </div>

                      {/* Allergies */}
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          <p className="font-medium text-gray-900">Allergies</p>
                        </div>
                        <div className="flex flex-wrap gap-2 ml-8">
                          {medicalInfo.allergies.map((allergy, index) => (
                            <Badge key={index} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                              {allergy}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Current Medications */}
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Shield className="h-5 w-5 text-green-500" />
                          <p className="font-medium text-gray-900">Current Medications</p>
                        </div>
                        <div className="ml-8 space-y-1">
                          {medicalInfo.medications.map((medication, index) => (
                            <p key={index} className="text-sm text-gray-600">• {medication}</p>
                          ))}
                        </div>
                      </div>

                      {/* Medical Conditions */}
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Clock className="h-5 w-5 text-blue-500" />
                          <p className="font-medium text-gray-900">Medical Conditions</p>
                        </div>
                        <div className="flex flex-wrap gap-2 ml-8">
                          {medicalInfo.medicalConditions.map((condition, index) => (
                            <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {condition}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Emergency Notes */}
                      {medicalInfo.emergencyNotes && (
                        <div>
                          <p className="font-medium text-gray-900 mb-2">Emergency Notes</p>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {medicalInfo.emergencyNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Important Notice */}
              <Card className="mt-8 bg-yellow-50 border-yellow-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-yellow-900 mb-2">Important Notice</h3>
                      <p className="text-yellow-800 text-sm">
                        Keep your emergency contacts and medical information up to date. 
                        In case of emergency, first responders will have access to this critical information 
                        to provide you with the best possible care.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}