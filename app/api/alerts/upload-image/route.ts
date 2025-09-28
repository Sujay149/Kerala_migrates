import { NextRequest, NextResponse } from 'next/server';
import { storage, auth } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';

export async function POST(request: NextRequest) {
  console.log('🔄 Image upload API route called');
  
  try {
    // Check if storage is initialized
    if (!storage) {
      console.error('❌ Firebase Storage not initialized');
      return NextResponse.json(
        { error: 'Firebase Storage not initialized' },
        { status: 500 }
      );
    }
    
    // Make sure we're authenticated with Firebase (even anonymously)
    try {
      // Check if we're already authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('🔑 No user authenticated, signing in anonymously');
        await signInAnonymously(auth);
        console.log('✅ Anonymous authentication successful');
      }
    } catch (authError) {
      console.error('❌ Firebase Authentication error:', authError);
      // Continue anyway, as Storage rules might allow unauthenticated access
    }
    
    // Get form data
    const formData = await request.formData();
    console.log('✅ Form data received');
    
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('❌ No file provided in form data');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    console.log(`📁 File received: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('❌ File too large');
      return NextResponse.json(
        { error: 'File too large, maximum size is 5MB' },
        { status: 400 }
      );
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      console.error('❌ Invalid file type');
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Convert file to array buffer
    console.log('🔄 Converting file to buffer');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate a unique filename
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize filename
    const filename = `alerts/${timestamp}_${cleanFileName}`;
    console.log(`📝 Generated filename: ${filename}`);
    
    try {
      console.log('🔄 Creating storage reference');
      const storageRef = ref(storage, filename);
      
      console.log('🔄 Uploading file to Firebase Storage');
      await uploadBytes(storageRef, buffer, {
        contentType: file.type,
      });
      
      console.log('🔄 Getting download URL');
      const downloadURL = await getDownloadURL(storageRef);
      
      console.log(`✅ File uploaded successfully. URL: ${downloadURL}`);
      
      return NextResponse.json({ 
        success: true, 
        imageUrl: downloadURL,
        filename
      });
    } catch (uploadError: any) {
      console.error('❌ Firebase Storage operation failed:', uploadError);
      
      if (uploadError.code === 'storage/unauthorized') {
        return NextResponse.json(
          { error: 'Unauthorized access to Firebase Storage. Check your rules.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: uploadError.message || 'Firebase Storage operation failed' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ Unhandled error in upload-image API route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}