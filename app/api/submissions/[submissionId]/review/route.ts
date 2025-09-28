import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import admin from 'firebase-admin';
import { sendStatusUpdateEmail } from '@/lib/email-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;

    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const userRecord = await admin.auth().getUser(decodedToken.uid);
    const customClaims = userRecord.customClaims;
    const isAdmin = customClaims?.admin;

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { submissionId } = resolvedParams;
    const body = await req.json();
    const { action, status, statusMessage } = body;

    // Validate action and status
    if (!['approve_all', 'reject_all', 'review_individual'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (['approve_all', 'reject_all'].includes(action) && !status) {
      return NextResponse.json({ error: 'Status is required for approval/rejection' }, { status: 400 });
    }

    // Get all documents in this submission
    const documentsQuery = query(
      collection(db, 'documents'),
      where('submissionId', '==', submissionId)
    );

    const querySnapshot = await getDocs(documentsQuery);
    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const documents = querySnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    let updatedCount = 0;
    const batch = writeBatch(db);
    const emailPromises = [];

    if (action === 'approve_all' || action === 'reject_all') {
      // Update all documents in the submission to the same status
      for (const document of documents) {
        const docRef = doc(db, 'documents', document.id);
        batch.update(docRef, {
          status,
          statusMessage: statusMessage || '',
          reviewedBy: decodedToken.uid,
          reviewedAt: new Date(),
          reviewerEmail: decodedToken.email,
          lastUpdated: new Date()
        });
        updatedCount++;

        // Prepare email notification (only send one per submission)
        if (updatedCount === 1 && document.userEmail) {
          emailPromises.push(
            sendStatusUpdateEmail({
              recipientEmail: document.userEmail,
              recipientName: document.userName || document.userEmail.split('@')[0],
              documentName: `${document.submissionTitle} (${documents.length} documents)`,
              status: status as 'pending' | 'approved' | 'rejected',
              adminMessage: statusMessage,
              reviewerName: decodedToken.email,
              reviewDate: new Date().toLocaleDateString('en-IN')
            })
          );
        }
      }

      await batch.commit();

      // Send email notification (don't wait for completion)
      Promise.allSettled(emailPromises).then(emailResults => {
        const failedEmails = emailResults.filter(result => result.status === 'rejected');
        if (failedEmails.length > 0) {
          console.warn(`Email notification failed for submission ${submissionId}`);
        }
      });

      return NextResponse.json({
        success: true,
        message: `All documents in submission ${action === 'approve_all' ? 'approved' : 'rejected'} successfully`,
        submissionId,
        updatedDocuments: updatedCount,
        action,
        status
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Individual document review not implemented in this endpoint',
      submissionId
    });

  } catch (error) {
    console.error('Submission review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}