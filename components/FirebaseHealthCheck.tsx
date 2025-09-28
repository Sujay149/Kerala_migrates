// Firebase Services Health Check
// Add this to your page to check Firebase services status

import { useEffect } from 'react';
import { auth, db, storage } from '../lib/firebase';

export const FirebaseHealthCheck = () => {
  useEffect(() => {
    console.log('🔥 Firebase Services Health Check');
    console.log('==================================');

    // Check Authentication
    if (auth) {
      console.log('✅ Firebase Auth: Available');
      auth.onAuthStateChanged((user: any) => {
        console.log('🔐 Auth State:', user ? 'Authenticated' : 'Not authenticated');
      });
    } else {
      console.log('❌ Firebase Auth: Not available');
      console.log('🔧 Fix: Enable Authentication in Firebase Console');
    }

    // Check Firestore
    if (db) {
      console.log('✅ Firestore: Available');
      // Try a simple operation
      import('firebase/firestore').then(({ doc, getDoc }) => {
        const testDoc = doc(db, 'test', 'health-check');
        getDoc(testDoc).then(() => {
          console.log('✅ Firestore: Connection successful');
        }).catch((error) => {
          console.log('❌ Firestore: Connection failed');
          console.log('🔧 Error:', error.message);
        });
      });
    } else {
      console.log('❌ Firestore: Not available');
      console.log('🔧 Fix: Create Firestore database in Firebase Console');
    }

    // Check Storage
    if (storage) {
      console.log('✅ Firebase Storage: Available');
    } else {
      console.log('❌ Firebase Storage: Not available');
      console.log('🔧 Fix: Enable Storage in Firebase Console');
    }

    // Check project configuration
    console.log('📋 Project Info:');
    console.log(`   Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
    console.log(`   Auth Domain: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}`);
    
  }, []);

  return null; // This is just for diagnostics
};

// Usage: Add <FirebaseHealthCheck /> to your main component