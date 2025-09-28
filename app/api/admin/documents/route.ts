import { NextRequest, NextResponse } from 'next/server';
import { collection, query, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// GET - Fetch all submissions for admin review
export async function GET(req: NextRequest) {
  try {
    console.log('📊 Admin API: Fetching all submissions for admin review...');
    
    // Fetch all submissions
    const submissionsQuery = query(
      collection(db, 'submissions'),
      orderBy('submittedAt', 'desc')
    );

    const submissionsSnapshot = await getDocs(submissionsQuery);
    console.log(`📊 Found ${submissionsSnapshot.size} submissions in database`);
    
    const submissions = [];

    for (const submissionDoc of submissionsSnapshot.docs) {
      const submissionData = submissionDoc.data();
      console.log(`📄 Processing submission: ${submissionData.id || submissionDoc.id}`);
      
      // Handle both old format (separate documents collection) and new format (embedded files)
      let documents = [];
      
      if (submissionData.files && Array.isArray(submissionData.files)) {
        // New format: files embedded in submission
        console.log(`📁 New format submission with ${submissionData.files.length} embedded files`);
        documents = submissionData.files.map((file: any, index: number) => ({
          id: file.id || `${submissionData.id}_file_${index}`,
          fileName: file.originalName || file.fileName,
          documentType: file.description || 'Document',
          fileUrl: `data:${file.fileType};base64,${file.fileData || ''}`, // Placeholder for now
          status: file.status || 'pending',
          statusMessage: file.reviewNote || '',
          uploadedAt: file.uploadedAt?.toDate?.() || new Date(file.uploadedAt) || new Date(),
          reviewedBy: file.reviewedBy || '',
          reviewedAt: file.reviewedAt ? (file.reviewedAt.toDate?.() || new Date(file.reviewedAt)) : null,
        }));
      } else {
        // Old format: separate documents collection
        console.log(`📁 Old format submission, fetching documents from separate collection`);
        const documentsQuery = query(
          collection(db, 'documents')
        );

        const documentsSnapshot = await getDocs(documentsQuery);
        const allDocuments = documentsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            uploadedAt: data.uploadedAt?.toDate?.() || new Date(data.uploadedAt),
          };
        });

        // Filter documents for this submission
        documents = allDocuments.filter((d: any) => d.submissionId === submissionData.id);
      }

      console.log(`📄 Submission ${submissionData.id} has ${documents.length} documents`);

      // Calculate status counts
      const approvedCount = documents.filter((d: any) => d.status === 'approved').length;
      const rejectedCount = documents.filter((d: any) => d.status === 'rejected').length;
      const pendingCount = documents.filter((d: any) => d.status === 'pending').length;

      console.log(`📊 Status counts - Approved: ${approvedCount}, Rejected: ${rejectedCount}, Pending: ${pendingCount}`);

      // Determine overall submission status
      let overallStatus = 'pending';
      if (approvedCount === documents.length && documents.length > 0) {
        overallStatus = 'approved';
      } else if (rejectedCount === documents.length && documents.length > 0) {
        overallStatus = 'rejected';
      } else if (approvedCount > 0) {
        overallStatus = 'partial_approved';
      }

      submissions.push({
        id: submissionData.id || submissionDoc.id,
        userId: submissionData.userId,
        userName: submissionData.userDisplayName || submissionData.userName || 'Unknown User',
        userEmail: submissionData.userEmail || 'unknown@email.com',
        totalFiles: submissionData.totalFiles || documents.length,
        submittedAt: submissionData.submittedAt?.toDate?.() || new Date(submissionData.submittedAt) || new Date(),
        status: overallStatus,
        approvedFiles: approvedCount,
        rejectedFiles: rejectedCount,
        pendingFiles: pendingCount,
        files: documents,
      });
    }

    console.log(`✅ Admin API: Returning ${submissions.length} submissions for admin review`);

    return NextResponse.json({
      success: true,
      submissions,
    });

  } catch (error: any) {
    console.error('❌ Error fetching admin submissions:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      success: false 
    }, { status: 500 });
  }
}

// POST - Update document status
export async function POST(req: NextRequest) {
  try {
    console.log('📝 Admin API: Updating document status...');
    
    const body = await req.json();
    const { documentId, status, statusMessage } = body;
    console.log(`📝 Updating document ${documentId} to status: ${status}`);

    if (!documentId || !status || !['approved', 'rejected', 'pending'].includes(status)) {
      console.log('❌ Invalid request data:', { documentId, status });
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // First, try to find and update document in the old format (separate documents collection)
    try {
      const docRef = doc(db, 'documents', documentId);
      await updateDoc(docRef, {
        status,
        statusMessage: statusMessage || '',
        reviewedBy: 'admin-demo',
        reviewedByEmail: 'admin@demo.com',
        reviewedByName: 'Demo Admin',
        reviewedAt: new Date(),
      });
      
      console.log('✅ Updated document in old format (documents collection)');
      return NextResponse.json({
        success: true,
        message: `Document ${status} successfully`,
      });
    } catch (oldFormatError) {
      console.log('🔄 Document not found in old format, trying new format...');
    }

    // If old format fails, try new format (embedded in submissions)
    // Find which submission contains this document
    const submissionsQuery = query(collection(db, 'submissions'));
    const submissionsSnapshot = await getDocs(submissionsQuery);
    
    let documentUpdated = false;
    
    for (const submissionDoc of submissionsSnapshot.docs) {
      const submissionData = submissionDoc.data();
      
      if (submissionData.files && Array.isArray(submissionData.files)) {
        const fileIndex = submissionData.files.findIndex((file: any) => 
          file.id === documentId || `${submissionData.id}_file_${submissionData.files.indexOf(file)}` === documentId
        );
        
        if (fileIndex !== -1) {
          console.log(`📁 Found document in submission ${submissionData.id} at index ${fileIndex}`);
          
          // Update the specific file in the submission
          const updatedFiles = [...submissionData.files];
          updatedFiles[fileIndex] = {
            ...updatedFiles[fileIndex],
            status,
            reviewNote: statusMessage || '',
            reviewedBy: 'admin-demo',
            reviewedAt: new Date(),
          };
          
          // Update the submission document
          const submissionRef = doc(db, 'submissions', submissionDoc.id);
          await updateDoc(submissionRef, {
            files: updatedFiles,
            metadata: {
              ...submissionData.metadata,
              updatedAt: new Date(),
              version: (submissionData.metadata?.version || 0) + 1,
            }
          });
          
          console.log('✅ Updated document in new format (embedded in submission)');
          documentUpdated = true;
          break;
        }
      }
    }
    
    if (!documentUpdated) {
      console.log('❌ Document not found in any format');
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Document ${status} successfully`,
    });

  } catch (error: any) {
    console.error('❌ Error updating document status:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      success: false 
    }, { status: 500 });
  }
}