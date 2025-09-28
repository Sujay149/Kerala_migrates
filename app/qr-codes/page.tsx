"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Menu, QrCode, Download, Plus, Loader2, FileText, User, Pill, Stethoscope } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

interface QRData {
  qrCodeDataUrl: string;
  encryptedToken: string;
  expiresAt: string;
}

export default function QRCodesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [userData, setUserData] = useState<any>(null);
  const [loadingUserData, setLoadingUserData] = useState(false);
  const { user } = useAuth()

  const generateQR = async () => {
    if (!user) {
      toast.error("Please login to generate QR code")
      return
    }

    try {
      setGenerating(true)
      const token = await user.getIdToken()
      const response = await fetch("/api/qr/generate", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setQrData(data.qrData)
        toast.success("QR code generated successfully!")
      } else {
        throw new Error("Failed to generate QR code")
      }
    } catch (error) {
      toast.error("Failed to generate QR code")
    } finally {
      setGenerating(false)
    }
  }

  const downloadQR = () => {
    if (!qrData) return
    const link = document.createElement("a")
    link.href = qrData.qrCodeDataUrl
    link.download = `SafeEntry-QR-${Date.now()}.png`
    link.click()
    toast.success("QR code downloaded!")
  }

  // Fetch user data after QR is generated
  useEffect(() => {
    const fetchUserData = async () => {
      if (!qrData?.encryptedToken) return;
      setLoadingUserData(true);
      try {
        const response = await fetch("/api/qr/access/" + encodeURIComponent(qrData.encryptedToken), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scannerInfo: { userAgent: navigator.userAgent, timestamp: new Date().toISOString(), scannerRole: "self" } })
        });
        const result = await response.json();
        console.log("User data response:", result);
        if (result.success && result.userData) {
          setUserData(result.userData);
          console.log("User data set:", result.userData);
        } else {
          console.error("Failed to fetch user data:", result);
          toast.error("Failed to fetch your data. Please try again.");
        }
      } catch (e) {
        console.error("Error fetching user data:", e);
        toast.error("An error occurred while fetching your data.");
      }
      setLoadingUserData(false);
    };
    fetchUserData();
  }, [qrData]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-0 md:ml-64' : 'ml-0'}`}>
          <div className="p-4 md:p-8">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="md:hidden"
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My QR Code</h1>
                  <p className="text-sm md:text-base text-gray-600">Generate your comprehensive health profile QR code</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              <Card className="p-4 md:p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-6 w-6 text-blue-600" />
                    Your QR Code
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="px-0">
                  {qrData ? (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
                          <img
                            src={qrData.qrCodeDataUrl}
                            alt="QR Code"
                            className="w-48 h-48 md:w-64 md:h-64 mx-auto"
                          />
                        </div>
                      </div>
                      
                      <Button onClick={downloadQR} className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Download QR Code
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 md:py-12 space-y-4">
                      <QrCode className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mx-auto" />
                      <p className="text-gray-600">No QR code generated yet</p>
                      <Button onClick={generateQR} disabled={generating} className="w-full md:w-auto">
                        {generating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Generate QR Code
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="p-4 md:p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>What is Included</CardTitle>
                </CardHeader>
                
                <CardContent className="px-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <p className="text-sm">All chat conversations</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <p className="text-sm">Medication records</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <p className="text-sm">Health documents</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <p className="text-sm">Appointment history</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <p className="text-sm">Feedback data</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <p className="text-sm">Health records</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <p className="text-sm">User submissions</p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-6">
                    <p className="text-sm font-medium text-blue-900">Secure & Encrypted</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Your data is encrypted and only accessible through this unique QR code.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* --- Display comprehensive user data after QR is generated --- */}
            {qrData && (
              <div className="mt-10 space-y-10">
                <Card className="border-blue-200">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      <h2 className="text-xl font-bold">Your Profile Data</h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingUserData ? (
                      <div className="text-blue-600 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading your profile...
                      </div>
                    ) : userData ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div>
                            <span className="text-gray-600">Name: </span>
                            <span className="font-medium">{userData.userDisplayName || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Email: </span>
                            <span className="font-medium">{userData.userEmail || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">User ID: </span>
                            <span className="font-mono text-sm text-gray-500">{userData.userId || 'N/A'}</span>
                          </div>
                        </div>
                        {userData.profile && (
                          <div className="space-y-2">
                            {userData.profile.phoneNumber && (
                              <div>
                                <span className="text-gray-600">Phone: </span>
                                <span className="font-medium">{userData.profile.phoneNumber}</span>
                              </div>
                            )}
                            {userData.profile.address && (
                              <div>
                                <span className="text-gray-600">Address: </span>
                                <span className="font-medium">{userData.profile.address}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500">Profile information not available.</div>
                    )}
                  </CardContent>
                </Card>
                
                {/* User Submissions with Files/Images */}
                <div>
                  <h2 className="text-xl font-bold mb-4">Your Uploaded Documents</h2>
                  {loadingUserData && <div className="text-blue-600 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading your documents...
                  </div>}
                  {!loadingUserData && userData && Array.isArray(userData.submissions) && userData.submissions.length > 0 ? (
                    <div className="space-y-6">
                      {userData.submissions.map((submission: any, idx: number) => (
                        <Card key={submission.id || idx} className="border-blue-200">
                          <CardHeader>
                            <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Submission: {submission.id}
                            </h4>
                            <div className="text-xs text-gray-500">Submitted: {submission.submittedAt?.toLocaleString?.() || 
                              (submission.submittedAt && typeof submission.submittedAt === 'string' ? new Date(submission.submittedAt).toLocaleString() : 'N/A')}</div>
                            <div className="text-xs text-gray-500">Status: {submission.status || 'N/A'}</div>
                          </CardHeader>
                          <CardContent>
                            {submission.files && submission.files.length > 0 ? (
                              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Attached Documents ({submission.files.length})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {submission.files.map((file: any, fidx: number) => (
                                    <div key={fidx} className="bg-white p-3 rounded border flex items-center gap-2">
                                      {file.fileType?.startsWith('image/') ? (
                                        <>
                                          <img
                                            src={`data:${file.fileType};base64,${file.fileData}`}
                                            alt={file.fileName}
                                            className="w-12 h-12 object-contain rounded border mr-2"
                                          />
                                        </>
                                      ) : (
                                        <FileText className="h-5 w-5 text-gray-500" />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                          {file.fileName || file.description || `Document ${fidx + 1}`}
                                        </p>
                                        {file.fileSize && (
                                          <p className="text-xs text-gray-500">
                                            {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                                          </p>
                                        )}
                                        <p className="text-xs text-gray-500">Type: {file.fileType}</p>
                                      </div>
                                      <div className="flex gap-1">
                                        {file.fileData && file.fileType && (
                                          <>
                                            {/* View button for images and files */}
                                            <Button size="sm" variant="ghost" onClick={() => {
                                              const url = `data:${file.fileType};base64,${file.fileData}`;
                                              window.open(url, '_blank');
                                            }}>
                                              View
                                            </Button>
                                            {/* Download button */}
                                            <Button size="sm" variant="ghost" onClick={() => {
                                              const url = `data:${file.fileType};base64,${file.fileData}`;
                                              const link = document.createElement('a');
                                              link.href = url;
                                              link.download = file.fileName || `document-${fidx + 1}`;
                                              link.click();
                                            }}>
                                              Download
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500">No files in this submission.</div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    !loadingUserData && (
                      <div className="text-gray-500 py-6 text-center border rounded-lg bg-gray-50">
                        <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No submissions found for your account.</p>
                        <p className="text-sm mt-1">If you believe this is an error, try regenerating the QR code.</p>
                      </div>
                    )
                  )}
                </div>

                {/* Health Records */}
                {userData?.healthRecords?.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Your Health Records</h2>
                    <div className="space-y-4">
                      {userData.healthRecords.map((record: any, idx: number) => (
                        <Card key={record.id || idx} className="border-green-200">
                          <CardHeader>
                            <h4 className="font-semibold text-green-900 flex items-center gap-2">
                              <Stethoscope className="w-4 h-4" />
                              {record.title || `Health Record #${idx+1}`}
                            </h4>
                            <div className="flex gap-2">
                              {record.type && (
                                <Badge variant="outline" className="bg-green-50">{record.type}</Badge>
                              )}
                              {record.date && (
                                <div className="text-xs text-gray-500">
                                  Date: {new Date(record.date).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            {record.summary && (
                              <p className="text-sm text-gray-700 mb-3">{record.summary}</p>
                            )}
                            {record.files && record.files.length > 0 && (
                              <div className="text-xs text-blue-600">
                                {record.files.length} attached file(s)
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Medications */}
                {userData?.medications?.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Your Medications</h2>
                    <div className="space-y-4">
                      {userData.medications.map((med: any, idx: number) => (
                        <Card key={med.id || idx} className="border-red-200">
                          <CardHeader>
                            <h4 className="font-semibold text-red-900 flex items-center gap-2">
                              <Pill className="w-4 h-4" />
                              {med.name || `Medication #${idx+1}`}
                            </h4>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              {med.dosage && (
                                <div><span className="text-gray-600">Dosage:</span> {med.dosage}</div>
                              )}
                              {med.frequency && (
                                <div><span className="text-gray-600">Frequency:</span> {med.frequency}</div>
                              )}
                              {med.startDate && (
                                <div><span className="text-gray-600">Started:</span> {new Date(med.startDate).toLocaleDateString()}</div>
                              )}
                              {med.isActive !== undefined && (
                                <Badge 
                                  variant={med.isActive ? "default" : "outline"} 
                                  className={med.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                                >
                                  {med.isActive ? "Active" : "Inactive"}
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
