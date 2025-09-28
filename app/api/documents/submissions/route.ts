import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(req: NextRequest) {
  try {
    console.log('API: Getting document submissions for authenticated user');
    // Get authorization token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No authentication token provided' }, { status: 401 });
    }

    // Get user info from JWT token
    let userId, userEmail;
    
    try {
      // Parse JWT token to get user information
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.user_id || payload.sub;
      userEmail = payload.email;
      
      console.log('Authenticated user:', { userId, userEmail });
      
      if (!userId || !userEmail) {
        throw new Error('Invalid token: missing user information');
      }
    } catch (error) {
      console.error('Token parsing error:', error);
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }
    
    // Try querying by userId first (without orderBy to avoid composite index requirement)
    let submissionsQuery = query(
      collection(db, 'submissions'),
      where('userId', '==', userId)
    );

    console.log('Querying submissions for userId:', userId);
    console.log('Expected userEmail:', userEmail);

    let submissionsSnapshot = await getDocs(submissionsQuery);
    
    // If no results found with userId, try with userEmail as fallback
    if (submissionsSnapshot.empty) {
      console.log('No submissions found with userId, trying userEmail...');
      submissionsQuery = query(
        collection(db, 'submissions'),
        where('userEmail', '==', userEmail)
      );
      submissionsSnapshot = await getDocs(submissionsQuery);
    }
    const submissions = [];

    console.log(`Found ${submissionsSnapshot.size} submissions for user ${userEmail}`);

    for (const submissionDoc of submissionsSnapshot.docs) {
      const submissionData = submissionDoc.data();
      
      console.log('Processing submission:', {
        id: submissionData.id,
        userId: submissionData.userId,
        userEmail: submissionData.userEmail
      });
      
      // Double check that this submission belongs to the authenticated user
      // Allow match on EITHER userId OR userEmail for flexibility
      const isUserMatch = submissionData.userId === userId;
      const isEmailMatch = submissionData.userEmail === userEmail;
      
      console.log(`Submission ${submissionData.id}: userId match=${isUserMatch}, email match=${isEmailMatch}`);
      
      if (!isUserMatch && !isEmailMatch) {
        console.warn('Skipping submission that does not match authenticated user:', {
          expected: { userId, userEmail },
          found: { userId: submissionData.userId, userEmail: submissionData.userEmail }
        });
        continue;
      }
      
      // Check if submission has embedded files (new format) or needs separate documents query (old format)
      let documents = [];
      
      if (submissionData.files && Array.isArray(submissionData.files)) {
        // New format: files embedded in submission
        console.log(`New format submission with ${submissionData.files.length} embedded files`);
        documents = submissionData.files.map((file: any, index: number) => ({
          id: file.id || `${submissionData.id}_file_${index}`,
          fileName: file.originalName || file.fileName,
          description: file.description,
          status: file.status || 'pending',
          rejectionReason: file.rejectionReason,
          reviewNotes: file.reviewNotes,
          reviewedAt: file.reviewedAt?.toDate?.() || (file.reviewedAt ? new Date(file.reviewedAt) : null),
          uploadedAt: file.uploadedAt?.toDate?.() || new Date(file.uploadedAt),
          fileData: file.fileData,
          contentType: file.fileType,
          fileSize: file.fileSize
        }));
      } else {
        // Old format: separate documents collection
        console.log(`Old format submission, fetching documents from separate collection`);
        const documentsQuery = query(
          collection(db, 'documents'),
          where('submissionId', '==', submissionData.id),
          orderBy('fileIndexInSubmission', 'asc')
        );

        const documentsSnapshot = await getDocs(documentsQuery);
        documents = documentsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            uploadedAt: data.uploadedAt?.toDate?.() || new Date(data.uploadedAt),
          };
        });
      }

      // Calculate status counts
      const approvedCount = documents.filter((d: any) => d.status === 'approved').length;
      const rejectedCount = documents.filter((d: any) => d.status === 'rejected').length;
      const pendingCount = documents.filter((d: any) => d.status === 'pending').length;

      // Determine overall submission status
      let overallStatus = 'pending';
      if (approvedCount === documents.length) {
        overallStatus = 'approved';
      } else if (rejectedCount === documents.length) {
        overallStatus = 'rejected';
      } else if (approvedCount > 0) {
        overallStatus = 'partial_approved';
      }

      submissions.push({
        id: submissionData.id,
        totalFiles: submissionData.totalFiles || documents.length,
        submittedAt: submissionData.submittedAt?.toDate?.() || new Date(submissionData.submittedAt),
        status: overallStatus,
        approvedFiles: approvedCount,
        rejectedFiles: rejectedCount,
        pendingFiles: pendingCount,
        files: documents,
      });
    }

    console.log(`Returning ${submissions.length} submissions for user ${userEmail}`);

    // Sort submissions by submittedAt date in descending order (newest first)
    // We do this client-side to avoid Firestore composite index requirement
    submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    return NextResponse.json({
      success: true,
      submissions,
    });

  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      success: false 
    }, { status: 500 });
  }
}