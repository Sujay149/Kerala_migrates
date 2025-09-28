"use client";

import { useEffect, useState, useCallback } from "react";
 import { setDoc, serverTimestamp } from "firebase/firestore"; // Add this at the top
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  sendEmailVerification,
  reload,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db, googleProvider, facebookProvider } from "@/lib/firebase";
import { getUserProfile, type UserProfile } from "@/lib/firestore";
import { validateAdminCredentials, isAdminEmail, getAdminRole, type AdminCredentials } from "@/lib/admin-config";

// Constants for caching
const PROFILE_CACHE_KEY = "medibot_user_profile";

const getCachedProfile = (uid: string): UserProfile | null => {
  try {
    const cached = localStorage.getItem(`${PROFILE_CACHE_KEY}_${uid}`);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error("useAuth: Error reading cached profile:", error);
    return null;
  }
};

const setCachedProfile = (uid: string, profile: UserProfile | null) => {
  try {
    if (profile) {
      localStorage.setItem(`${PROFILE_CACHE_KEY}_${uid}`, JSON.stringify(profile));
    } else {
      localStorage.removeItem(`${PROFILE_CACHE_KEY}_${uid}`);
    }
  } catch (error) {
    console.error("useAuth: Error caching profile:", error);
  }
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async (uid: string) => {
    try {
      const profile = await getUserProfile(uid);
      setUserProfile(profile);
      setCachedProfile(uid, profile);
    } catch (error) {
      console.error("useAuth: Error refreshing profile:", error);
    }
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false); // Done with auth check

      if (firebaseUser) {
        const cached = getCachedProfile(firebaseUser.uid);
        if (cached && !userProfile) {
          setUserProfile(cached);
        }
      } else {
        if (userProfile !== null) {
          setUserProfile(null);
        }
        setCachedProfile("", null);
      }
    });

    return () => unsubscribeAuth();
  }, [userProfile]);

  // Firestore real-time profile sync
  useEffect(() => {
    if (!user) return;

    let unsubscribeFirestore: () => void;

    const fetchAndSubscribe = async () => {
      try {
        const profile = await getUserProfile(user.uid);
        if (
          !userProfile ||
          JSON.stringify(profile) !== JSON.stringify(userProfile)
        ) {
          setUserProfile(profile);
          setCachedProfile(user.uid, profile);
        }
      } catch (err) {
        console.error("useAuth: Error fetching profile:", err);
      }

      const userRef = doc(db, "users", user.uid);
      unsubscribeFirestore = onSnapshot(
        userRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            const normalizedProfile: UserProfile = {
              ...data,
              gender: data.gender ?? "",
              medicalInfo: data.medicalInfo
                ? {
                    ...data.medicalInfo,
                    bloodType: data.medicalInfo.bloodType ?? "",
                  }
                : { allergies: [], conditions: [], bloodType: "" },
            };
            setUserProfile(normalizedProfile);
            setCachedProfile(user.uid, normalizedProfile);
          }
        },
        (error) => {
          console.error("useAuth: Firestore snapshot error:", error);
          setTimeout(() => refreshProfile(user.uid), 1000); // Retry after delay
        }
      );
    };

    fetchAndSubscribe();

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, [user, refreshProfile]);

  // Auth functions
  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    // Set persistence based on rememberMe
    const { browserLocalPersistence, browserSessionPersistence, setPersistence } = await import('firebase/auth');
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    
    // Check if this is an admin login attempt
    if (isAdminEmail(email)) {
      const adminCreds = validateAdminCredentials(email, password);
      if (!adminCreds) {
        throw new Error("Invalid admin credentials. Please check your email and password.");
      }
      
      // Create a temporary admin user account or sign in if exists
      try {
        // Try to sign in first (if admin account already exists in Firebase)
        const result = await signInWithEmailAndPassword(auth, email, password);
        
        // Update admin profile in Firestore
        await setDoc(doc(db, "users", result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: adminCreds.organizationName,
          isAdmin: true,
          adminRole: adminCreds.role,
          organizationName: adminCreds.organizationName,
          permissions: adminCreds.permissions,
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        }, { merge: true });
        
        return result;
      } catch (error: any) {
        // If admin account doesn't exist, create it
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            
            // Update profile with admin data
            await updateProfile(result.user, { 
              displayName: adminCreds.organizationName 
            });
            
            // Save admin profile to Firestore
            await setDoc(doc(db, "users", result.user.uid), {
              uid: result.user.uid,
              email: result.user.email,
              displayName: adminCreds.organizationName,
              isAdmin: true,
              adminRole: adminCreds.role,
              organizationName: adminCreds.organizationName,
              permissions: adminCreds.permissions,
              lastLogin: serverTimestamp(),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            
            return result;
          } catch (createError: any) {
            throw new Error(`Failed to create admin account: ${createError.message}`);
          }
        }
        throw error;
      }
    }
    
    // Regular user login
    const result = await signInWithEmailAndPassword(auth, email, password);

    // Only require email verification for non-admin users
    if (!isAdminEmail(email)) {
      if (!result.user.emailVerified) {
        await signOut(auth); // Sign out unverified user
        throw new Error("Please verify your email before logging in. Check your inbox for the verification link.");
      }
    }
    return result;
  };



const signUp = async (
  email: string,
  password: string,
  displayName?: string
) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);

  const user = result.user;

  if (displayName && user) {
    await updateProfile(user, { displayName });
  }

  // Send email verification
  await sendEmailVerification(user, {
    url: `${window.location.origin}/auth/signin`, // Redirect URL after verification
    handleCodeInApp: false,
  });

  // Save additional user data to Firestore
  await setDoc(doc(db, "users", user.uid), {
    displayName: displayName || "",
    email: user.email,
    createdAt: serverTimestamp(),
    dateOfBirth: "", // default, can be updated later in profile-setup
    photoURL: user.photoURL || "",
    medicalInfo: {
      allergies: ["none"],
      bloodType: "",
      conditions: ["none"],
    },
    preferences: {},
    emailVerified: false, // Track verification status
  });

  return result;
};


  const signInWithGoogle = async (rememberMe: boolean = false) => {
    const { browserLocalPersistence, browserSessionPersistence, setPersistence } = await import('firebase/auth');
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    return signInWithPopup(auth, googleProvider);
  };

  const signInWithFacebook = async (rememberMe: boolean = false) => {
    const { browserLocalPersistence, browserSessionPersistence, setPersistence } = await import('firebase/auth');
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    return signInWithPopup(auth, facebookProvider);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
    setCachedProfile("", null);
  };

  const resetPassword = async (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  const resendVerificationEmail = async () => {
    if (!user) throw new Error("No user logged in");
    
    await sendEmailVerification(user, {
      url: `${window.location.origin}/auth/signin`,
      handleCodeInApp: false,
    });
  };

  const checkEmailVerified = async () => {
    if (!user) return false;
    
    await reload(user);
    return user.emailVerified;
  };

  return {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithFacebook,
    logout,
    resetPassword,
    refreshProfile,
    resendVerificationEmail,
    checkEmailVerified,
  };
}
