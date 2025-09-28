import { NextRequest, NextResponse } from 'next/server';
import { 
  DocumentSubmissionManager, 
  CreateSubmissionRequest,
  COLLECTIONS,
  DocumentFile 
} from '@/lib/document-submission-manager';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, Firestore } from 'firebase/firestore';

// Initialize Firebase Client SDK
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

let app;
let db: Firestore;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  db = getFirestore(app);
  console.log('✅ Firebase Client SDK initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Client SDK:', error);
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/document-submission - Starting request processing...');
    
    // Get JWT token from Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('🔐 Auth header present:', !!authHeader);
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ No Bearer token found in Authorization header');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No valid authentication token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('🎫 JWT token extracted, length:', token.length);
    
    // Parse request body
    console.log('📄 Parsing request body...');
    const body = await request.json() as CreateSubmissionRequest & { userInfo?: any };
    console.log('📄 Request body parsed, files count:', body.files?.length || 0);

    // Use user info from the request or default values
    const userId = body.userInfo?.uid || `user_${Date.now()}`;
    const userEmail = body.userInfo?.email || 'unknown@example.com';
    const userDisplayName = body.userInfo?.displayName || 'Unknown User';
    
    console.log('👤 User info:', { userId, userEmail, userDisplayName });

    if (!body.files || !Array.isArray(body.files) || body.files.length === 0) {
      console.log('❌ Invalid files data:', { 
        hasFiles: !!body.files, 
        isArray: Array.isArray(body.files), 
        length: body.files?.length 
      });
      return NextResponse.json(
        { error: 'Bad Request', message: 'Files array is required and must not be empty' },
        { status: 400 }
      );
    }

    console.log('🔧 Validating and processing files...');
    // Validate file data
    const validFiles: DocumentFile[] = body.files.map((file, index) => {
      console.log(`📁 Processing file ${index + 1}:`, {
        originalName: file.originalName,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        hasFileData: !!file.fileData
      });
      
      if (!file.originalName || !file.fileName || !file.fileType) {
        console.log('❌ Missing required file information for file', index + 1);
        throw new Error('Missing required file information');
      }

      return {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalName: file.originalName,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize || 0,
        description: file.description || '',
        uploadedAt: new Date(),
        status: 'pending',
        fileData: file.fileData || '' // Store base64 file data for admin viewing
      };
    });
    console.log('✅ Files validated successfully, count:', validFiles.length);

    console.log('🏗️ Creating document submission...');
    // Create the submission
    const submission = await DocumentSubmissionManager.createSubmission(
      userId,
      userEmail,
      userDisplayName,
      validFiles
    );
    console.log('✅ Submission created:', {
      id: submission.id,
      submissionId: submission.submissionId,
      filesCount: submission.files.length,
      hasQrInfo: !!submission.qrInfo
    });

    console.log('💾 Saving to Firestore...');
    // Save to Firestore using client SDK
    const docRef = doc(db, COLLECTIONS.DOCUMENT_SUBMISSIONS, submission.id);
    await setDoc(docRef, {
      ...submission,
      submittedAt: submission.submittedAt,
      qrInfo: {
        ...submission.qrInfo,
        generatedAt: submission.qrInfo.generatedAt
      },
      metadata: {
        ...submission.metadata,
        createdAt: submission.metadata.createdAt,
        updatedAt: submission.metadata.updatedAt
      },
      files: submission.files.map(file => ({
        ...file,
        uploadedAt: file.uploadedAt
      }))
    });
    console.log('✅ Successfully saved to Firestore collection:', COLLECTIONS.DOCUMENT_SUBMISSIONS);

    console.log('🎨 Formatting submission for response...');
    const formattedSubmission = DocumentSubmissionManager.formatSubmissionForDisplay(submission);

    console.log('🎉 Request completed successfully!');
    return NextResponse.json({
      success: true,
      message: 'Document submission created successfully',
      submission: formattedSubmission
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error in POST /api/document-submission:', error);
    console.error('❌ Error name:', error?.name);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error code:', error?.code);
    console.error('❌ Error stack:', error?.stack);
    
    if (error.message?.includes('Missing required file information')) {
      console.log('📁 File validation error detected');
      return NextResponse.json(
        { error: 'Bad Request', message: error.message },
        { status: 400 }
      );
    }

    console.log('💥 Returning 500 Internal Server Error');
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to create submission', details: error?.message },
      { status: 500 }
    );
  }
}

// Simplified GET and PUT methods
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not implemented', message: 'GET endpoint temporarily disabled' },
    { status: 501 }
  );
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not implemented', message: 'PUT endpoint temporarily disabled' },
    { status: 501 }
  );
}