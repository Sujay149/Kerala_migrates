'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/sidebar';
import { 
  FileText, 
  User, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye,
  MessageSquare,
  Activity,
  AlertCircle,
  Menu,
  Loader2,
  ArrowLeft,
  QrCode,
  Shield
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DocumentSubmission } from '@/lib/document-submission-manager';
import Link from 'next/link';

interface SubmissionAccessData {
  submission: DocumentSubmission & {
    statusColor: string;
    statusText: string;
    progressPercentage: number;
  };
  accessInfo: {
    accessedAt: string;
    accessType: string;
    requiresAuthentication: boolean;
  };
}

export default function AdminSubmissionPage({ 
  params 
}: { 
  params: Promise<{ submissionId: string }> 
}) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submissionData, setSubmissionData] = useState<SubmissionAccessData | null>(null);
  const [submissionId, setSubmissionId] = useState<string>('');

  // Set sidebar open by default on desktop
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const fetchSubmission = async () => {
      const resolvedParams = await params;
      if (resolvedParams.submissionId) {
        setSubmissionId(resolvedParams.submissionId);
        loadSubmission(resolvedParams.submissionId);
      }
    };
    fetchSubmission();
  }, [params]);

  const loadSubmission = async (submissionId: string) => {
    try {
      setLoading(true);
      setError(null);

      const headers: any = {};
      if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/submission-access/${submissionId}`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminAccess: true,
          accessInfo: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissionData(data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load submission');
      }
    } catch (error: any) {
      console.error('Error loading submission:', error);
      setError(error.message || 'Failed to load submission');
    } finally {
      setLoading(false);
    }
  };

  const updateFileStatus = async (fileId: string, status: 'approved' | 'rejected', reviewNote?: string) => {
    if (!submissionData || !user) return;

    try {
      setUpdating(fileId);

      const token = await user.getIdToken();
      const response = await fetch('/api/document-submission', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          submissionId: submissionData.submission.submissionId,
          fileId,
          status,
          reviewNote
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissionData(prev => ({
          ...prev!,
          submission: data.submission
        }));

        toast({
          title: "File Updated",
          description: `File ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update file status');
      }
    } catch (error: any) {
      console.error('Error updating file status:', error);
      toast({
        title: "Update Error",
        description: error.message || "Failed to update file status",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (dateString: string | Date) => {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold mb-2">Loading Submission</h2>
          <p className="text-gray-600">Accessing document submission data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-900 mb-2">Access Error</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="w-full"
              >
                Try Again
              </Button>
              <Link href="/admin/documents">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Admin Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!submissionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Submission Not Found</h2>
            <p className="text-gray-600">The requested submission could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        <Menu className="w-5 h-5" />
      </button>
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-48 min-h-screen">
        <div className="max-w-6xl mx-auto p-4 pt-16 lg:pt-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link href="/admin/documents">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Admin Dashboard
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-blue-600" />
                  <h1 className="text-3xl font-bold text-gray-900">Document Submission</h1>
                </div>
              </div>
              <p className="text-gray-600">Review and approve submitted documents</p>
              <div className="mt-2 text-sm text-gray-500">
                Submission ID: <span className="font-mono font-medium">{submissionData.submission.submissionId}</span>
              </div>
            </div>
            
            {/* QR Access Badge */}
            <div className="text-right">
              <Badge variant="outline" className="flex items-center gap-2 text-blue-700 border-blue-200 bg-blue-50">
                <QrCode className="w-4 h-4" />
                QR Access
              </Badge>
              <div className="text-xs text-gray-500 mt-1">
                Accessed: {formatDate(submissionData.accessInfo.accessedAt)}
              </div>
            </div>
          </div>

          {/* Submission Overview */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <h2 className="text-xl font-semibold text-blue-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                Submission Overview
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-blue-700 uppercase">Submitted By</label>
                  <p className="text-lg font-semibold text-blue-900">{submissionData.submission.userDisplayName}</p>
                  <p className="text-sm text-blue-700">{submissionData.submission.userEmail}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 uppercase">Submission Date</label>
                  <p className="text-lg font-medium text-blue-900 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(submissionData.submission.submittedAt)}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 uppercase">Status</label>
                  <Badge className={`${getStatusColor(submissionData.submission.submissionStatus)} mt-1`}>
                    {getStatusIcon(submissionData.submission.submissionStatus)}
                    <span className="ml-1">{submissionData.submission.statusText}</span>
                  </Badge>
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 uppercase">Progress</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${submissionData.submission.progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-blue-900">
                      {submissionData.submission.progressPercentage}%
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    {submissionData.submission.approvedFiles} of {submissionData.submission.totalFiles} approved
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Files */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Submitted Documents ({submissionData.submission.totalFiles})
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submissionData.submission.files.map((file, index) => (
                  <div key={file.id} className="border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <FileText className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{file.originalName}</h3>
                            <p className="text-sm text-gray-600">
                              {file.fileType} • {Math.round(file.fileSize / 1024)}KB
                            </p>
                          </div>
                        </div>
                        
                        {file.description && (
                          <p className="text-sm text-gray-700 mb-2">{file.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Uploaded: {formatDate(file.uploadedAt)}</span>
                          {file.reviewedAt && (
                            <span>Reviewed: {formatDate(file.reviewedAt)}</span>
                          )}
                          {file.reviewedBy && (
                            <span>By: {file.reviewedBy}</span>
                          )}
                        </div>

                        {file.reviewNote && (
                          <div className="mt-2 p-2 bg-gray-50 rounded border">
                            <p className="text-sm text-gray-700">
                              <strong>Review Note:</strong> {file.reviewNote}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Badge className={getStatusColor(file.status)}>
                          {getStatusIcon(file.status)}
                          <span className="ml-1 capitalize">{file.status}</span>
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    {file.status === 'pending' && user && (
                      <div className="mt-4 flex gap-2 pt-3 border-t">
                        <Button
                          onClick={() => updateFileStatus(file.id, 'approved')}
                          disabled={updating === file.id}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {updating === file.id ? (
                            <Activity className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Approve
                        </Button>
                        <Button
                          onClick={() => updateFileStatus(file.id, 'rejected', 'Document requires revision')}
                          disabled={updating === file.id}
                          size="sm"
                          variant="destructive"
                        >
                          {updating === file.id ? (
                            <Activity className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-2" />
                          )}
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{submissionData.submission.approvedFiles}</div>
                <div className="text-sm text-green-700">Approved Files</div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-yellow-600">{submissionData.submission.pendingFiles}</div>
                <div className="text-sm text-yellow-700">Pending Review</div>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-red-600">{submissionData.submission.rejectedFiles}</div>
                <div className="text-sm text-red-700">Rejected Files</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}