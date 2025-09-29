import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import CryptoJS from 'crypto-js';

// Document Submission Types
export interface DocumentFile {
  id: string;
  originalName: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  description: string;
  uploadedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
  fileData?: string; // Base64 encoded file data for admin viewing
}

export interface DocumentSubmission {
  id: string;
  submissionId: string; // Human-readable submission ID
  userId: string;
  userEmail: string;
  userDisplayName: string;
  files: DocumentFile[];
  submissionStatus: 'draft' | 'submitted' | 'under_review' | 'partially_approved' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  totalFiles: number;
  approvedFiles: number;
  rejectedFiles: number;
  pendingFiles: number;
  qrInfo: {
    qrToken: string;
    qrCodeDataUrl: string;
    adminAccessUrl: string;
    generatedAt: Date;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: number;
  };
}

export class DocumentSubmissionManager {
  private static readonly ENCRYPTION_KEY = process.env.NEXT_PUBLIC_QR_ENCRYPTION_KEY || 'MigrantBot-default-key-32-characters';
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  /**
   * Generate a human-readable submission ID
   */
  static generateSubmissionId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `SUB-${timestamp}-${random}`;
  }

  /**
   * Create encrypted QR token for submission access
   */
  static createSubmissionQRToken(submissionId: string, userId: string): string {
    const payload = {
      submissionId,
      userId,
      timestamp: new Date().toISOString(),
      type: 'document_submission'
    };
    
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(payload),
      this.ENCRYPTION_KEY
    ).toString();
    
    return encrypted;
  }

  /**
   * Decrypt QR token to get submission info
   */
  static decryptSubmissionQRToken(token: string): { submissionId: string; userId: string; timestamp: string; type: string } | null {
    try {
      const decrypted = CryptoJS.AES.decrypt(token, this.ENCRYPTION_KEY);
      const payload = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
      
      if (payload.type !== 'document_submission') {
        throw new Error('Invalid token type');
      }
      
      return payload;
    } catch (error) {
      console.error('Error decrypting submission QR token:', error);
      return null;
    }
  }

  /**
   * Generate QR code for document submission
   */
  static async generateSubmissionQRCode(submissionId: string, userId: string): Promise<{
    qrToken: string;
    qrCodeDataUrl: string;
    adminAccessUrl: string;
  }> {
    try {
      console.log('🎨 Generating QR code for submission:', submissionId);
      console.log('🔑 Using encryption key length:', this.ENCRYPTION_KEY.length);
      console.log('🌐 Base URL:', this.BASE_URL);
      
      const qrToken = this.createSubmissionQRToken(submissionId, userId);
      console.log('🔐 QR token created, length:', qrToken.length);
      
      const adminAccessUrl = `${this.BASE_URL}/admin/submission/${submissionId}`;
      console.log('🔗 Admin access URL:', adminAccessUrl);
      
      // Generate QR code pointing to admin access URL
      console.log('📱 Generating QR code image...');
      const qrCodeDataUrl = await QRCode.toDataURL(adminAccessUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: 256
      });
      console.log('✅ QR code generated successfully, data URL length:', qrCodeDataUrl.length);

      return {
        qrToken,
        qrCodeDataUrl,
        adminAccessUrl
      };
    } catch (error: any) {
      console.error('❌ Error generating submission QR code:', error);
      console.error('❌ Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      throw new Error(`Failed to generate QR code: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Create a new document submission
   */
  static async createSubmission(
    userId: string, 
    userEmail: string, 
    userDisplayName: string,
    files: DocumentFile[]
  ): Promise<DocumentSubmission> {
    const submissionId = this.generateSubmissionId();
    const qrInfo = await this.generateSubmissionQRCode(submissionId, userId);
    
    const submission: DocumentSubmission = {
      id: uuidv4(),
      submissionId,
      userId,
      userEmail,
      userDisplayName,
      files: files.map(file => ({
        ...file,
        status: 'pending'
      })),
      submissionStatus: 'submitted',
      submittedAt: new Date(),
      totalFiles: files.length,
      approvedFiles: 0,
      rejectedFiles: 0,
      pendingFiles: files.length,
      qrInfo: {
        ...qrInfo,
        generatedAt: new Date()
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      }
    };

    return submission;
  }

  /**
   * Update submission status based on file reviews
   */
  static updateSubmissionStatus(submission: DocumentSubmission): DocumentSubmission {
    const approvedCount = submission.files.filter(f => f.status === 'approved').length;
    const rejectedCount = submission.files.filter(f => f.status === 'rejected').length;
    const pendingCount = submission.files.filter(f => f.status === 'pending').length;

    let newStatus: DocumentSubmission['submissionStatus'] = 'under_review';
    
    if (pendingCount === 0) {
      if (approvedCount === submission.totalFiles) {
        newStatus = 'approved';
      } else if (rejectedCount === submission.totalFiles) {
        newStatus = 'rejected';
      } else {
        newStatus = 'partially_approved';
      }
    }

    return {
      ...submission,
      submissionStatus: newStatus,
      approvedFiles: approvedCount,
      rejectedFiles: rejectedCount,
      pendingFiles: pendingCount,
      reviewedAt: pendingCount === 0 ? new Date() : submission.reviewedAt,
      metadata: {
        ...submission.metadata,
        updatedAt: new Date(),
        version: submission.metadata.version + 1
      }
    };
  }

  /**
   * Format submission for display
   */
  static formatSubmissionForDisplay(submission: DocumentSubmission) {
    return {
      ...submission,
      statusColor: this.getStatusColor(submission.submissionStatus),
      statusText: this.getStatusText(submission.submissionStatus),
      progressPercentage: Math.round((submission.approvedFiles / submission.totalFiles) * 100) || 0
    };
  }

  private static getStatusColor(status: DocumentSubmission['submissionStatus']): string {
    const colors = {
      'draft': 'gray',
      'submitted': 'blue',
      'under_review': 'yellow',
      'partially_approved': 'orange',
      'approved': 'green',
      'rejected': 'red'
    };
    return colors[status] || 'gray';
  }

  private static getStatusText(status: DocumentSubmission['submissionStatus']): string {
    const texts = {
      'draft': 'Draft',
      'submitted': 'Submitted',
      'under_review': 'Under Review',
      'partially_approved': 'Partially Approved',
      'approved': 'Approved',
      'rejected': 'Rejected'
    };
    return texts[status] || 'Unknown';
  }
}

// Firestore collection names
export const COLLECTIONS = {
  DOCUMENT_SUBMISSIONS: 'submissions',
  SUBMISSION_ACCESS_LOGS: 'submissionAccessLogs'
} as const;

// Helper types for API responses
export interface SubmissionAccessLog {
  id: string;
  submissionId: string;
  accessedBy: string;
  accessedAt: Date;
  accessType: 'qr_scan' | 'direct_link' | 'admin_dashboard';
  userAgent: string;
  ipAddress?: string;
}

export interface CreateSubmissionRequest {
  files: {
    originalName: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    description: string;
    fileData?: string; // Base64 encoded file data for admin viewing
  }[];
}

export interface SubmissionAccessResponse {
  submission: DocumentSubmission;
  accessInfo: {
    accessedAt: string;
    accessType: string;
    requiresAuthentication: boolean;
  };
}