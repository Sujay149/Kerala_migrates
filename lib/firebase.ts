import { initializeApp } from "firebase/app"
import { 
  getAuth, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  sendEmailVerification,
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset
} from "firebase/auth"
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  enableNetwork, 
  disableNetwork,
  connectFirestoreEmulator,
  memoryLocalCache
} from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getMessaging } from "firebase/messaging"

// Use environment variables with fallback to prevent client-side access errors
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDAaetYa2rdX86TIfUrI7MSdXSVJTaMBRw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "sih-kerala.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://sih-kerala-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sih-kerala",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sih-kerala.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "84752283767",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:84752283767:web:c3b1ca8f6afe1ba4bdee72",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-GXE59L0KCR",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("✅ Firebase initialized successfully");

// Initialize Firebase services with error handling
let auth: any, db: any, storage: any, messaging: any

try {
  auth = getAuth(app)
  console.log("✅ Firebase Auth initialized")
} catch (error) {
  console.error("❌ Firebase Auth initialization failed:", error)
  console.log("🔧 Fix: Enable Authentication in Firebase Console")
}

try {
  // Initialize Firestore with fallback
  db = getFirestore(app);
  console.log("✅ Firestore initialized");
} catch (error) {
  console.error("❌ Firestore initialization failed:", error)
}

// storage
try {
  storage = getStorage(app)
  console.log("✅ Firebase Storage initialized")
} catch (error) {
  console.error("❌ Firebase Storage initialization failed:", error)
  console.log("🔧 Fix: Enable Storage in Firebase Console")
}

// messaging
try {
  messaging = typeof window !== "undefined" ? getMessaging(app) : null
  if (messaging) console.log("✅ Firebase Messaging initialized")
} catch (error) {
  console.error("❌ Firebase Messaging initialization failed:", error)
  messaging = null
}

export { auth, db, storage, messaging }

// Network status utilities
export const goOnline = () => {
  if (db) {
    return enableNetwork(db).catch(console.error)
  }
}

export const goOffline = () => {
  if (db) {
    return disableNetwork(db).catch(console.error)
  }
}

// Connection status checker
export const isFirestoreOffline = () => {
  return typeof window !== 'undefined' && !navigator.onLine
}

// Auth providers
export const googleProvider = new GoogleAuthProvider()
export const facebookProvider = new FacebookAuthProvider()

// Configure providers
googleProvider.setCustomParameters({
  prompt: "select_account",
})

facebookProvider.setCustomParameters({
  display: "popup",
})

// Email verification functions
export const sendVerificationEmail = async (user: any) => {
  try {
    await sendEmailVerification(user, {
      url: `${window.location.origin}/auth/signin`, // Redirect URL after verification
      handleCodeInApp: false,
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    return { success: false, error: error.message };
  }
};

export const verifyEmailAction = async (actionCode: string) => {
  try {
    await applyActionCode(auth, actionCode);
    return { success: true };
  } catch (error: any) {
    console.error("Error verifying email:", error);
    return { success: false, error: error.message };
  }
};

export default app
