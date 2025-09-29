// Simple test script to check Firestore submissions
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    // Try to load service account from environment
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? 
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) : 
      require(path.join(__dirname, 'serviceAccount.json'));
      
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://MigrantBot-aead4-default-rtdb.firebaseio.com/"
    });
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error.message);
    console.log('Trying to initialize without service account...');
    
    // Fallback initialization (for local development)
    admin.initializeApp({
      databaseURL: "https://MigrantBot-aead4-default-rtdb.firebaseio.com/"
    });
  }
}

const db = admin.firestore();

async function testFirestore() {
  try {
    console.log('Testing Firestore connection...');
    
    // Check submissions collection
    const submissionsRef = db.collection('submissions');
    const snapshot = await submissionsRef.limit(5).get();
    
    console.log(`Found ${snapshot.size} submissions in database`);
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('Submission:', {
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        status: data.status,
        submittedAt: data.submittedAt?.toDate?.() || data.submittedAt,
        documentCount: data.documents?.length || 0
      });
    });
    
    // Check documents collection
    const documentsRef = db.collection('documents');
    const docSnapshot = await documentsRef.limit(5).get();
    
    console.log(`Found ${docSnapshot.size} documents in database`);
    
    docSnapshot.forEach(doc => {
      const data = doc.data();
      console.log('Document:', {
        id: doc.id,
        submissionId: data.submissionId,
        filename: data.filename,
        type: data.type,
        status: data.status,
        userId: data.userId,
        userEmail: data.userEmail
      });
    });
    
    if (snapshot.size === 0 && docSnapshot.size === 0) {
      console.log('No data found in Firestore. Database appears to be empty.');
    }
    
  } catch (error) {
    console.error('Firestore test failed:', error);
  }
}

testFirestore();