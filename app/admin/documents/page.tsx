'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Sidebar } from '@/components/sidebar';
import { 
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  User,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  Menu,
  Search
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Document {
  id: string;
  fileName: string;
  documentType: string;
  fileUrl: string; // Now contains data URL (data:type;base64,...)
  fileData?: string; // Base64 encoded file data
  status: 'pending' | 'approved' | 'rejected';
  statusMessage?: string;
  uploadedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
}

interface Submission {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  totalFiles: number;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'partial_approved';
  approvedFiles: number;
  rejectedFiles: number;
  pendingFiles: number;
  files: Document[];
}

export default function AdminDocumentsPage() {
  const { user, loading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [expandedSubmissions, setExpandedSubmissions] = useState<string[]>([]);
  const [reviewingDocument, setReviewingDocument] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!loading && user) {
      loadSubmissions();
    }
  }, [user, loading]);

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

  const loadSubmissions = async () => {
    try {
      setLoadingSubmissions(true);
      const token = await user?.getIdToken();
      const response = await fetch('/api/admin/documents', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      } else if (response.status === 403) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast({
        title: "Error",
        description: "Failed to load submissions",
        variant: "destructive",
      });
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const updateDocumentStatus = async (documentId: string, status: 'approved' | 'rejected', statusMessage: string = '') => {
    try {
      setReviewingDocument(documentId);
      const token = await user?.getIdToken();
      
      const response = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          status,
          statusMessage,
        }),
      });

      if (response.ok) {
        toast({
          title: "Status Updated",
          description: `Document ${status} successfully`,
        });
        
        // Reload submissions to get updated data
        await loadSubmissions();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update status');
      }
    } catch (error: any) {
      console.error('Error updating document status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update document status",
        variant: "destructive",
      });
    } finally {
      setReviewingDocument(null);
    }
  };

  const toggleSubmissionExpansion = (submissionId: string) => {
    setExpandedSubmissions(prev =>
      prev.includes(submissionId)
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    );
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'partial_approved':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  // Filter submissions based on search term
  const filteredSubmissions = submissions.filter(submission => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      submission.userName.toLowerCase().includes(searchLower) ||
      submission.userEmail.toLowerCase().includes(searchLower) ||
      submission.id.toLowerCase().includes(searchLower) ||
      submission.files.some(file => 
        file.fileName.toLowerCase().includes(searchLower) ||
        file.documentType.toLowerCase().includes(searchLower)
      )
    );
  });

  if (loading || loadingSubmissions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Please Sign In</h2>
            <p className="text-gray-600 mb-4">Admin access required.</p>
            <Button onClick={() => window.location.href = '/auth/signin'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-[250px] min-h-screen">
        <div className="max-w-7xl mx-auto p-4 pt-16 lg:pt-6 space-y-6">
          {/* Header */}
          <div className="text-center py-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Review Dashboard</h1>
            <p className="text-gray-600">Review and approve medical documents from migrant workers</p>
          </div>

          {/* Search Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name, email, document ID, file name, or document type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchTerm && (
                <div className="mt-2 text-sm text-gray-600">
                  Found {filteredSubmissions.length} of {submissions.length} submissions
                </div>
              )}
            </CardContent>
          </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredSubmissions.length}</div>
              <div className="text-sm text-gray-600">
                {searchTerm ? 'Filtered' : 'Total'} Submissions
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredSubmissions.filter(s => s.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">Pending Review</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredSubmissions.filter(s => s.status === 'approved').length}
              </div>
              <div className="text-sm text-gray-600">Approved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {filteredSubmissions.filter(s => s.status === 'rejected').length}
              </div>
              <div className="text-sm text-gray-600">Rejected</div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions List */}
        <div className="space-y-4">
          {filteredSubmissions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No Matching Submissions' : 'No Submissions'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? 'No submissions match your search criteria. Try adjusting your search term.'
                    : 'No document submissions to review yet.'
                  }
                </p>
                {searchTerm && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchTerm('')}
                    className="mt-4"
                  >
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredSubmissions.map((submission) => (
              <Card key={submission.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{submission.userName}</h3>
                        <p className="text-sm text-gray-600">{submission.userEmail}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(submission.status)}>
                        {submission.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSubmissionExpansion(submission.id)}
                      >
                        {expandedSubmissions.includes(submission.id) ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                        }
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {submission.submittedAt instanceof Date 
                        ? submission.submittedAt.toLocaleDateString()
                        : new Date(submission.submittedAt).toLocaleDateString()
                      }
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {submission.totalFiles} files
                    </div>
                    <div className="flex gap-4">
                      <span className="text-green-600">✓ {submission.approvedFiles} approved</span>
                      <span className="text-red-600">✗ {submission.rejectedFiles} rejected</span>
                      <span className="text-yellow-600">⧖ {submission.pendingFiles} pending</span>
                    </div>
                  </div>
                </CardHeader>

                {expandedSubmissions.includes(submission.id) && (
                  <CardContent>
                    <div className="space-y-4">
                      {submission.files.map((document) => (
                        <div key={document.id} className="border rounded-lg p-4 bg-white">
                          <div className="flex flex-col gap-4">
                            {/* Document Info and Actions Row */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div className="flex items-center gap-3">
                                {getStatusIcon(document.status)}
                                <div>
                                  <h4 className="font-medium text-gray-900">{document.fileName}</h4>
                                  <p className="text-sm text-gray-600">{document.documentType}</p>
                                  <p className="text-xs text-gray-500">
                                    Uploaded: {document.uploadedAt instanceof Date 
                                      ? document.uploadedAt.toLocaleDateString()
                                      : new Date(document.uploadedAt).toLocaleDateString()
                                    }
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(document.fileUrl, '_blank')}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                                
                                {document.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => updateDocumentStatus(document.id, 'approved')}
                                      disabled={reviewingDocument === document.id}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Approve
                                    </Button>
                                    
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        const reason = prompt('Rejection reason (optional):');
                                        if (reason !== null) {
                                          updateDocumentStatus(document.id, 'rejected', reason);
                                        }
                                      }}
                                      disabled={reviewingDocument === document.id}
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Image Preview */}
                            {document.fileUrl && document.fileUrl.startsWith('data:image') && (
                              <div className="mt-4">
                                <img 
                                  src={document.fileUrl} 
                                  alt={document.fileName}
                                  className="max-w-full max-h-48 object-contain rounded-lg border border-gray-200"
                                  loading="lazy"
                                />
                              </div>
                            )}

                            {/* PDF Preview */}
                            {document.fileUrl && document.fileUrl.startsWith('data:application/pdf') && (
                              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <FileText className="w-5 h-5" />
                                  <span className="text-sm">PDF Document - Click "View" to open</span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {document.statusMessage && (
                            <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                              <strong>Review Note:</strong> {document.statusMessage}
                            </div>
                          )}
                          
                          {document.reviewedBy && document.reviewedAt && (
                            <div className="mt-2 text-xs text-gray-500">
                              Reviewed by admin on {new Date(document.reviewedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
        </div>
      </div>
    </div>
  );
}