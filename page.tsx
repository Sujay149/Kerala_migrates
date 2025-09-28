'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Heart, 
  MessageSquare,
  Activity,
  Phone,
  MapPin,
  AlertCircle,
  Shield,
  Calendar,
  Loader2,
  CheckCircle,
  FileText,
  Pill,
  Stethoscope,
  Clock,
  Star,
  ExternalLink,
  Briefcase
} from 'lucide-react';

// Interface for the API response structure
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

export default function QRScanPage({ params }: { params: { token: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<QRScanResult | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/qr/access/${encodeURIComponent(params.token)}`, {
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

    if (params.token) {
      fetchUserData();
    }
  }, [params.token]);

  // Helper functions
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
        {/* Header */}
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

        {/* User Information */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">User Information</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Basic Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-600">Name: </span>
                    <span className="font-medium">{userData.userDisplayName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email: </span>
                    <span className="font-medium">{userData.userEmail}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">User ID: </span>
                    <span className="font-mono text-sm text-gray-500">{userData.userId}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Data Summary</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-600">Total Collections: </span>
                    <span className="font-medium">{stats.totalCollections}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Entries: </span>
                    <span className="font-medium">{stats.totalEntries}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Collections */}
        <div className="grid gap-4 mb-6">
          {/* Chat Sessions */}
          {userData.chatSessions.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold">Chat Sessions ({userData.chatSessions.length})</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {userData.chatSessions.slice(0, 5).map((session: any, index: number) => (
                    <div key={session.id || index} className="p-2 bg-gray-50 rounded">
                      <p className="text-sm font-medium">
                        {session.title || `Chat Session #${index + 1}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(session.createdAt)}
                      </p>
                    </div>
                  ))}
                  {userData.chatSessions.length > 5 && (
                    <p className="text-sm text-gray-500">
                      ...and {userData.chatSessions.length - 5} more
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Medications */}
          {userData.medications.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Pill className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold">Medications ({userData.medications.length})</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {userData.medications.slice(0, 5).map((medication: any, index: number) => (
                    <div key={medication.id || index} className="p-2 bg-gray-50 rounded">
                      <p className="text-sm font-medium">
                        {medication.name || medication.medication || `Medication #${index + 1}`}
                      </p>
                      {medication.dosage && (
                        <p className="text-xs text-gray-600">Dosage: {medication.dosage}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {formatDate(medication.createdAt)}
                      </p>
                    </div>
                  ))}
                  {userData.medications.length > 5 && (
                    <p className="text-sm text-gray-500">
                      ...and {userData.medications.length - 5} more
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Health Records */}
          {userData.healthRecords.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Stethoscope className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold">Health Records ({userData.healthRecords.length})</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {userData.healthRecords.slice(0, 5).map((record: any, index: number) => (
                    <div key={record.id || index} className="p-2 bg-gray-50 rounded">
                      <p className="text-sm font-medium">
                        {record.title || record.type || `Health Record #${index + 1}`}
                      </p>
                      {record.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">{record.description}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {formatDate(record.createdAt)}
                      </p>
                    </div>
                  ))}
                  {userData.healthRecords.length > 5 && (
                    <p className="text-sm text-gray-500">
                      ...and {userData.healthRecords.length - 5} more
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submissions */}
          {userData.submissions.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold">User Submissions ({userData.submissions.length})</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {userData.submissions.slice(0, 5).map((submission: any, index: number) => (
                    <div key={submission.id || index} className="p-2 bg-gray-50 rounded">
                      <p className="text-sm font-medium">
                        {submission.title || submission.fileName || `Submission #${index + 1}`}
                      </p>
                      {submission.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">{submission.description}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Submitted: {formatDate(submission.submittedAt)}
                      </p>
                    </div>
                  ))}
                  {userData.submissions.length > 5 && (
                    <p className="text-sm text-gray-500">
                      ...and {userData.submissions.length - 5} more
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appointments */}
          {userData.appointments.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold">Appointments ({userData.appointments.length})</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {userData.appointments.slice(0, 5).map((appointment: any, index: number) => (
                    <div key={appointment.id || index} className="p-2 bg-gray-50 rounded">
                      <p className="text-sm font-medium">
                        {appointment.title || appointment.type || `Appointment #${index + 1}`}
                      </p>
                      <p className="text-xs text-gray-600">
                        Date: {formatDate(appointment.appointmentDate)}
                      </p>
                      {appointment.doctor && (
                        <p className="text-xs text-gray-600">Doctor: {appointment.doctor}</p>
                      )}
                    </div>
                  ))}
                  {userData.appointments.length > 5 && (
                    <p className="text-sm text-gray-500">
                      ...and {userData.appointments.length - 5} more
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feedback */}
          {userData.feedback.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold">Feedback ({userData.feedback.length})</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {userData.feedback.slice(0, 5).map((feedback: any, index: number) => (
                    <div key={feedback.id || index} className="p-2 bg-gray-50 rounded">
                      <p className="text-sm font-medium">
                        {feedback.title || `Feedback #${index + 1}`}
                      </p>
                      {feedback.rating && (
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${i < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                          <span className="text-xs text-gray-600 ml-1">({feedback.rating}/5)</span>
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        {formatDate(feedback.createdAt)}
                      </p>
                    </div>
                  ))}
                  {userData.feedback.length > 5 && (
                    <p className="text-sm text-gray-500">
                      ...and {userData.feedback.length - 5} more
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Access Information */}
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

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pb-8">
          <p>This health profile is protected by privacy regulations. Access is logged and monitored.</p>
          <p>For emergency situations only. Unauthorized access is prohibited.</p>
        </div>
      </div>
    </div>
  );
}
