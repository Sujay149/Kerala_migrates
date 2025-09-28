import { NextRequest, NextResponse } from 'next/server';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const submissionId = formData.get('submissionId') as string;
    const totalFiles = parseInt(formData.get('totalFiles') as string);

    if (!submissionId || !totalFiles) {
      return NextResponse.json({ error: 'Missing submission data' }, { status: 400 });
    }

    // Get authorization token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No authentication token provided' }, { status: 401 });
    }

    // Get user info from JWT token
    let userId, userEmail, userName;
    
    try {
      // Parse JWT token to get user information
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.user_id || payload.sub;
      userEmail = payload.email;
      userName = payload.name || payload.display_name || payload.email?.split('@')[0] || 'User';
      
      if (!userId || !userEmail) {
        throw new Error('Invalid token: missing user information');
      }
    } catch (error) {
      console.error('Token parsing error:', error);
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const uploadedFiles = [];
    const errors = [];

    // Process each file
    for (let i = 0; i < totalFiles; i++) {
      try {
        const file = formData.get(`file_${i}`) as File;
        const description = formData.get(`description_${i}`) as string;
        const fileId = formData.get(`fileId_${i}`) as string;

        if (!file || !description || !fileId) {
          errors.push(`Missing data for file ${i}`);
          continue;
        }

        // Validate file size for Firestore (max 1MB per document)
        if (file.size > 1 * 1024 * 1024) {
          errors.push(`${file.name} is too large for free storage (max 1MB)`);
          continue;
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
          errors.push(`${file.name} has invalid file type`);
          continue;
        }

        // Convert file to base64 for Firestore storage
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Data = buffer.toString('base64');
        
        // Create data URL for easy display
        const dataUrl = `data:${file.type};base64,${base64Data}`;

        // Save to Firestore with base64 data
        const documentData = {
          userId,
          userEmail,
          userName,
          submissionId,
          fileId,
          fileName: file.name,
          fileData: base64Data, // Store base64 data directly
          fileUrl: dataUrl, // Data URL for easy display
          fileType: file.type,
          fileSize: file.size,
          documentType: description,
          storagePath: `firestore://${fileId}`, // Indicate it's stored in Firestore
          status: 'pending', // pending, approved, rejected
          statusMessage: '',
          reviewedBy: null,
          reviewedAt: null,
          uploadedAt: serverTimestamp(),
          version: 1, // For versioning same document types
          isLatestVersion: true,
          // Metadata for submission grouping
          groupSubmissionId: submissionId,
          totalFilesInSubmission: totalFiles,
          fileIndexInSubmission: i,
        };

        // Add new document
        const docRef = await addDoc(collection(db, 'documents'), documentData);
        
        uploadedFiles.push({
          id: docRef.id,
          fileId,
          fileName: file.name,
          documentType: description,
          status: 'pending',
          version: 1,
        });

      } catch (error) {
        console.error(`Error processing file ${i}:`, error);
        errors.push(`Failed to process file ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Create submission record
    try {
      const submissionData = {
        id: submissionId,
        userId,
        userEmail,
        userName,
        totalFiles: totalFiles,
        successfulUploads: uploadedFiles.length,
        failedUploads: errors.length,
        status: uploadedFiles.length === totalFiles ? 'submitted' : 'partial',
        submittedAt: serverTimestamp(),
        files: uploadedFiles.map(f => f.id), // Document IDs
      };

      await addDoc(collection(db, 'submissions'), submissionData);
    } catch (error) {
      console.error('Error creating submission record:', error);
      // Continue anyway, files are uploaded
    }

    const response: any = {
      success: true,
      submissionId,
      uploadedFiles: uploadedFiles.length,
      totalFiles,
      files: uploadedFiles,
    };

    if (errors.length > 0) {
      response.errors = errors;
      response.message = `${uploadedFiles.length}/${totalFiles} files uploaded successfully`;
    } else {
      response.message = `All ${totalFiles} files uploaded successfully`;
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      success: false 
    }, { status: 500 });
  }
}