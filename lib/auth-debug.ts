// Debug utility for authentication and Firestore issues
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const debugAuth = () => {
  console.log('🔍 Auth Debug: Current auth state');
  
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('✅ Auth Debug: User is authenticated', {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        isAnonymous: user.isAnonymous
      });
    } else {
      console.log('❌ Auth Debug: User is NOT authenticated');
    }
  });
};

export const waitForAuth = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(!!user);
    });
  });
};

export const logFirestoreOperation = (operation: string, collection: string, authenticated: boolean) => {
  console.log(`🔥 Firestore Debug: ${operation} on ${collection}`, {
    authenticated,
    currentUser: auth.currentUser?.uid || 'none'
  });
};