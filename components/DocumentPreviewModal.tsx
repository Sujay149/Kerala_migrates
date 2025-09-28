'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Image, FileIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface DocumentPreviewModalProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface DocumentData {
  id: string;
  fileName: string;
  documentType: string;
  description: string;
  fileSize: number;
  mimeType: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  downloadURL?: string;
  userEmail?: string;
  userName?: string;
  statusMessage?: string;
  reviewedAt?: string;
}

export default function DocumentPreviewModal({ documentId, isOpen, onClose }: DocumentPreviewModalProps) {
  const { user } = useAuth();
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    if (isOpen && documentId) {
      fetchDocumentPreview();
    }
  }, [isOpen, documentId]);

  const fetchDocumentPreview = async () => {
    try {
      setLoading(true);
      const token = await user?.getIdToken();
      const response = await fetch(`/api/documents/${documentId}/preview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocument(data.document);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to load document preview",
          variant: "destructive",
        });
        onClose();
      }
    } catch (error) {
      console.error('Error fetching document preview:', error);
      toast({
        title: "Error",
        description: "Failed to load document preview",
        variant: "destructive",
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!document?.downloadURL) return;
    
    setDownloadLoading(true);
    try {
      const response = await fetch(document.downloadURL);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = document.fileName;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Document downloaded successfully",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-16 h-16 text-blue-500" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="w-16 h-16 text-red-500" />;
    }
    return <FileIcon className="w-16 h-16 text-gray-500" />;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default' as const;
      case 'rejected':
        return 'destructive' as const;
      case 'pending':
      default:
        return 'secondary' as const;
    }
  };

  const renderFilePreview = () => {
    if (!document?.downloadURL || !document?.mimeType) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg">
          {getFileIcon(document?.mimeType || '')}
          <p className="text-gray-500 mt-4">Preview not available</p>
        </div>
      );
    }

    if (document.mimeType.startsWith('image/')) {
      return (
        <div className="flex justify-center bg-gray-50 rounded-lg p-4">
          <img 
            src={document.downloadURL} 
            alt={document.fileName}
            className="max-w-full max-h-96 object-contain rounded"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden flex flex-col items-center justify-center h-96">
            <Image className="w-16 h-16 text-gray-400" />
            <p className="text-gray-500 mt-2">Failed to load image</p>
          </div>
        </div>
      );
    } else if (document.mimeType === 'application/pdf') {
      return (
        <div className="bg-gray-50 rounded-lg p-4">
          <iframe
            src={document.downloadURL}
            className="w-full h-96 border-0 rounded"
            title={document.fileName}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg">
        {getFileIcon(document.mimeType)}
        <p className="text-gray-500 mt-4">File preview not supported</p>
        <p className="text-sm text-gray-400">Use download to view the file</p>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Document Preview</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading document...</span>
          </div>
        ) : document ? (
          <div className="p-6">
            {/* Document Info */}
            <Card className="mb-6">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{document.fileName}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{document.documentType}</Badge>
                      <Badge variant={getStatusBadgeVariant(document.status)}>
                        {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={handleDownload}
                    disabled={downloadLoading || !document.downloadURL}
                  >
                    {downloadLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Download
                  </Button>
                </div>

                {document.description && (
                  <p className="text-gray-600 mb-4">{document.description}</p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                  <div>
                    <p className="font-medium">File Size</p>
                    <p>{formatFileSize(document.fileSize)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Upload Date</p>
                    <p>{formatDate(document.timestamp)}</p>
                  </div>
                  {document.userName && (
                    <div>
                      <p className="font-medium">Uploaded By</p>
                      <p>{document.userName}</p>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">File Type</p>
                    <p>{document.mimeType}</p>
                  </div>
                </div>

                {document.statusMessage && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-medium text-blue-900 mb-1">Admin Message</p>
                    <p className="text-blue-800 text-sm">{document.statusMessage}</p>
                    {document.reviewedAt && (
                      <p className="text-blue-600 text-xs mt-1">
                        Reviewed on {formatDate(document.reviewedAt)}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* File Preview */}
            <Card>
              <CardContent className="pt-4">
                <h4 className="text-md font-semibold mb-4">File Preview</h4>
                {renderFilePreview()}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">Failed to load document</p>
          </div>
        )}
      </div>
    </div>
  );
}