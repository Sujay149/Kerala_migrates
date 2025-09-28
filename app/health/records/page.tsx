"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Menu, FileText, Search, Calendar, Loader2, User, Phone, Mail, MapPin, Eye, Download, CheckCircle, Clock, XCircle, Image as ImageIcon } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

interface HealthRecord {
  id: string
  title: string
  type: string
  date: Date
  provider: string
  summary: string
  attachments?: number
  tags: string[]
  status?: string
  files?: any[]
  originalSubmission?: {
    patientName?: string
    contactNumber?: string
    email?: string
    age?: string
    gender?: string
    address?: string
    symptoms?: string
    medicalHistory?: string
    medications?: string
    allergies?: string
    emergencyContact?: string
    preferredLanguage?: string
    approved?: boolean
    approvedBy?: string
    approvedAt?: string
    rejectionReason?: string
  }
}

export default function HealthRecordsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchRecords = async () => {
      if (!user?.uid) return
      setLoading(true)
      try {
        const response = await fetch(`/api/health/records?userId=${user.uid}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            const recordsWithDates = data.records.map((record: any) => ({
              ...record,
              date: new Date(record.date)
            }))
            setRecords(recordsWithDates)
          }
        }
      } catch (error) {
        console.error('Error fetching records:', error)
        toast.error('Failed to load health records')
      } finally {
        setLoading(false)
      }
    }
    fetchRecords()
  }, [user?.uid])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 lg:ml-64">
          <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Health Records</h1>
            <div></div>
          </div>
          <main className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Records</h1>
                <p className="text-gray-600">Your uploaded health documents</p>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <p className="ml-4 text-gray-600">Loading records...</p>
                </div>
              ) : records.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Records Found</h3>
                  <p className="text-gray-600">Upload your first document to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {records.map((record) => (
                    <Card key={record.id} className="hover:shadow-md">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg text-gray-900">{record.title}</h3>
                              {record.type && (
                                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                  {record.type}
                                </Badge>
                              )}
                              {/* Status Badge */}
                              {record.originalSubmission?.approved !== undefined && (
                                <Badge 
                                  variant={record.originalSubmission.approved ? "default" : "destructive"}
                                  className={record.originalSubmission.approved ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                                >
                                  {record.originalSubmission.approved ? (
                                    <><CheckCircle className="h-3 w-3 mr-1" />Approved</>
                                  ) : (
                                    <><XCircle className="h-3 w-3 mr-1" />Rejected</>
                                  )}
                                </Badge>
                              )}
                              {record.status && record.status !== 'completed' && (
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                  <Clock className="h-3 w-3 mr-1" />{record.status}
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-gray-600 mb-3">{record.summary}</p>
                            
                            {/* Patient Info */}
                            {record.originalSubmission && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-900 col-span-full mb-2">Patient Information</h4>
                                
                                {record.originalSubmission.patientName && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4 text-gray-500" />
                                    <span className="text-gray-600">Name:</span>
                                    <span className="font-medium">{record.originalSubmission.patientName}</span>
                                  </div>
                                )}
                                
                                {record.originalSubmission.contactNumber && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-gray-500" />
                                    <span className="text-gray-600">Phone:</span>
                                    <span className="font-medium">{record.originalSubmission.contactNumber}</span>
                                  </div>
                                )}
                                
                                {record.originalSubmission.email && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-gray-500" />
                                    <span className="text-gray-600">Email:</span>
                                    <span className="font-medium">{record.originalSubmission.email}</span>
                                  </div>
                                )}
                                
                                {record.originalSubmission.age && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-600">Age:</span>
                                    <span className="font-medium">{record.originalSubmission.age}</span>
                                  </div>
                                )}
                                
                                {record.originalSubmission.gender && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-600">Gender:</span>
                                    <span className="font-medium">{record.originalSubmission.gender}</span>
                                  </div>
                                )}
                                
                                {record.originalSubmission.address && (
                                  <div className="flex items-start gap-2 text-sm col-span-full">
                                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                                    <div>
                                      <span className="text-gray-600">Address:</span>
                                      <p className="font-medium">{record.originalSubmission.address}</p>
                                    </div>
                                  </div>
                                )}
                                
                                {record.originalSubmission.symptoms && (
                                  <div className="col-span-full">
                                    <span className="text-gray-600 block mb-1">Symptoms:</span>
                                    <p className="font-medium text-sm bg-white p-2 rounded border">{record.originalSubmission.symptoms}</p>
                                  </div>
                                )}
                                
                                {record.originalSubmission.medicalHistory && (
                                  <div className="col-span-full">
                                    <span className="text-gray-600 block mb-1">Medical History:</span>
                                    <p className="font-medium text-sm bg-white p-2 rounded border">{record.originalSubmission.medicalHistory}</p>
                                  </div>
                                )}
                                
                                {record.originalSubmission.medications && (
                                  <div className="col-span-full">
                                    <span className="text-gray-600 block mb-1">Current Medications:</span>
                                    <p className="font-medium text-sm bg-white p-2 rounded border">{record.originalSubmission.medications}</p>
                                  </div>
                                )}
                                
                                {record.originalSubmission.allergies && (
                                  <div className="col-span-full">
                                    <span className="text-gray-600 block mb-1">Allergies:</span>
                                    <p className="font-medium text-sm bg-white p-2 rounded border text-red-700">{record.originalSubmission.allergies}</p>
                                  </div>
                                )}
                                
                                {/* Approval Information */}
                                {record.originalSubmission.approved !== undefined && (
                                  <div className="col-span-full border-t pt-3 mt-3">
                                    <h5 className="font-medium text-gray-900 mb-2">Approval Status</h5>
                                    {record.originalSubmission.approved ? (
                                      <div className="text-sm text-green-700">
                                        <p><strong>Status:</strong> Approved</p>
                                        {record.originalSubmission.approvedBy && (
                                          <p><strong>Approved by:</strong> {record.originalSubmission.approvedBy}</p>
                                        )}
                                        {record.originalSubmission.approvedAt && (
                                          <p><strong>Approved on:</strong> {new Date(record.originalSubmission.approvedAt).toLocaleDateString()}</p>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-sm text-red-700">
                                        <p><strong>Status:</strong> Rejected</p>
                                        {record.originalSubmission.rejectionReason && (
                                          <p><strong>Reason:</strong> {record.originalSubmission.rejectionReason}</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* File Attachments */}
                            {record.files && record.files.length > 0 && (
                              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Attached Documents ({record.files.length})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {record.files.map((file, index) => (
                                    <div key={index} className="bg-white p-3 rounded border flex items-center gap-2">
                                      {file.type?.startsWith('image/') ? (
                                        <ImageIcon className="h-5 w-5 text-blue-500" />
                                      ) : (
                                        <FileText className="h-5 w-5 text-gray-500" />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                          {file.name || `Document ${index + 1}`}
                                        </p>
                                        {file.size && (
                                          <p className="text-xs text-gray-500">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex gap-1">
                                        {file.url && (
                                          <>
                                            <Button size="sm" variant="ghost" onClick={() => window.open(file.url, '_blank')}>
                                              <Eye className="h-3 w-3" />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => {
                                              const link = document.createElement('a');
                                              link.href = file.url;
                                              link.download = file.name || `document-${index + 1}`;
                                              link.click();
                                            }}>
                                              <Download className="h-3 w-3" />
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar className="h-4 w-4" />
                                <span>Submitted: {record.date.toLocaleDateString()}</span>
                              </div>
                              
                              {record.attachments && record.attachments > 0 && (
                                <div className="flex items-center gap-2 text-sm text-blue-600">
                                  <FileText className="h-4 w-4" />
                                  <span>{record.attachments} file{record.attachments > 1 ? 's' : ''}</span>
                                </div>
                              )}
                            </div>
                            
                            {record.tags && record.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {record.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
