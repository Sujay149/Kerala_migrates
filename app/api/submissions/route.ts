import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import admin from 'firebase-admin';

export async function GET(req: NextRequest) {
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
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all documents
    const documentsQuery = query(
      collection(db, 'documents'),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(documentsQuery);
    const documents = querySnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
    }));

    // Group documents by submissionId
    const submissions = new Map();
    const individualDocuments: any[] = [];

    documents.forEach((doc: any) => {
      if (doc.isGroupSubmission && doc.submissionId) {
        if (!submissions.has(doc.submissionId)) {
          submissions.set(doc.submissionId, {
            id: doc.submissionId,
            submissionTitle: doc.submissionTitle,
            userId: doc.userId,
            userEmail: doc.userEmail,
            userName: doc.userName,
            totalDocuments: doc.totalDocuments,
            documents: [],
            status: 'pending', // Will be calculated based on individual document statuses
            timestamp: doc.timestamp,
            consent: doc.consent
          });
        }
        submissions.get(doc.submissionId).documents.push(doc);
      } else {
        individualDocuments.push(doc);
      }
    });

    // Calculate submission statuses
    const submissionArray = Array.from(submissions.values()).map(submission => {
      const statuses = submission.documents.map((d: any) => d.status);
      const allApproved = statuses.every((s: string) => s === 'approved');
      const anyRejected = statuses.some((s: string) => s === 'rejected');
      const allPending = statuses.every((s: string) => s === 'pending');
      
      let overallStatus;
      if (allApproved) {
        overallStatus = 'approved';
      } else if (anyRejected) {
        overallStatus = 'rejected';
      } else if (allPending) {
        overallStatus = 'pending';
      } else {
        overallStatus = 'partial'; // Some approved, some pending/rejected
      }

      return {
        ...submission,
        status: overallStatus,
        approvedCount: statuses.filter((s: string) => s === 'approved').length,
        rejectedCount: statuses.filter((s: string) => s === 'rejected').length,
        pendingCount: statuses.filter((s: string) => s === 'pending').length
      };
    });

    return NextResponse.json({
      success: true,
      submissions: submissionArray,
      individualDocuments,
      totalSubmissions: submissionArray.length,
      totalIndividualDocuments: individualDocuments.length
    });

  } catch (error) {
    console.error('Get submissions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}