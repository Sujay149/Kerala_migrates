"use client";

import { useEffect, useState } from 'react';
import { auth, db, storage } from '@/lib/firebase';

export default function FirebaseTestPage() {
  const [status, setStatus] = useState({
    auth: '🔄 Checking...',
    firestore: '🔄 Checking...',
    storage: '🔄 Checking...',
    project: '🔄 Checking...'
  });

  useEffect(() => {
    console.log('🔥 Firebase Health Check Started');
    
    // Check project configuration
    setStatus(prev => ({
      ...prev,
      project: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'sih-kerala' 
        ? '✅ Project: sih-kerala' 
        : '❌ Wrong project ID'
    }));

    // Check Authentication
    if (auth) {
      setStatus(prev => ({ ...prev, auth: '✅ Authentication: Available' }));
      auth.onAuthStateChanged((user: any) => {
        console.log('🔐 Auth state changed:', user ? 'Signed in' : 'Signed out');
      });
    } else {
      setStatus(prev => ({ ...prev, auth: '❌ Authentication: Not configured' }));
    }

    // Check Firestore
    if (db) {
      setStatus(prev => ({ ...prev, firestore: '✅ Firestore: Available' }));
      
      // Test Firestore connection
      import('firebase/firestore').then(({ doc, getDoc }) => {
        const testDoc = doc(db, 'test', 'connection');
        getDoc(testDoc).then(() => {
          setStatus(prev => ({ ...prev, firestore: '✅ Firestore: Connected' }));
        }).catch((error) => {
          console.error('Firestore error:', error);
          setStatus(prev => ({ 
            ...prev, 
            firestore: `❌ Firestore: Error - ${error.message}` 
          }));
        });
      });
    } else {
      setStatus(prev => ({ ...prev, firestore: '❌ Firestore: Not configured' }));
    }

    // Check Storage
    if (storage) {
      setStatus(prev => ({ ...prev, storage: '✅ Storage: Available' }));
    } else {
      setStatus(prev => ({ ...prev, storage: '❌ Storage: Not configured' }));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🔥 Firebase Service Health Check
        </h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Service Status:</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="font-mono text-lg">{status.project}</span>
            </div>
            <div className="flex items-center">
              <span className="font-mono text-lg">{status.auth}</span>
            </div>
            <div className="flex items-center">
              <span className="font-mono text-lg">{status.firestore}</span>
            </div>
            <div className="flex items-center">
              <span className="font-mono text-lg">{status.storage}</span>
            </div>
          </div>
        </div>

        <div className="bg-red-900 border border-red-700 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-red-200">
            🚨 If you see errors above:
          </h2>
          <div className="text-red-100 space-y-2">
            <p>1. 📡 <strong>Enable APIs</strong>: Go to Google Cloud Console → APIs → Enable required APIs</p>
            <p>2. 🗄️ <strong>Create Firestore</strong>: Firebase Console → Firestore → Create database</p>
            <p>3. 🔐 <strong>Enable Auth</strong>: Firebase Console → Authentication → Get started</p>
            <p>4. 📦 <strong>Enable Storage</strong>: Firebase Console → Storage → Get started</p>
            <p>5. 🔑 <strong>Service Account</strong>: Generate and add to .env.local</p>
          </div>
        </div>

        <div className="bg-blue-900 border border-blue-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-200">
            📖 Detailed Instructions:
          </h2>
          <p className="text-blue-100">
            Check <code>URGENT_FIREBASE_FIXES.md</code> for step-by-step instructions
          </p>
        </div>
      </div>
    </div>
  );
}