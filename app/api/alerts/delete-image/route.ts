import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/firebase';
import { ref, deleteObject } from 'firebase/storage';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'No image URL provided' },
        { status: 400 }
      );
    }

    // Extract path from URL
    // This is a basic extraction method and might need adjustment
    // based on your exact URL format
    let path;
    try {
      const url = new URL(imageUrl);
      // Get the path after the bucket name
      const fullPath = url.pathname;
      // Extract the path after "/o/"
      path = decodeURIComponent(fullPath.split('/o/')[1]);
    } catch (error) {
      // If the URL parsing fails, assume imageUrl is already a path
      path = imageUrl;
    }

    // Create reference to the image
    const storageRef = ref(storage, path);

    // Delete the image
    await deleteObject(storageRef);

    return NextResponse.json({ 
      success: true, 
      message: 'Image deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete image' },
      { status: 500 }
    );
  }
}