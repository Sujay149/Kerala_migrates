import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Define upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'alerts');

// Ensure upload directory exists
try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`📁 Created upload directory: ${UPLOAD_DIR}`);
  }
} catch (error) {
  console.error('❌ Failed to create upload directory:', error);
}

export async function POST(request: NextRequest) {
  console.log('🔄 Local upload API route called');
  
  try {
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
    const filename = `${timestamp}_${cleanFileName}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    console.log(`📝 Generated filename: ${filename}`);
    console.log(`📝 Full file path: ${filePath}`);
    
    try {
      // Write file to disk
      console.log('🔄 Writing file to disk');
      fs.writeFileSync(filePath, buffer);
      
      // Generate public URL
      const imageUrl = `/uploads/alerts/${filename}`;
      console.log(`✅ File saved successfully. Public URL: ${imageUrl}`);
      
      return NextResponse.json({ 
        success: true, 
        imageUrl,
        filename
      });
    } catch (writeError: any) {
      console.error('❌ File system write operation failed:', writeError);
      return NextResponse.json(
        { error: writeError.message || 'Failed to write file to disk' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ Unhandled error in upload-local API route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image locally' },
      { status: 500 }
    );
  }
}