import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

export async function GET(req: NextRequest) {
  try {
    // Get user ID from query parameters
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`🏥 Fetching health records for user: ${userId}`);

    // Fetch user submissions from Firebase
    let submissionsSnapshot;
    
    try {
      // Try with ordering first (requires composite index)
      const submissionsQuery = query(
        collection(db, 'submissions'),
        where('userId', '==', userId),
        orderBy('submittedAt', 'desc')
      );
      submissionsSnapshot = await getDocs(submissionsQuery);
    } catch (indexError: any) {
      console.warn('📋 Composite index not available, fetching without ordering:', indexError.code);
      
      // Fallback: query without ordering (doesn't require composite index)
      const simpleQuery = query(
        collection(db, 'submissions'),
        where('userId', '==', userId)
      );
      submissionsSnapshot = await getDocs(simpleQuery);
    }
    
    // Transform submissions to health records format
    const healthRecords = submissionsSnapshot.docs.map(doc => {
      const data = doc.data();
      const submittedAt = data.submittedAt?.toDate?.() || new Date(data.submittedAt);
      
      // Create a health record from submission data
      return {
        id: doc.id,
        title: data.title || data.subject || `Health Document - ${submittedAt.toLocaleDateString()}`,
        type: determineRecordType(data),
        date: submittedAt,
        provider: data.provider || data.doctorName || 'Unknown Provider',
        status: data.status || 'completed',
        summary: data.description || data.message || 'Health document submission',
        attachments: data.files ? data.files.length : 0,
        tags: generateTags(data),
        files: data.files || [],
        originalSubmission: {
          patientName: data.patientName,
          contactNumber: data.contactNumber,
          email: data.email,
          age: data.age,
          gender: data.gender,
          address: data.address,
          symptoms: data.symptoms,
          medicalHistory: data.medicalHistory,
          medications: data.medications,
          allergies: data.allergies,
          emergencyContact: data.emergencyContact,
          preferredLanguage: data.preferredLanguage
        }
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime()); // Manual sorting by date descending

    console.log(`✅ Found ${healthRecords.length} health records for user ${userId}`);

    return NextResponse.json({
      success: true,
      records: healthRecords,
      total: healthRecords.length
    });

  } catch (error) {
    console.error('❌ Error fetching health records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health records' },
      { status: 500 }
    );
  }
}

// Helper function to determine record type based on submission data
function determineRecordType(data: any): string {
  if (data.type) return data.type;
  
  // Try to determine from content
  const content = (data.description || data.message || '').toLowerCase();
  const title = (data.title || data.subject || '').toLowerCase();
  const combined = `${title} ${content}`;
  
  if (combined.includes('prescription') || combined.includes('medication')) return 'prescription';
  if (combined.includes('lab') || combined.includes('test') || combined.includes('result')) return 'lab';
  if (combined.includes('vaccine') || combined.includes('immunization')) return 'vaccination';
  if (combined.includes('x-ray') || combined.includes('mri') || combined.includes('scan') || combined.includes('imaging')) return 'imaging';
  if (combined.includes('discharge') || combined.includes('summary')) return 'discharge';
  if (combined.includes('visit') || combined.includes('consultation') || combined.includes('appointment')) return 'visit';
  
  return 'general';
}

// Helper function to generate tags based on submission data
function generateTags(data: any): string[] {
  const tags: string[] = [];
  
  // Add tags based on content
  if (data.symptoms) tags.push('symptoms');
  if (data.medications) tags.push('medications');
  if (data.allergies) tags.push('allergies');
  if (data.medicalHistory) tags.push('medical-history');
  if (data.files && data.files.length > 0) tags.push('documents');
  if (data.emergencyContact) tags.push('emergency');
  
  // Add status-based tags
  if (data.status === 'urgent') tags.push('urgent');
  if (data.status === 'approved') tags.push('approved');
  if (data.status === 'pending') tags.push('pending');
  
  // Add file type tags
  if (data.files) {
    data.files.forEach((file: any) => {
      if (file.name) {
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension === 'pdf') tags.push('pdf');
        if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) tags.push('image');
        if (['doc', 'docx'].includes(extension || '')) tags.push('document');
      }
    });
  }
  
  return [...new Set(tags)]; // Remove duplicates
}