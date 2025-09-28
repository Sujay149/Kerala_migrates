import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  onSnapshot,
  limit,
  arrayUnion,
  type Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "./firebase";
import { v4 as uuidv4 } from "uuid";
import { logFirestoreOperation } from "./auth-debug";

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  customLogoURL?: string; // Custom logo uploaded by user
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalInfo?: {
    allergies: string[];
    conditions: string[];
    bloodType?: string;
  };
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  preferences?: {
    theme: "dark" | "light";
    notifications: boolean;
    emailNotifications: boolean;
    medicationReminders: boolean;
    appointmentReminders: boolean;
  };
  // Admin fields
  isAdmin?: boolean;
  adminRole?: 'government' | 'health_center';
  organizationName?: string;
  permissions?: string[];
  lastLogin?: Timestamp | Date;
}

export interface ChatMessage {
  id: string;
  userId: string;
  image?: string | null;
  message: string;
  response: string;
  timestamp: Timestamp | Date;
  type: "chat" | "summarizer";
}

export interface ChatSession {
  id?: string | null;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface Medication {
  id?: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  reminderTimes: string[];
  isActive: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface HealthRecord {
  id?: string;
  userId: string;
  type: "symptom" | "appointment" | "test_result" | "vital_signs";
  title: string;
  description: string;
  date: string;
  attachments?: string[];
  createdAt: Timestamp | Date;
}

export interface SummaryRequest {
  id?: string;
  userId: string;
  originalText: string;
  summary: string;
  category: "symptoms" | "medication" | "diagnosis" | "treatment" | "general";
  createdAt: Timestamp | Date;
}

export interface PrescriptionAnalysis {
  id?: string;
  userId: string;
  fileName: string;
  medications: string[];
  dosages: string[];
  instructions: string;
  warnings: string[];
  createdAt: Timestamp | Date;
}

export interface NotificationSettings {
  id?: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  medicationReminders: boolean;
  appointmentReminders: boolean;
  reminderTimes: string[];
  createdAt: Timestamp | Date;
}

export interface Appointment {
  id?: string;
  userId: string;
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone?: string;
  hospitalLocation?: {
    lat: number;
    lng: number;
  };
  doctorName: string;
  appointmentType: string;
  date: string;
  time: string;
  notes?: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export const createUserProfile = async (
  uid: string,
  email: string,
  displayName?: string,
  photoURL?: string,
  additionalData?: Partial<UserProfile>,
) => {
  try {
    const userRef = doc(db, "users", uid);
    const userData: UserProfile = {
      uid,
      email,
      displayName: displayName || email.split("@")[0],
      photoURL,
      ...additionalData,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      preferences: {
        theme: "dark",
        notifications: true,
        emailNotifications: true,
        medicationReminders: true,
        appointmentReminders: true,
        ...additionalData?.preferences,
      },
    };

    await setDoc(userRef, userData);
    await createNotificationSettings(uid);
    return userData;
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw new Error("Failed to create user profile");
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const isAuthenticated = !!auth.currentUser;
    logFirestoreOperation('GET', 'users', isAuthenticated);
    
    if (!isAuthenticated) {
      console.warn("⚠️ Firestore: Attempting to get user profile without authentication");
    }

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      console.log("✅ Firestore: Successfully retrieved user profile");
      return userSnap.data() as UserProfile;
    }
    console.log("ℹ️ Firestore: User profile not found");
    return null;
  } catch (error) {
    console.error("❌ Firestore Error getting user profile:", error);
    
    // Provide more specific error messages
    if (error instanceof Error && 'code' in error && error.code === 'permission-denied') {
      console.error("🚫 Permission denied - check Firestore rules and authentication");
    }
    
    return null;
  }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  try {
    const userRef = doc(db, "users", uid);
    
    // First check if the document exists
    const docSnap = await getDoc(userRef);
    
    if (!docSnap.exists()) {
      // Document doesn't exist, create it with minimal required data
      const userData: UserProfile = {
        uid,
        email: data.email || '',
        displayName: data.displayName || '',
        photoURL: data.photoURL || '',
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        preferences: {
          theme: "dark",
          notifications: true,
          emailNotifications: true,
          medicationReminders: true,
          appointmentReminders: true,
        },
        ...data,
      };
      
      await setDoc(userRef, userData);
      console.log("✅ User profile created successfully");
    } else {
      // Document exists, update it
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      console.log("✅ User profile updated successfully");
    }
  } catch (error) {
    console.error("❌ Error updating user profile:", error);
    
    // Provide more specific error information
    if (error instanceof Error) {
      if ('code' in error) {
        switch ((error as any).code) {
          case 'permission-denied':
            throw new Error("Permission denied. Please check your authentication status and Firestore rules.");
          case 'not-found':
            throw new Error("User document not found. Please try signing out and back in.");
          case 'unavailable':
            throw new Error("Firestore is temporarily unavailable. Please try again later.");
          default:
            throw new Error(`Update failed: ${error.message}`);
        }
      }
    }
    
    throw new Error("Failed to update user profile. Please try again.");
  }
};

export const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
  try {
    const storageRef = ref(storage, `profile-pictures/${userId}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    await updateUserProfile(userId, { photoURL: downloadURL });
    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw new Error("Failed to upload profile picture");
  }
};

export const createChatSession = async (userId: string, title: string) => {
  try {
    const chatRef = collection(db, "chatSessions");
    const chatData: Omit<ChatSession, "id"> = {
      userId,
      title: title.slice(0, 100),
      messages: [],
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    const docRef = await addDoc(chatRef, chatData);
    console.log("Created chat session with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating chat session:", error);
    throw new Error("Failed to create chat session");
  }
};

export const addMessageToSession = async (
  sessionId: string,
  userId: string,
  message: string,
  response: string,
  type: "chat" | "summarizer" = "chat",
  image: string | null = null
) => {
  try {
    const sessionRef = doc(db, "chatSessions", sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      throw new Error("Session not found");
    }

    const newMessage: ChatMessage = {
      id: uuidv4(),
      userId,
      message: message.slice(0, 1000) || "No message provided",
      response: response.slice(0, 2000) || "No response provided",
      type: type || "chat",
      timestamp: new Date(),
      image: image ?? null,
    };

    console.log("addMessageToSession: newMessage before cleaning:", newMessage);

    const cleanedMessage = Object.fromEntries(
      Object.entries(newMessage).filter(([_, value]) => value !== undefined)
    ) as ChatMessage;

    console.log("addMessageToSession: cleanedMessage:", cleanedMessage);

    if (!cleanedMessage.id || !cleanedMessage.userId || !cleanedMessage.message || !cleanedMessage.response || !cleanedMessage.type) {
      throw new Error("Missing required fields in message");
    }

    await updateDoc(sessionRef, {
      messages: arrayUnion(cleanedMessage),
      updatedAt: serverTimestamp(),
    });

    console.log("Added message to session:", sessionId, cleanedMessage);
    return cleanedMessage;
  } catch (error) {
    console.error("Error adding message to session:", error);
    throw new Error("Failed to add message");
  }
};

export const updateChatSessionTitle = async (sessionId: string, title: string) => {
  try {
    const sessionRef = doc(db, "chatSessions", sessionId);
    await updateDoc(sessionRef, { title });
  } catch (error) {
    console.error("Error updating session title:", error);
    throw new Error("Failed to update chat session title");
  }
};

export const getUserChatSessions = async (userId: string): Promise<ChatSession[]> => {
  try {
    const chatsRef = collection(db, "chatSessions");
    const q = query(chatsRef, where("userId", "==", userId), limit(50));

    const querySnapshot = await getDocs(q);
    const sessions = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as ChatSession,
    );

    console.log("Fetched sessions for user:", userId, sessions);
    return sessions;
  } catch (error) {
    console.error("Error getting chat sessions:", error);
    return [];
  }
};

export const getChatSessionById = async (sessionId: string) => {
  try {
    const docRef = doc(db, "chatSessions", sessionId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ChatSession;
    }
    return null;
  } catch (error) {
    console.error("Error getting chat session by ID:", error);
    throw new Error("Failed to get chat session");
  }
};

export const deleteChatSession = async (sessionId: string) => {
  try {
    const sessionRef = doc(db, "chatSessions", sessionId);
    await deleteDoc(sessionRef);
  } catch (error) {
    console.error("Error deleting session:", error);
    throw new Error("Failed to delete chat session");
  }
};

export const subscribeToUserChatSessions = (
  userId: string,
  callback: (sessions: ChatSession[]) => void,
) => {
  try {
    const chatsRef = collection(db, "chatSessions");
    const q = query(chatsRef, where("userId", "==", userId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs
        .map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as ChatSession,
        );
      console.log("Subscribed sessions for user:", userId, sessions);
      callback(sessions);
    }, (error) => {
      console.error("Error in subscribeToUserChatSessions:", error);
      callback([]);
    });

    return unsubscribe;
  } catch (error) {
    console.error("Error setting up subscription:", error);
    callback([]);
    return () => {};
  }
};

export const analyzePrescription = async (
  userId: string,
  fileName: string,
  description: string,
): Promise<PrescriptionAnalysis> => {
  try {
    const analysis: Omit<PrescriptionAnalysis, "id"> = {
      userId,
      fileName,
      medications: ["Amoxicillin", "Ibuprofen", "Vitamin D3"],
      dosages: ["500mg twice daily", "200mg as needed", "1000 IU daily"],
      instructions: "Take Amoxicillin with food. Ibuprofen for pain relief only. Vitamin D3 with breakfast.",
      warnings: [
        "Do not take Ibuprofen on empty stomach",
        "Complete full course of Amoxicillin even if feeling better",
        "Avoid alcohol while taking Amoxicillin",
      ],
      createdAt: serverTimestamp() as Timestamp,
    };

    const analysisRef = collection(db, "prescriptionAnalyses");
    const docRef = await addDoc(analysisRef, analysis);

    return { id: docRef.id, ...analysis };
  } catch (error) {
    console.error("Error analyzing prescription:", error);
    throw new Error("Failed to analyze prescription");
  }
};

export const getUserPrescriptionAnalyses = async (userId: string): Promise<PrescriptionAnalysis[]> => {
  try {
    const analysesRef = collection(db, "prescriptionAnalyses");
    const q = query(analysesRef, where("userId", "==", userId), limit(50));

    const querySnapshot = await getDocs(q);
    const analyses = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as PrescriptionAnalysis,
    );

    return analyses.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any)?.seconds * 1000 || 0;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any)?.seconds * 1000 || 0;
      return bTime - aTime;
    });
  } catch (error) {
    console.error("Error getting prescription analyses:", error);
    return [];
  }
};

export const deletePrescriptionAnalysis = async (analysisId: string) => {
  try {
    const analysisRef = doc(db, "prescriptionAnalyses", analysisId);
    await deleteDoc(analysisRef);
  } catch (error) {
    console.error("Error deleting prescription analysis:", error);
    throw new Error("Failed to delete prescription analysis");
  }
};

export const addMedication = async (
  userId: string,
  medication: Omit<Medication, "id" | "userId" | "createdAt" | "updatedAt">,
) => {
  try {
    const medicationRef = collection(db, "medications");
    const medicationData: Omit<Medication, "id"> = {
      userId,
      ...medication,
      isActive: true,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    const docRef = await addDoc(medicationRef, medicationData);

    if (medication.reminderTimes.length) {
      await scheduleMedicationReminders(userId, docRef.id, medication.reminderTimes);
    }

    return docRef.id;
  } catch (error) {
    console.error("Error adding medication:", error);
    throw new Error("Failed to add medication");
  }
};

export const updateMedication = async (medicationId: string, data: Partial<Medication>) => {
  try {
    const docRef = doc(db, "medications", medicationId);
    const updateData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updateData[key] = value === null ? null : value;
      }
    }
    updateData.updatedAt = serverTimestamp();
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating medication:", error);
    throw new Error("Failed to update medication");
  }
};

export const deleteMedication = async (medicationId: string) => {
  try {
    const medicationRef = doc(db, "medications", medicationId);
    await deleteDoc(medicationRef);

    const remindersRef = collection(db, "medicationReminders");
    const q = query(remindersRef, where("medicationId", "==", medicationId));
    const querySnapshot = await getDocs(q);
    for (const doc of querySnapshot.docs) {
      await deleteDoc(doc.ref);
    }
  } catch (error) {
    console.error("Error deleting medication:", error);
    throw new Error("Failed to delete medication");
  }
};

export const getUserMedications = async (userId: string): Promise<Medication[]> => {
  try {
    const medicationsRef = collection(db, "medications");
    const q = query(medicationsRef, where("userId", "==", userId), limit(50));

    const querySnapshot = await getDocs(q);
    const medications = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Medication,
    );

    return medications.sort((a, b) => {
      const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : (a.updatedAt as any)?.seconds * 1000 || 0;
      const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : (b.updatedAt as any)?.seconds * 1000 || 0;
      return bTime - aTime;
    });
  } catch (error) {
    console.error("Error getting medications:", error);
    return [];
  }
};

export const scheduleMedicationReminders = async (
  userId: string,
  medicationId: string,
  reminderTimes: string[],
) => {
  try {
    const remindersRef = collection(db, "medicationReminders");
    for (const time of reminderTimes) {
      const reminderData = {
        userId,
        medicationId,
        time,
        createdAt: serverTimestamp(),
      };
      await addDoc(remindersRef, reminderData);
    }
  } catch (error) {
    console.error("Error scheduling medication reminders:", error);
    throw new Error("Failed to schedule medication reminders");
  }
};

export function sendMedicationReminder(
  userId: string,
  medicationName: string,
) {
  console.log("Reminder:", userId, medicationName);
}

export const subscribeToUserMedications = (
  userId: string,
  callback: (medications: Medication[]) => void,
) => {
  try {
    const medicationsRef = collection(db, "medications");
    const q = query(medicationsRef, where("userId", "==", userId), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const medications = snapshot.docs
        .map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Medication,
        )
        .sort((a, b) => {
          const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : (a.updatedAt as any)?.seconds * 1000 || 0;
          const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : (b.updatedAt as any)?.seconds * 1000 || 0;
          return bTime - aTime;
        });
      callback(medications);
    });

    return unsubscribe;
  } catch (error) {
    console.error("Error subscribing to medications:", error);
    return () => {};
  }
};

export const addHealthRecord = async (
  userId: string,
  record: Omit<HealthRecord, "id" | "userId" | "createdAt">,
) => {
  try {
    const recordsRef = collection(db, "healthRecords");
    const recordData: Omit<HealthRecord, "id"> = {
      userId,
      ...record,
      createdAt: serverTimestamp() as Timestamp,
    };

    const docRef = await addDoc(recordsRef, recordData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding health record:", error);
    throw new Error("Failed to add health record");
  }
};

export const getUserHealthRecords = async (userId: string): Promise<HealthRecord[]> => {
  try {
    const recordsRef = collection(db, "healthRecords");
    const q = query(recordsRef, where("userId", "==", userId), limit(50));

    const querySnapshot = await getDocs(q);
    const records = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as HealthRecord,
    );

    return records.sort((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      return bTime - aTime;
    });
  } catch (error) {
    console.error("Error getting health records:", error);
    return [];
  }
};

export const updateHealthRecord = async (recordId: string, data: Partial<HealthRecord>) => {
  try {
    const docRef = doc(db, "healthRecords", recordId);
    const updateData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updateData[key] = value === null ? null : value;
      }
    }
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating health record:", error);
    throw new Error("Failed to update health record");
  }
};

export const deleteHealthRecord = async (recordId: string) => {
  try {
    const recordRef = doc(db, "healthRecords", recordId);
    await deleteDoc(recordRef);
  } catch (error) {
    console.error("Error deleting health record:", error);
    throw new Error("Failed to delete health record");
  }
};

export const addSummaryRequest = async (
  userId: string,
  originalText: string,
  summary: string,
  category: "symptoms" | "medication" | "diagnosis" | "treatment" | "general",
) => {
  try {
    const summariesRef = collection(db, "summaries");
    const summaryData: Omit<SummaryRequest, "id"> = {
      userId,
      originalText,
      summary,
      category,
      createdAt: serverTimestamp() as Timestamp,
    };

    const docRef = await addDoc(summariesRef, summaryData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding summary request:", error);
    throw new Error("Failed to add summary request");
  }
};

export const getUserSummaries = async (userId: string): Promise<SummaryRequest[]> => {
  try {
    const summariesRef = collection(db, "summaries");
    const q = query(summariesRef, where("userId", "==", userId), limit(50));

    const querySnapshot = await getDocs(q);
    const summaries = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as SummaryRequest,
    );

    return summaries.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any)?.seconds * 1000 || 0;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any)?.seconds * 1000 || 0;
      return bTime - aTime;
    });
  } catch (error) {
    console.error("Error getting summaries:", error);
    return [];
  }
};

export const deleteSummary = async (summaryId: string): Promise<void> => {
  try {
    const summaryRef = doc(db, "summaries", summaryId);
    await deleteDoc(summaryRef);
    console.log("Summary deleted successfully");
  } catch (error) {
    console.error("Error deleting summary:", error);
    throw new Error("Failed to delete summary");
  }
};

export const createNotificationSettings = async (userId: string) => {
  try {
    const settingsRef = doc(db, "notificationSettings", userId);
    const settingsData: NotificationSettings = {
      userId,
      emailNotifications: true,
      pushNotifications: true,
      medicationReminders: true,
      appointmentReminders: true,
      reminderTimes: ["09:00", "13:00", "18:00"],
      createdAt: serverTimestamp() as Timestamp,
    };

    await setDoc(settingsRef, settingsData);
    return settingsData;
  } catch (error) {
    console.error("Error creating notification settings:", error);
    throw new Error("Failed to create notification settings");
  }
};

export const getNotificationSettings = async (userId: string): Promise<NotificationSettings | null> => {
  try {
    const settingsRef = doc(db, "notificationSettings", userId);
    const settingsSnap = await getDoc(settingsRef);

    if (settingsSnap.exists()) {
      return settingsSnap.data() as NotificationSettings;
    }
    return null;
  } catch (error) {
    console.error("Error getting notification settings:", error);
    return null;
  }
};

export const updateNotificationSettings = async (userId: string, data: Partial<NotificationSettings>) => {
  try {
    const settingsRef = doc(db, "notificationSettings", userId);
    const updateData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updateData[key] = value === null ? null : value;
      }
    }
    await updateDoc(settingsRef, updateData);
  } catch (error) {
    console.error("Error updating notification settings:", error);
    throw new Error("Failed to update notification settings");
  }
};

export const addAppointment = async (
  userId: string,
  appointment: Omit<Appointment, "id" | "userId" | "createdAt" | "updatedAt">,
) => {
  try {
    const appointmentsRef = collection(db, "appointments");
    
    // Clean the appointment data to remove undefined values
    const cleanedAppointment = Object.fromEntries(
      Object.entries(appointment).filter(([_, value]) => value !== undefined)
    ) as Omit<Appointment, "id" | "userId" | "createdAt" | "updatedAt">;
    
    const appointmentData: Omit<Appointment, "id"> = {
      userId,
      ...cleanedAppointment,
      status: appointment.status || "scheduled",
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    const docRef = await addDoc(appointmentsRef, appointmentData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding appointment:", error);
    throw new Error("Failed to add appointment");
  }
};

export const getUserAppointments = async (userId: string): Promise<Appointment[]> => {
  try {
    const appointmentsRef = collection(db, "appointments");
    const q = query(appointmentsRef, where("userId", "==", userId), limit(50));

    const querySnapshot = await getDocs(q);
    const appointments = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Appointment,
    );

    return appointments.sort((a, b) => {
      const aTime = new Date(`${a.date} ${a.time}`).getTime();
      const bTime = new Date(`${b.date} ${b.time}`).getTime();
      return bTime - aTime;
    });
  } catch (error) {
    console.error("Error getting appointments:", error);
    return [];
  }
};

export const updateAppointment = async (appointmentId: string, data: Partial<Appointment>) => {
  try {
    const docRef = doc(db, "appointments", appointmentId);
    const updateData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updateData[key] = value === null ? null : value;
      }
    }
    updateData.updatedAt = serverTimestamp();
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating appointment:", error);
    throw new Error("Failed to update appointment");
  }
};

export const deleteAppointment = async (appointmentId: string) => {
  try {
    const appointmentRef = doc(db, "appointments", appointmentId);
    await deleteDoc(appointmentRef);
  } catch (error) {
    console.error("Error deleting appointment:", error);
    throw new Error("Failed to delete appointment");
  }
};

export const subscribeToUserAppointments = (
  userId: string,
  callback: (appointments: Appointment[]) => void,
) => {
  try {
    const appointmentsRef = collection(db, "appointments");
    const q = query(appointmentsRef, where("userId", "==", userId), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appointments = snapshot.docs
        .map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Appointment,
        )
        .sort((a, b) => {
          const aTime = new Date(`${a.date} ${a.time}`).getTime();
          const bTime = new Date(`${b.date} ${b.time}`).getTime();
          return bTime - aTime;
        });
      callback(appointments);
    });

    return unsubscribe;
  } catch (error) {
    console.error("Error subscribing to appointments:", error);
    return () => {};
  }
};

export const uploadHealthRecordAttachment = async (userId: string, recordId: string, file: File): Promise<string> => {
  try {
    const storageRef = ref(storage, `healthRecords/${userId}/${recordId}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    const recordRef = doc(db, "healthRecords", recordId);
    const recordSnap = await getDoc(recordRef);
    if (recordSnap.exists()) {
      const recordData = recordSnap.data() as HealthRecord;
      const updatedAttachments = [...(recordData.attachments || []), downloadURL];
      await updateDoc(recordRef, { attachments: updatedAttachments });
    }

    return downloadURL;
  } catch (error) {
    console.error("Error uploading health record attachment:", error);
    throw new Error("Failed to upload health record attachment");
  }
};