import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import CryptoJS from 'crypto-js';

// Comprehensive user data interface
export interface UserComprehensiveData {
  userId: string;
  userEmail: string;
  userDisplayName: string;
  profile: any;
  chatSessions: any[];
  medications: any[];
  healthRecords: any[];
  submissions: any[]; // Renamed from documents for clarity
  feedback: any[];
  appointments: any[];
  summaryRequests: any[];
  generatedAt: Date;
  lastUpdated: Date;
}

// Encryption key for QR data
const QR_ENCRYPTION_KEY = process.env.NEXT_PUBLIC_QR_ENCRYPTION_KEY || 'MigrantBot-qr-key-32-characters-long';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Comprehensive User Data API: Starting data collection...');

    // Get authorization token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.error('❌ No authentication token provided');
      return NextResponse.json({ error: 'No authentication token provided' }, { status: 401 });
    }

    // Parse JWT token to get user information
    let userId, userEmail, userDisplayName;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.user_id || payload.sub;
      userEmail = payload.email;
      userDisplayName = payload.name || payload.display_name;
      
      console.log('👤 Authenticated user:', { userId, userEmail, userDisplayName });
      
      if (!userId || !userEmail) {
        console.error('❌ Invalid token: missing user information');
        throw new Error('Invalid token: missing user information');
      }
    } catch (error) {
      console.error('❌ Token parsing error:', error);
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const userData: UserComprehensiveData = {
      userId,
      userEmail,
      userDisplayName: userDisplayName || 'Unknown User',
      profile: null,
      chatSessions: [],
      medications: [],
      healthRecords: [],
      submissions: [], // Renamed from documents for clarity
      feedback: [],
      appointments: [],
      summaryRequests: [],
      generatedAt: new Date(),
      lastUpdated: new Date()
    };

    // Fetch Chat Sessions
    try {
      console.log('💬 Fetching chat sessions...');
      const chatQuery = query(
        collection(db, 'chatSessions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const chatSnapshot = await getDocs(chatQuery);
      userData.chatSessions = chatSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt)
      }));
      console.log(`✅ Found ${userData.chatSessions.length} chat sessions`);
    } catch (error) {
      console.warn('⚠️ Chat sessions collection not found or empty');
      userData.chatSessions = [];
    }

    // Fetch Medications
    try {
      console.log('💊 Fetching medications...');
      const medicationsQuery = query(
        collection(db, 'medications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const medicationsSnapshot = await getDocs(medicationsQuery);
      userData.medications = medicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt)
      }));
      console.log(`✅ Found ${userData.medications.length} medications`);
    } catch (error) {
      console.warn('⚠️ Medications collection not found or empty');
      userData.medications = [];
    }

    // Fetch Health Records
    try {
      console.log('🏥 Fetching health records...');
      const healthQuery = query(
        collection(db, 'healthRecords'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const healthSnapshot = await getDocs(healthQuery);
      userData.healthRecords = healthSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      }));
      console.log(`✅ Found ${userData.healthRecords.length} health records`);
    } catch (error) {
      console.warn('⚠️ Health records collection not found or empty');
      userData.healthRecords = [];
    }

    // Fetch User Submissions (from submissions collection)
    try {
      console.log('📄 Fetching user submissions for user ID:', userId);
      console.log('📄 User email for submissions query:', userEmail);
      
      // Try with userId first
      const submissionsQueryById = query(
        collection(db, 'submissions'),
        where('userId', '==', userId),
        orderBy('submittedAt', 'desc')
      );
      let submissionsSnapshot = await getDocs(submissionsQueryById);
      
      // If no results, try with email
      if (submissionsSnapshot.empty) {
        console.log('📄 No submissions found by userId, trying with email');
        const submissionsQueryByEmail = query(
          collection(db, 'submissions'),
          where('email', '==', userEmail)
        );
        submissionsSnapshot = await getDocs(submissionsQueryByEmail);
      }
      
      userData.submissions = submissionsSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📄 Found submission:', doc.id, data.submittedAt ? 'has date' : 'no date');
        return {
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate?.() || 
                       (data.submittedAt ? new Date(data.submittedAt) : new Date())
        };
      });
      console.log(`✅ Found ${userData.submissions.length} user submissions`);
    } catch (error) {
      console.warn('⚠️ Submissions collection error:', error);
      userData.submissions = [];
    }

    // Fetch Feedback
    try {
      console.log('💭 Fetching feedback...');
      const feedbackQuery = query(
        collection(db, 'feedback'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const feedbackSnapshot = await getDocs(feedbackQuery);
      userData.feedback = feedbackSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      }));
      console.log(`✅ Found ${userData.feedback.length} feedback entries`);
    } catch (error) {
      console.warn('⚠️ Feedback collection not found or empty');
      userData.feedback = [];
    }

    // Fetch Appointments
    try {
      console.log('📅 Fetching appointments...');
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('userId', '==', userId),
        orderBy('appointmentDate', 'desc')
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      userData.appointments = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        appointmentDate: doc.data().appointmentDate?.toDate?.() || new Date(doc.data().appointmentDate),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      }));
      console.log(`✅ Found ${userData.appointments.length} appointments`);
    } catch (error) {
      console.warn('⚠️ Appointments collection not found or empty');
      userData.appointments = [];
    }

    // Fetch Summary Requests
    try {
      console.log('📝 Fetching summary requests...');
      const summaryQuery = query(
        collection(db, 'summaryRequests'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const summarySnapshot = await getDocs(summaryQuery);
      userData.summaryRequests = summarySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      }));
      console.log(`✅ Found ${userData.summaryRequests.length} summary requests`);
    } catch (error) {
      console.warn('⚠️ Summary requests collection not found or empty');
      userData.summaryRequests = [];
    }

    // Fetch User Profile (if exists)
    try {
      console.log('👤 Fetching user profile for ID:', userId);
      console.log('👤 User email for profile query:', userEmail);
      
      // Try with userId first
      let profileQuery = query(
        collection(db, 'profiles'),
        where('userId', '==', userId)
      );
      let profileSnapshot = await getDocs(profileQuery);
      
      // If no results, try with email
      if (profileSnapshot.empty) {
        console.log('👤 No profile found by userId, trying with email');
        profileQuery = query(
          collection(db, 'profiles'),
          where('email', '==', userEmail)
        );
        profileSnapshot = await getDocs(profileQuery);
      }
      
      if (!profileSnapshot.empty) {
        const profileDoc = profileSnapshot.docs[0];
        const profileData = profileDoc.data();
        userData.profile = {
          id: profileDoc.id,
          ...profileData,
          createdAt: profileData.createdAt?.toDate?.() || 
                    (profileData.createdAt ? new Date(profileData.createdAt) : new Date()),
          updatedAt: profileData.updatedAt?.toDate?.() || 
                    (profileData.updatedAt ? new Date(profileData.updatedAt) : new Date())
        };
        console.log(`✅ Found user profile:`, profileDoc.id);
      } else {
        // Create a minimal profile if none exists
        userData.profile = {
          email: userEmail,
          displayName: userDisplayName || 'User',
          userId: userId
        };
        console.log('👤 Created minimal profile for user');
      }
    } catch (error) {
      console.warn('⚠️ User profile error:', error);
      // Create a minimal profile even on error
      userData.profile = {
        email: userEmail,
        displayName: userDisplayName || 'User',
        userId: userId
      };
    }

    // Calculate summary statistics
    const stats = {
      totalChatSessions: userData.chatSessions.length,
      totalMessages: userData.chatSessions.reduce((sum: number, session: any) => sum + (session.messages?.length || 0), 0),
      totalMedications: userData.medications.length,
      activeMedications: userData.medications.filter((med: any) => med.isActive).length,
      totalHealthRecords: userData.healthRecords.length,
      totalSubmissions: userData.submissions.length,
      approvedSubmissions: userData.submissions.reduce((sum: number, sub: any) => sum + (sub.approvedFiles || 0), 0),
      totalFeedback: userData.feedback.length,
      totalAppointments: userData.appointments.length,
      totalSummaries: userData.summaryRequests.length
    };

    console.log('📊 User data summary:', stats);

    console.log('✅ Successfully built user data response');
    console.log('📊 Final data stats:', {
      profile: !!userData.profile,
      submissions: userData.submissions.length,
      healthRecords: userData.healthRecords.length,
      medications: userData.medications.length,
    });
    
    return NextResponse.json({
      success: true,
      userData,
      stats,
      message: 'Comprehensive user data retrieved successfully'
    });

  } catch (error: any) {
    console.error('❌ Error fetching comprehensive user data:', error);
    return NextResponse.json({
      error: error.message || 'Internal server error',
      success: false
    }, { status: 500 });
  }
}