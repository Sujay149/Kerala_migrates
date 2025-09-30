'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/sidebar';
import { 
  Upload, 
  X, 
  FileText, 
  Image as ImageIcon, 
  File, 
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Trash2,
  Download,
  Menu,
  Phone,
  User,
  Users
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'pdf' | 'document';
  description: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  error?: string;
  timestamp: Date;
}

interface Submission {
  id: string;
  files: any[]; // API returns documents with various fields
  status: 'draft' | 'uploading' | 'submitted' | 'partial_approved' | 'approved' | 'rejected' | 'pending';
  submittedAt?: Date;
  totalFiles: number;
  approvedFiles: number;
  rejectedFiles: number;
  pendingFiles: number;
}

export default function DocumentUploadPage() {
  const { user, loading } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentTypes = [
    'Medical Certificate',
    'Blood Test Report',
    'X-Ray Report', 
    'Prescription',
    'Lab Results',
    'Vaccination Certificate',
    'Health Insurance Card',
    'ID Proof',
    'Work Permit',
    'Symptom Notes',
    'Other Medical Document'
  ];

  useEffect(() => {
    console.log('Documents page useEffect triggered, user:', user);
    if (user) {
      console.log('User authenticated, loading submissions...');
      loadUserSubmissions();
    } else {
      console.log('No user authenticated yet');
    }
  }, [user]);

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

  const loadUserSubmissions = async () => {
    console.log('loadUserSubmissions called');
    try {
      console.log('Getting user token...');
      const token = await user?.getIdToken();
      console.log('Token received:', token ? 'Yes' : 'No');
      
      console.log('Making API request to /api/documents/submissions');
      const response = await fetch('/api/documents/submissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API response data:', data);
        setSubmissions(data.submissions || []);
        console.log('Submissions set:', data.submissions?.length || 0, 'items');
      } else {
        console.error('API response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileInput called', e.target.files);
    if (e.target.files && e.target.files.length > 0) {
      console.log('Files selected:', e.target.files.length);
      handleFiles(e.target.files);
      // Reset the input value to allow selecting the same files again
      e.target.value = '';
    } else {
      console.log('No files selected or files array is empty');
    }
  };

  const handleFiles = (fileList: FileList) => {
    console.log('handleFiles called with', fileList.length, 'files');
    const newFiles: UploadedFile[] = [];

    Array.from(fileList).forEach((file, index) => {
      console.log(`Processing file ${index + 1}:`, file.name, file.type, file.size);
      
      // Validate file size for free Firestore storage (max 1MB)
      if (file.size > 1 * 1024 * 1024) {
        console.log('File too large:', file.name);
        toast({
          title: "File too large",
          description: `${file.name} is larger than 1MB (Firestore limit)`,
          variant: "destructive",
        });
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf'];
      console.log('File type check:', file.type, 'Allowed:', allowedTypes.includes(file.type));
      if (!allowedTypes.includes(file.type)) {
        console.log('Invalid file type:', file.type, 'Expected one of:', allowedTypes);
        toast({
          title: "Invalid file type",
          description: `${file.name} type "${file.type}" is not supported. Please use JPG, PNG, GIF, WEBP, or PDF files.`,
          variant: "destructive",
        });
        return;
      }

      console.log('File passed validation:', file.name);
      const fileType = file.type.startsWith('image/') ? 'image' : 
                      file.type === 'application/pdf' ? 'pdf' : 'document';

      const newFile: UploadedFile = {
        id: `file_${Date.now()}_${Math.random()}`,
        file,
        type: fileType,
        description: '',
        status: 'pending',
        timestamp: new Date()
      };

      // Create preview for images
      if (fileType === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFiles(prev => prev.map(f => 
            f.id === newFile.id 
              ? { ...f, preview: e.target?.result as string }
              : f
          ));
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(newFile);
    });

    console.log('Adding', newFiles.length, 'new files to state');
    setFiles(prev => {
      console.log('Previous files:', prev.length);
      const updated = [...prev, ...newFiles];
      console.log('Updated files:', updated.length);
      return updated;
    });
  };

  const updateFileDescription = (fileId: string, description: string) => {
    setFiles(prev => prev.map(file =>
      file.id === fileId ? { ...file, description } : file
    ));
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const getFileIcon = (file: UploadedFile) => {
    switch (file.type) {
      case 'image':
        return <ImageIcon className="w-6 h-6 text-blue-500" />;
      case 'pdf':
        return <FileText className="w-6 h-6 text-red-500" />;
      default:
        return <File className="w-6 h-6 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'uploading':
        return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const toggleSubmissionDetails = (submissionId: string) => {
    setExpandedSubmissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
  };

  const handleSubmitAll = async () => {
    if (files.length === 0) {
      toast({
        title: "No files to submit",
        description: "Please upload at least one file",
        variant: "destructive",
      });
      return;
    }

    const incompleteFiles = files.filter(f => !f.description.trim());
    if (incompleteFiles.length > 0) {
      toast({
        title: "Missing descriptions",
        description: "Please add descriptions for all files",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const token = await user?.getIdToken();

      // Update files status to uploading
      setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' as const })));

      // Convert files to base64 for storage
      const filesWithData = await Promise.all(files.map(async (fileObj) => {
        return new Promise<any>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1]; // Remove data:type;base64, prefix
            
            resolve({
              originalName: fileObj.file.name,
              fileName: `${Date.now()}_${fileObj.file.name}`,
              fileType: fileObj.file.type,
              fileSize: fileObj.file.size,
              description: fileObj.description,
              fileData: base64Data // Include base64 encoded file data for admin viewing
            });
          };
          reader.readAsDataURL(fileObj.file);
        });
      }));

      // Create document submission with QR code
      const submissionData = {
        userInfo: {
          uid: user?.uid,
          email: user?.email,
          displayName: user?.displayName || user?.email?.split('@')[0] || 'User'
        },
        files: filesWithData
      };

      const response = await fetch('/api/document-submission', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        const result = await response.json();
        const submissionInfo = result.submission;
        
        // Update files to uploaded status
        setFiles(prev => prev.map(f => ({ ...f, status: 'uploaded' as const })));
        
        // Create new submission record
        const newSubmission: Submission = {
          id: submissionInfo.id,
          files: files.map(f => ({ ...f, status: 'uploaded' as const })),
          status: 'submitted',
          submittedAt: new Date(submissionInfo.submittedAt),
          totalFiles: files.length,
          approvedFiles: 0,
          rejectedFiles: 0,
          pendingFiles: files.length
        };

        setSubmissions(prev => [newSubmission, ...prev]);
        
        // Show success with QR info
        toast({
          title: "Submission Created Successfully! 🎉",
          description: (
            <div>
              <p className="mb-2">{files.length} files submitted successfully</p>
              <p className="text-sm text-green-700 font-medium">
                Submission ID: {submissionInfo.submissionId}
              </p>
              <p className="text-xs text-green-600 mt-1">
                QR code generated for admin access
              </p>
            </div>
          ),
        });

        // Clear the form
        setFiles([]);
        
        // Show QR code info
        if (submissionInfo.qrInfo?.qrCodeDataUrl) {
          console.log('QR Code generated:', submissionInfo.qrInfo.adminAccessUrl);
          
          // Optional: Auto-download QR code (disabled for better UX)
          // const link = document.createElement('a');
          // link.href = submissionInfo.qrInfo.qrCodeDataUrl;
          // link.download = `submission-qr-${submissionInfo.submissionId}.png`;
          // document.body.appendChild(link);
          // link.click();
          // document.body.removeChild(link);
        }

        // Reload submissions
        await loadUserSubmissions();

      } else {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Error during submission:', error);
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit documents. Please try again.",
        variant: "destructive",
      });
      
      // Reset file status
      setFiles(prev => prev.map(f => ({ ...f, status: 'error' as const, error: error.message })));
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
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
            <p className="text-gray-600 mb-4">You need to be signed in to upload documents.</p>
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
        <div className="max-w-6xl mx-auto p-4 pt-16 lg:pt-6 space-y-6">
          {/* Header */}
          <div className="text-center py-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Medical Document Upload</h1>
            <p className="text-gray-600">Upload your medical documents for Kerala migrant worker services</p>
            {user && (
              <div className="mt-3 text-sm text-gray-500">
                Logged in as: <span className="font-medium text-gray-700">{user.email}</span>
              </div>
            )}
          </div>

        {/* Upload Area */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Upload New Documents</h2>
            <p className="text-sm text-gray-600">
              Follow these steps: <span className="font-medium">1) Choose files</span> → <span className="font-medium">2) Add descriptions</span> → <span className="font-medium">3) Submit all</span>
            </p>
            {/* Debug info - remove in production */}
            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
              Debug: Files in state: {files.length} | User: {user?.email || 'Not authenticated'}
            </div>
            {/* Progress indicator */}
            <div className="flex items-center gap-2 mt-2 text-xs">
              <div className={`px-2 py-1 rounded ${files.length === 0 ? 'bg-blue-100 text-blue-800 font-medium' : 'bg-gray-100 text-gray-600'}`}>
                Step 1: Choose Files {files.length > 0 && '✓'} ({files.length})
              </div>
              <div className={`px-2 py-1 rounded ${files.length > 0 && files.some(f => !f.description) ? 'bg-blue-100 text-blue-800 font-medium' : 'bg-gray-100 text-gray-600'}`}>
                Step 2: Add Descriptions {files.length > 0 && files.every(f => f.description) && '✓'}
              </div>
              <div className={`px-2 py-1 rounded ${files.length > 0 && files.every(f => f.description) ? 'bg-green-100 text-green-800 font-medium' : 'bg-gray-100 text-gray-600'}`}>
                Step 3: Submit All {files.length > 0 && files.every(f => f.description) && '→ Ready!'}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Drag and Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileInput}
                className="hidden"
              />
              
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Drop files here or click to browse
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Support: JPG, PNG, PDF (Max 1MB each)
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  variant="outline"
                  onClick={() => {
                    console.log('Choose Files button clicked');
                    console.log('File input ref:', fileInputRef.current);
                    fileInputRef.current?.click();
                  }}
                  disabled={isUploading}
                  size="lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Choose Files to Upload
                </Button>
                
                {/* Test button to verify state management - remove in production */}
                <Button 
                  variant="secondary"
                  onClick={() => {
                    console.log('Test button clicked - adding dummy file');
                    const dummyFile = {
                      id: `test_${Date.now()}`,
                      file: {} as File, // Mock file for testing
                      type: 'document' as const,
                      description: 'Test file',
                      status: 'pending' as const,
                      timestamp: new Date()
                    };
                    setFiles(prev => {
                      console.log('Adding test file, previous count:', prev.length);
                      return [...prev, dummyFile];
                    });
                  }}
                  size="sm"
                >
                  Test Add File
                </Button>
                
                {files.length === 0 && (
                  <Button 
                    variant="default"
                    disabled={true}
                    size="lg"
                    className="opacity-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Documents (Select files first)
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Helpful message when no files are uploaded */}
        {files.length === 0 && submissions.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Ready to upload more documents?
                  </p>
                  <p className="text-sm text-blue-700">
                    Use the upload area above to add new medical documents. After uploading, don't forget to add descriptions and click "Submit All Files".
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* File Preview Gallery */}
        {files.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-xl font-semibold">Selected Files ({files.length})</h2>
              <Button
                onClick={handleSubmitAll}
                disabled={isUploading || files.some(f => !f.description.trim())}
                className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold"
                size="lg"
              >
                {isUploading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit All Files
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <div key={file.id} className="bg-white border rounded-lg p-4 shadow-sm">
                    {/* File Preview */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-shrink-0">
                        {file.preview ? (
                          <img 
                            src={file.preview} 
                            alt={file.file.name}
                            className="w-12 h-12 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                            {getFileIcon(file)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.file.size)}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {getStatusIcon(file.status)}
                          <span className="text-xs capitalize text-gray-600">
                            {file.status}
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        disabled={isUploading}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Description Input */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Document Type *
                      </label>
                      <select
                        value={file.description}
                        onChange={(e) => updateFileDescription(file.id, e.target.value)}
                        disabled={isUploading}
                        className="w-full text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select type...</option>
                        {documentTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    
                    {file.error && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                        {file.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Previous Submissions */}
        {submissions.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Previous Submissions</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div key={submission.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            ID: {submission.id}
                          </Badge>
                          <Badge variant={
                            submission.status === 'approved' ? 'default' :
                            submission.status === 'rejected' ? 'destructive' :
                            submission.status === 'partial_approved' ? 'secondary' :
                            'outline'
                          }>
                            {submission.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">{submission.totalFiles}</span> files submitted
                          {submission.submittedAt && (
                            <span className="ml-2">
                              on {new Date(submission.submittedAt).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                        
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span className="text-green-600">✓ {submission.approvedFiles} approved</span>
                          <span className="text-red-600">✗ {submission.rejectedFiles} rejected</span>
                          <span className="text-yellow-600">⧖ {submission.pendingFiles} pending</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleSubmissionDetails(submission.id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {expandedSubmissions.has(submission.id) ? 'Hide Details' : 'View Details'}
                        </Button>
                        {submission.status === 'approved' && (
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedSubmissions.has(submission.id) && (
                      <div className="mt-4 border-t pt-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3">Document Details</h4>
                        <div className="space-y-3">
                          {submission.files?.map((document: any, idx: number) => (
                            <div key={document.id || idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                              {/* Document Icon/Preview */}
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                                  <FileText className="w-6 h-6 text-gray-400" />
                                </div>
                              </div>

                              {/* Document Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h5 className="text-sm font-medium text-gray-800 truncate">
                                    {document.description || document.fileName || `Document ${idx + 1}`}
                                  </h5>
                                  <div className="flex items-center gap-2">
                                    <Badge 
                                      variant={
                                        document.status === 'approved' ? 'default' : 
                                        document.status === 'rejected' ? 'destructive' : 'secondary'
                                      }
                                      className="text-xs"
                                    >
                                      {(document.status || 'pending').toUpperCase()}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <p className="text-xs text-gray-500 mb-1">
                                  Status: {document.status || 'pending'}
                                </p>

                                {/* Status Messages */}
                                {document.status === 'rejected' && document.rejectionReason && (
                                  <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                                    <p className="text-xs text-red-700">
                                      <strong>Reason:</strong> {document.rejectionReason}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )) || <p className="text-sm text-gray-500">No documents found</p>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notification Placeholder */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Status Updates</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              You will be notified here when administrators review your documents
            </p>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}