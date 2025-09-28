import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { 
  DocumentSubmissionManager, 
  DocumentSubmission, 
  SubmissionAccessResponse,
  SubmissionAccessLog,
  COLLECTIONS 
} from '@/lib/document-submission-manager';
import { initializeApp, getApps } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: credential.applicationDefault(),
  });
}

const auth = getAuth();
const db = getFirestore();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const resolvedParams = await params;
    const submissionId = resolvedParams.submissionId;
    
    if (!submissionId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Submission ID is required' },
        { status: 400 }
      );
    }

    // Check for authentication (optional for admin access)
    const authHeader = request.headers.get('authorization');
    let isAuthenticated = false;
    let userRole = 'public';

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await auth.verifyIdToken(token);
        isAuthenticated = true;
        userRole = decodedToken.role || 'user';
      } catch (error) {
        console.log('Invalid token provided, proceeding with public access');
      }
    }

    // Get the submission from Firestore
    const submissionSnapshot = await db
      .collection(COLLECTIONS.DOCUMENT_SUBMISSIONS)
      .where('submissionId', '==', submissionId)
      .limit(1)
      .get();

    if (submissionSnapshot.empty) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Submission not found' },
        { status: 404 }
      );
    }

    const submission = submissionSnapshot.docs[0].data() as DocumentSubmission;
    
    // Format submission for display
    const formattedSubmission = DocumentSubmissionManager.formatSubmissionForDisplay(submission);

    // Log the access
    const accessLog: SubmissionAccessLog = {
      id: `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      submissionId: submission.submissionId,
      accessedBy: isAuthenticated ? userRole : 'anonymous',
      accessedAt: new Date(),
      accessType: 'qr_scan',
      userAgent: request.headers.get('user-agent') || 'unknown'
    };

    // Save access log to Firestore (fire and forget)
    db.collection(COLLECTIONS.SUBMISSION_ACCESS_LOGS).add({
      ...accessLog,
      accessedAt: accessLog.accessedAt
    }).catch(error => {
      console.error('Error logging submission access:', error);
    });

    const response: SubmissionAccessResponse = {
      submission: formattedSubmission,
      accessInfo: {
        accessedAt: new Date().toISOString(),
        accessType: 'qr_scan',
        requiresAuthentication: false
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error in GET /api/submission-access:', error);
    
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to access submission' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ submissionId: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const submissionId = resolvedParams.submissionId;
    const body = await request.json();
    
    if (!submissionId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Submission ID is required' },
        { status: 400 }
      );
    }

    // Check for authentication for admin actions
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required for admin actions' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // Verify admin permissions
    if (!decodedToken.role || !['admin', 'healthcare_provider'].includes(decodedToken.role)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Admin permissions required' },
        { status: 403 }
      );
    }

    // Get the submission
    const submissionSnapshot = await db
      .collection(COLLECTIONS.DOCUMENT_SUBMISSIONS)
      .where('submissionId', '==', submissionId)
      .limit(1)
      .get();

    if (submissionSnapshot.empty) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Submission not found' },
        { status: 404 }
      );
    }

    const submission = submissionSnapshot.docs[0].data() as DocumentSubmission;

    // Log the admin access
    const accessLog: SubmissionAccessLog = {
      id: `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      submissionId: submission.submissionId,
      accessedBy: decodedToken.email || decodedToken.uid,
      accessedAt: new Date(),
      accessType: 'admin_dashboard',
      userAgent: request.headers.get('user-agent') || 'unknown'
    };

    // Save access log
    await db.collection(COLLECTIONS.SUBMISSION_ACCESS_LOGS).add({
      ...accessLog,
      accessedAt: accessLog.accessedAt
    });

    const formattedSubmission = DocumentSubmissionManager.formatSubmissionForDisplay(submission);

    const response: SubmissionAccessResponse = {
      submission: formattedSubmission,
      accessInfo: {
        accessedAt: new Date().toISOString(),
        accessType: 'admin_dashboard',
        requiresAuthentication: true
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error in POST /api/submission-access:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'Token Expired', message: 'Authentication token has expired' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to process admin access' },
      { status: 500 }
    );
  }
}