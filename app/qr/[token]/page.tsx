'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  MessageSquare,
  AlertCircle,
  Shield,
  Calendar,
  Loader2,
  CheckCircle,
  FileText,
  Pill,
  Stethoscope,
  Star
} from 'lucide-react';

interface QRScanResult {
  success: boolean;
  userData: {
    userId: string;
    userEmail: string;
    userDisplayName: string;
    profile: any;
    chatSessions: any[];
    medications: any[];
    healthRecords: any[];
    submissions: any[];
    feedback: any[];
    appointments: any[];
    summaryRequests: any[];
  };
  stats: {
    totalCollections: number;
    totalEntries: number;
    dataBreakdown: Record<string, number>;
  };
  accessInfo: {
    accessedAt: string;
    accessType: string;
    tokenInfo: {
      generatedAt: string;
      expiresAt: string;
      type: string;
      version: string;
    };
  };
  message: string;
}

export default function QRScanPage({ params }: { params: Promise<{ token: string }> }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<QRScanResult | null>(null);
  const [token, setToken] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('documents');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const resolvedParams = await params;
        if (!resolvedParams.token) return;
        
        setToken(resolvedParams.token);
        setLoading(true);
        
        const response = await fetch(`/api/qr/access/${encodeURIComponent(resolvedParams.token)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessType: 'qr_scan',
            timestamp: new Date().toISOString()
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to access QR data: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to retrieve user data');
        }

        setScanResult(data);
      } catch (error: any) {
        console.error('Error fetching QR data:', error);
        setError(error.message || 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [params]);

  const formatDate = (dateString: string | Date): string => {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString.toString();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold mb-2">Loading User Data</h2>
          <p className="text-gray-600">Accessing comprehensive health information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-semibold text-red-600">Access Error</h2>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="w-full"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!scanResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  const { userData, stats, accessInfo } = scanResult;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <h1 className="text-2xl font-bold text-green-800">QR Scan Successful</h1>
                  <p className="text-green-600">
                    Accessed: {formatDate(accessInfo.accessedAt)}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                {accessInfo.accessType.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
        </Card>
        
  {/* Debug info - only visible during development */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 p-4 border rounded bg-gray-50 text-xs">
            <summary className="font-mono text-gray-700 cursor-pointer">Debug Info</summary>
            <pre className="mt-2 overflow-auto p-2 bg-gray-100 rounded max-h-40">
              {JSON.stringify({
                userId: userData.userId,
                email: userData.userEmail,
                name: userData.userDisplayName,
                profile: userData.profile ? 'exists' : 'missing',
                submissions: userData.submissions?.length || 0,
                healthRecords: userData.healthRecords?.length || 0,
                medications: userData.medications?.length || 0
              }, null, 2)}
            </pre>
            </details>
          )}
          {/* Tabs - show profile sections */}
        <Card className="mb-6">
          <div className="px-4 py-3">
            <div className="flex space-x-2 overflow-x-auto">
              {[
                { id: 'skills', label: 'Skills Details' },
                { id: 'contact', label: 'Contact Details' },
                { id: 'family', label: 'Family Details' },
                { id: 'documents', label: 'Documents & Records' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm ${
                    activeTab === t.id ? 'bg-cyan-500 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <CardContent>
            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Primary Skill</h3>
                <div className="mb-4">
                  <div className="text-sm text-gray-800">{userData.profile?.primarySkill || 'N/A'}</div>
                  {Array.isArray(userData.profile?.secondarySkills) && userData.profile.secondarySkills.length > 0 && (
                    <div className="text-sm text-gray-600 mt-2">Secondary: {userData.profile.secondarySkills.join(', ')}</div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-700 mb-2">Experience & Certifications</h3>
                <div className="text-sm text-gray-800">
                  <div>Experience: {userData.profile?.experience || 'N/A'}</div>
                  {Array.isArray(userData.profile?.certifications) && userData.profile.certifications.length > 0 && (
                    <div className="mt-2">Certifications: {userData.profile.certifications.join(', ')}</div>
                  )}
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-3 text-sm text-gray-800">
                <div><span className="font-semibold">Mobile:</span> {userData.userEmail ? userData.userEmail : 'N/A'}</div>
                <div><span className="font-semibold">Current Address:</span> {userData.profile?.currentAddress || 'N/A'}</div>
                <div><span className="font-semibold">Native Address:</span> {userData.profile?.nativeAddress || 'N/A'}</div>
                <div><span className="font-semibold">Emergency Contact:</span> {userData.profile?.emergencyName || 'N/A'} — {userData.profile?.emergencyContact || 'N/A'}</div>
              </div>
            )}

            {/* Family Tab */}
            {activeTab === 'family' && (
              <div className="space-y-4">
                {Array.isArray(userData.profile?.familyMembers) && userData.profile.familyMembers.length > 0 ? (
                  userData.profile.familyMembers.map((m: any, i: number) => (
                    <div key={i} className="p-3 bg-white rounded border">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-800">{m.name || 'Member'}</div>
                          <div className="text-xs text-gray-500">Relation: {m.relation || 'N/A'}</div>
                        </div>
                        <div className="text-sm text-gray-600">Age: {m.age || 'N/A'}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No family details available.</div>
                )}
              </div>
            )}

            {/* Documents & Records Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                {/* Submissions with images/media */}
                {userData.submissions.length > 0 ? (
                  <div className="space-y-6">
                    {userData.submissions.map((submission: any, idx: number) => (
                      <Card key={submission.id || idx} className="border-blue-200">
                        <CardHeader>
                          <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Submission: {submission.id}
                          </h4>
                          <div className="text-xs text-gray-500">Submitted: {formatDate(submission.submittedAt)}</div>
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
                                      <img
                                        src={`data:${file.fileType};base64,${file.fileData}`}
                                        alt={file.fileName}
                                        className="w-12 h-12 object-contain rounded border mr-2"
                                      />
                                    ) : (
                                      <FileText className="h-5 w-5 text-gray-500" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {file.fileName || file.description || `Document ${fidx + 1}`}
                                      </p>
                                      {file.fileSize && (
                                        <p className="text-xs text-gray-500">{(file.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                                      )}
                                      <p className="text-xs text-gray-500">Type: {file.fileType}</p>
                                    </div>
                                    <div className="flex gap-1">
                                      {file.fileData && file.fileType && (
                                        <>
                                          <Button size="sm" variant="ghost" onClick={() => {
                                            const url = `data:${file.fileType};base64,${file.fileData}`;
                                            window.open(url, '_blank');
                                          }}>
                                            View
                                          </Button>
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
                  <div className="text-xs text-gray-500">No submissions available.</div>
                )}

                {/* Health Records */}
                {userData.healthRecords.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        <Stethoscope className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold">Health Records ({userData.healthRecords.length})</h3>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {userData.healthRecords.map((record: any, idx: number) => (
                          <Card key={record.id || idx} className="border-green-200">
                            <CardHeader className="py-3 px-4">
                              <h4 className="font-semibold text-green-900 flex items-center gap-2">
                                <Stethoscope className="w-4 h-4" />
                                {record.title || `Health Record #${idx+1}`}
                              </h4>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {record.type && (
                                  <Badge variant="outline" className="bg-green-50">{record.type}</Badge>
                                )}
                                {record.date && (
                                  <div className="text-xs text-gray-500">Date: {formatDate(record.date)}</div>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="py-3 px-4">
                              {record.summary && (<p className="text-sm text-gray-700 mb-3">{record.summary}</p>)}
                              {record.files && record.files.length > 0 && (
                                <div className="mb-4 p-4 bg-green-50 rounded-lg">
                                  <h4 className="font-medium text-gray-900 mb-3">Attached Files ({record.files.length})</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {record.files.map((file: any, fidx: number) => (
                                      <div key={fidx} className="flex items-center gap-2 bg-white p-2 rounded border">
                                        <FileText className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm truncate flex-1">{file.name || `File ${fidx + 1}`}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Medications */}
                {userData.medications.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        <Pill className="w-5 h-5 text-red-600" />
                        <h3 className="font-semibold">Medications ({userData.medications.length})</h3>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {userData.medications.map((med: any, idx: number) => (
                          <Card key={med.id || idx} className="border-red-100">
                            <CardHeader className="py-3 px-4">
                              <h4 className="font-semibold text-red-900 flex items-center gap-2">
                                <Pill className="w-4 h-4" />
                                {med.name || `Medication #${idx+1}`}
                              </h4>
                              {med.isActive !== undefined && (
                                <Badge 
                                  variant={med.isActive ? "default" : "outline"} 
                                  className={med.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                                >
                                  {med.isActive ? "Active" : "Inactive"}
                                </Badge>
                              )}
                            </CardHeader>
                            <CardContent className="py-3 px-4">
                              <div className="space-y-2 text-sm">
                                {med.dosage && (<div><span className="text-gray-600">Dosage:</span> {med.dosage}</div>)}
                                {med.frequency && (<div><span className="text-gray-600">Frequency:</span> {med.frequency}</div>)}
                                {med.startDate && (<div><span className="text-gray-600">Started:</span> {formatDate(med.startDate)}</div>)}
                                {med.endDate && (<div><span className="text-gray-600">Ends:</span> {formatDate(med.endDate)}</div>)}
                                {med.notes && (<div className="mt-2 p-2 bg-red-50 rounded text-xs">{med.notes}</div>)}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Access Information</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Token Generated: {formatDate(accessInfo.tokenInfo.generatedAt)}</p>
                <p className="text-gray-600">Token Expires: {formatDate(accessInfo.tokenInfo.expiresAt)}</p>
              </div>
              <div>
                <p className="text-gray-600">Access Type: {accessInfo.accessType}</p>
                <p className="text-gray-600">Token Version: {accessInfo.tokenInfo.version}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-500 pb-8">
          <p>This health profile is protected by privacy regulations. Access is logged and monitored.</p>
          <p>For emergency situations only. Unauthorized access is prohibited.</p>
        </div>
      </div>
    </div>
  );
}