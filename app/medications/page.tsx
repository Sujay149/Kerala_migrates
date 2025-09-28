"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Menu, Plus, Pill, Clock, Trash2, Edit, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
  import { getMessaging, getToken, onMessage } from "firebase/messaging";
  import {  setDoc } from "firebase/firestore";
import {
  addMedication,
  updateMedication,
  deleteMedication,
  subscribeToUserMedications,
  sendMedicationReminder,
  type Medication,
} from "@/lib/firestore";
import { toast } from "sonner";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function MedicationsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "",
    startDate: "",
    endDate: "",
    notes: "",
    reminderTimes: [""],
  });
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();
  const reminderTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // FCM token collection and saving logic

  useEffect(() => {
    async function saveFcmToken(userId: string) {
      try {
        console.log("Requesting notification permission...");
        const messaging = getMessaging();
        const permission = await Notification.requestPermission();
        console.log("Notification permission:", permission);
        
        // Register service worker
        if ('serviceWorker' in navigator) {
          try {
            // Force update by unregistering first
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
              if (registration.scope.includes('firebase-messaging-sw')) {
                await registration.unregister();
              }
            }
            
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
              updateViaCache: 'none'
            });
            console.log('Service Worker registered:', registration);
            
            // Wait for service worker to be ready
            await navigator.serviceWorker.ready;
            console.log('Service Worker is ready');
          } catch (swError) {
            console.error('Service Worker registration failed:', swError);
          }
        }
        
        if (permission === "granted") {
          try {
            console.log("Getting FCM token...");
            const fcmToken = await getToken(messaging, { vapidKey: "BMxZwmRm6QusAkd3tzvysDAZB8ReTuJVSQQHdc50nh6WCkN4Ja11FPpKLNwJuHKZUJwzsyKIciT1yKLpePHLDaE" });
            console.log("FCM token received:", fcmToken ? "Yes" : "No");
            
            if (fcmToken) {
              await setDoc(doc(db, "users", userId), { fcmToken }, { merge: true });
              console.log("FCM token saved to Firestore");
              
              // Handle foreground messages
              onMessage(messaging, (payload) => {
                console.log('Foreground FCM message received:', payload);
                
                // Show browser notification for foreground messages
                if (Notification.permission === 'granted') {
                  const title = payload.notification?.title || payload.data?.title || 'MediBot Reminder';
                  const body = payload.notification?.body || payload.data?.body || 'You have a medication reminder';
                  
                  console.log('Showing foreground notification:', title, body);
                  
                  const notification = new Notification(title, {
                    body: body,
                    icon: '/kerala-digital-health-logo.svg',
                    tag: 'medication-reminder-fg-' + Date.now(),
                    requireInteraction: true
                  });
                  
                  // Auto close after 10 seconds
                  setTimeout(() => {
                    notification.close();
                  }, 10000);
                }
              });
            } else {
              console.error("No FCM token received");
            }
          } catch (fcmError) {
            console.warn("FCM token setup failed:", fcmError);
            // Continue without FCM functionality
          }
        } else {
          console.warn("Notification permission not granted:", permission);
        }
      } catch (err) {
        console.error("FCM token error:", err);
      }
    }
    if (user?.uid) {
      saveFcmToken(user.uid);
    }
  }, [user]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle app focus/wake up to reschedule any missed reminders
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.email) {
        console.log("🔄 App focused - checking for missed reminders...");
        
        // Reschedule all active medications when app becomes visible
        medications.forEach((med) => {
          if (med.reminderTimes.length) {
            // Cancel existing timers and reschedule
            cancelBrowserReminders(med.id!);
            scheduleBrowserReminders(med, user.email!);
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also handle window focus for additional reliability
    const handleFocus = () => {
      if (user?.email) {
        setTimeout(() => {
          medications.forEach((med) => {
            if (med.reminderTimes.length) {
              cancelBrowserReminders(med.id!);
              scheduleBrowserReminders(med, user.email!);
            }
          });
        }, 1000); // Small delay to ensure medications are loaded
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [medications, user]);

  const sendMobileNotification = async (userId: string, title: string, body: string) => {
  try {
    // Fetch user's FCM token from Firestore
    const userDoc = await getDoc(doc(db, "users", userId));
    const fcmToken = userDoc.data()?.fcmToken;
    console.log("FCM token found:", fcmToken ? "Yes" : "No");
    
    if (!fcmToken) {
      console.log("⚠️ No FCM token found for user - push notifications not available");
      // Don't throw error, just log and return success
      return { success: true, message: "Push notifications not configured for this user" };
    }

    // Call backend API to send push notification
    console.log("Sending push notification:", { title, body });
    const response = await fetch("/api/send-push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: fcmToken, title, body }),
    });
    const result = await response.json();
    console.log("Push notification result:", result);
    
    if (!result.success) {
      console.log("⚠️ Push notification failed:", result.error);
      return { success: true, message: "Push notification service temporarily unavailable" };
    }
    
    console.log("✅ Push notification sent successfully");
    return { success: true, message: "Push notification sent" };
  } catch (err) {
    console.error("Push notification error:", err);
    // Don't show error toast, just log and continue
    console.log("⚠️ Push notification failed, but continuing with medication save");
    return { success: true, message: "Push notification service unavailable" };
  }
  };

  const sendEmailNotification = async (
    email: string, 
    subject: string, 
    body: string, 
    medicationName?: string,
    dosage?: string,
    instructions?: string
  ) => {
    try {
      console.log("📧 Sending Web3Forms email to:", email);
      console.log("📋 Subject:", subject);
      console.log("💊 Medication:", medicationName || 'N/A');
      console.log("💊 Dosage:", dosage || 'N/A');
      
      if (!email || !email.includes('@')) {
        throw new Error("Invalid email address provided");
      }
      
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          to: email, 
          subject, 
          message: body,
          medicationName: medicationName,
          dosage: dosage,
          instructions: instructions,
          userName: user?.displayName || user?.email?.split('@')[0] || 'Dear User'
        }),
      });

      console.log("📬 Response status:", response.status);
      console.log("✅ Response ok:", response.ok);
      
      const result = await response.json();
      console.log("🌐 Web3Forms API response:", result);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.error || result.message || "Failed to send email"}`);
      }
      
      if (!result.success) {
        throw new Error(result.error || result.message || "Email sending was not successful");
      }
      
      console.log("Email sent successfully to:", email);
      return result;
    } catch (error) {
      console.error("Error sending email notification:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to send email notification: ${errorMessage}`);
      throw error; // Re-throw to let calling function handle it
    }
  };

  const scheduleReminders = async (medication: Medication, email: string) => {
    if (!medication.id || !medication.reminderTimes.length || !user?.uid) return;

    try {
      console.log("🔔 Scheduling hybrid reminders for:", medication.name);
      
      // Store reminders in Firestore for backup/sync
      const response = await fetch("/api/schedule-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          medicationId: medication.id,
          reminderTimes: medication.reminderTimes,
          medicationName: medication.name,
          dosage: medication.dosage
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log("✅ Server-side backup scheduled:", medication.name);
        
        // Also schedule precise browser-based reminders
        scheduleBrowserReminders(medication, email);
        
        toast.success(`Reminders scheduled for ${medication.name}`);
      } else {
        console.error("❌ Failed to schedule server backup:", result.error);
        // Still schedule browser reminders even if server fails
        scheduleBrowserReminders(medication, email);
        toast.warning(`Reminders scheduled locally for ${medication.name}`);
      }
    } catch (error) {
      console.error("❌ Error scheduling reminders:", error);
      // Fallback to browser-only scheduling
      scheduleBrowserReminders(medication, email);
      toast.warning("Reminders scheduled locally only");
    }
  };

  const scheduleBrowserReminders = (medication: Medication, email: string) => {
    if (!medication.id || !medication.reminderTimes.length) return;

    // Cancel existing browser reminders
    cancelBrowserReminders(medication.id);

    medication.reminderTimes.forEach((time, index) => {
      const [hours, minutes] = time.split(":").map(Number);
      
      const scheduleNext = () => {
        const now = new Date();
        const reminder = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

        // If time has passed today, schedule for tomorrow
        if (reminder <= now) {
          reminder.setDate(reminder.getDate() + 1);
        }

        const delay = reminder.getTime() - now.getTime();
        console.log(`⏰ Next ${medication.name} reminder in ${Math.round(delay / 1000 / 60)} minutes`);

        const timeoutId = setTimeout(async () => {
          const message = `💊 Time to take your ${medication.name} (${medication.dosage})`;
          
          try {
            // Send both mobile push and email notifications with detailed medication info
            await Promise.all([
              sendMobileNotification(user!.uid, `Medication Reminder: ${medication.name}`, message),
              sendEmailNotification(
                email, 
                `Medication Reminder: ${medication.name}`, 
                message, 
                medication.name, 
                medication.dosage,
                medication.notes || 'Take as prescribed'
              ),
            ]);
            
            console.log("✅ Reminder notifications sent for:", medication.name);
            
            // Schedule next day's reminder
            scheduleNext();
            
          } catch (err) {
            console.error("❌ Error sending notifications:", err);
            // Still schedule next reminder even if sending fails
            scheduleNext();
          }
        }, delay);

        reminderTimeouts.current.set(`${medication.id}-${index}`, timeoutId);
      };

      scheduleNext();
    });
  };

  const cancelBrowserReminders = (medicationId: string) => {
    reminderTimeouts.current.forEach((timeoutId, key) => {
      if (key.startsWith(medicationId)) {
        clearTimeout(timeoutId);
        reminderTimeouts.current.delete(key);
      }
    });
  };

  const cancelReminders = async (medicationId: string) => {
    try {
      console.log("🚫 Cancelling reminders for:", medicationId);
      
      // Cancel server-side reminders
      const response = await fetch("/api/schedule-reminder", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicationId }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log("✅ Server-side reminders cancelled");
      } else {
        console.error("❌ Failed to cancel server reminders:", result.error);
      }
    } catch (error) {
      console.error("❌ Error cancelling server reminders:", error);
    }
    
    // Always cancel browser-side reminders
    cancelBrowserReminders(medicationId);
  };

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserMedications(user.uid, (meds) => {
      setMedications(meds);
      setLoading(false);
      
      console.log("🔍 User authentication details:", {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      });

      meds.forEach((med) => {
        if (med.reminderTimes.length && user.email) {
          console.log(`📧 Scheduling reminders for ${med.name} to email: ${user.email}`);
          scheduleReminders(med, user.email);
        } else {
          console.warn(`⚠️ No email or reminder times for ${med.name}:`, {
            reminderTimes: med.reminderTimes.length,
            userEmail: user.email
          });
        }
      });
    });

    return () => {
      unsubscribe();
      // Clean up all browser-based timeouts
      reminderTimeouts.current.forEach((timeoutId) => clearTimeout(timeoutId));
      reminderTimeouts.current.clear();
    };
  }, [user]);

  const filteredMedications = medications.filter((med) =>
    [
      med.name,
      med.dosage,
      med.frequency,
      med.notes || "",
      med.startDate,
      med.endDate || "",
      ...med.reminderTimes,
    ].some((field) => field.toLowerCase().includes(search.toLowerCase().trim()))
  );

  const resetForm = () => {
    setFormData({
      name: "",
      dosage: "",
      frequency: "",
      startDate: "",
      endDate: "",
      notes: "",
      reminderTimes: [""],
    });
    setEditingMedication(null);
  };

  const handleAddMedication = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEditMedication = (medication: Medication) => {
    setFormData({
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      startDate: medication.startDate,
      endDate: medication.endDate || "",
      notes: medication.notes || "",
      reminderTimes: medication.reminderTimes.length ? medication.reminderTimes : [""],
    });
    setEditingMedication(medication);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    try {
      const medicationData: any = {
        name: formData.name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        notes: formData.notes || "",
        reminderTimes: formData.reminderTimes.filter(time => time.trim() !== ""),
        isActive: true,
      };

      let medicationId: string;

      if (editingMedication && editingMedication.id) {
        await updateMedication(editingMedication.id, medicationData);
        medicationId = editingMedication.id;
        toast.success("Medication updated successfully!");
      } else {
        medicationId = await addMedication(user.uid, medicationData);
        toast.success("Medication added successfully!");
      }

      const message = `Your medication ${medicationData.name} (${medicationData.dosage}) has been ${editingMedication ? "updated" : "added"} successfully.`;
      const notifications = [
        sendMobileNotification(user.uid, "Medication Saved", message),
        user.email ? sendEmailNotification(user.email, "Medication Saved", message) : Promise.resolve(),
      ];
      await Promise.all(notifications);

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const notifications = [
        sendMobileNotification(user.uid, "Medication Save Error", `Failed to save medication: ${errorMessage}`),
        user.email ? sendEmailNotification(user.email, "Medication Save Error", `Failed to save medication: ${errorMessage}`) : Promise.resolve(),
      ];
      await Promise.all(notifications);
      toast.error(`Failed to save medication: ${errorMessage}`);
    }
  };

  const handleDeleteMedication = async (medicationId: string) => {
    try {
      await deleteMedication(medicationId);
      cancelReminders(medicationId);
      toast.success("Medication deleted successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (user) {
        const medication = medications.find((m) => m.id === medicationId);
        const notifications = [
          sendMobileNotification(user.uid, "Medication Delete Error", `Failed to delete medication: ${errorMessage}`),
          user.email ? sendEmailNotification(user.email, "Medication Delete Error", `Failed to delete medication: ${errorMessage}`) : Promise.resolve(),
        ];
        await Promise.all(notifications);
      }
      toast.error(`Failed to delete medication: ${errorMessage}`);
    }
  };

  const addReminderTime = () => {
    setFormData({
      ...formData,
      reminderTimes: [...formData.reminderTimes, ""],
    });
  };

  const updateReminderTime = (index: number, time: string) => {
    const newTimes = [...formData.reminderTimes];
    newTimes[index] = time;
    setFormData({
      ...formData,
      reminderTimes: newTimes,
    });
  };

  const removeReminderTime = (index: number) => {
    const newTimes = formData.reminderTimes.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      reminderTimes: newTimes.length > 0 ? newTimes : [""],
    });
  };

  const testReminder = async (medication: Medication) => {
    try {
      if (!user) {
        toast.error("User not authenticated");
        return;
      }
      
      // Debug logs to check user email
      console.log("Current user:", user);
      console.log("User email:", user.email);
      
      const message = `🧪 This is a medication reminder for your medication ${medication.name} (${medication.dosage}). 💊`;
      const notifications = [
        sendMobileNotification(user.uid, "Medication Reminder", message),
        user.email ? sendEmailNotification(user.email, "Medication Reminder", message) : Promise.resolve(),
      ];
      await Promise.all(notifications);
      toast.success("Notifications sent successfully! 📱📧");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (user) {
        const notifications = [
          sendMobileNotification(user.uid, " Reminder Error", `Failed to send  reminder for ${medication.name}: ${errorMessage}`),
          user.email ? sendEmailNotification(user.email, " Reminder Error", `Failed to send  reminder for ${medication.name}: ${errorMessage}`) : Promise.resolve(),
        ];
        await Promise.all(notifications);
      }
      toast.error(`Failed to send  notifications: ${errorMessage}`);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return isMobile
      ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const formatTime = (time: string) => (isMobile ? time.replace(/:00$/, "") : time);



  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-white dark:bg-[#0e1a2b] text-black dark:text-white">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 overflow-y-auto px-4 pt-10 max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#a855f7]">Manage Your Medications</h1>
            <p className="text-muted-foreground mt-1 mb-6">Track your medications and set reminders</p>
           
          </div>

          <div className="relative max-w-2xl mx-auto mb-8">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by medication, dosage, frequency, or notes..."
              className="w-full pl-10 pr-4 py-3 rounded-full bg-card text-foreground placeholder-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="absolute top-1/2 left-3 transform -translate-y-1/2 text-muted-foreground">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.62-5.88a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="max-w-5xl mx-auto mb-10 px-4">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 order-1 md:order-none">
                <div className="w-full h-auto overflow-hidden rounded-[3rem] shadow-xl flex justify-center items-center">
                  <img
                    src="/medicationimg.png"
                    alt="Medication Reminder"
                    className="max-w-full h-auto object-contain"
                  />
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-[#a855f7] mb-3">
                  Never Miss a Dose Again
                </h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Stay on top of your health with smart medication reminders. Set schedules, receive alerts, and track your daily intake – all in one place.
                </p>
                <Button
                  onClick={handleAddMedication}
                  className="bg-[#a855f7] hover:bg-teal-600 dark:bg-[#a855f7] dark:hover:bg-teal-600 text-white rounded-lg text-sm px-4 py-2"
                >
                  <Plus className="mr-1 h-4 w-4" /> Set a Reminder
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-10 mb-4">
            <h2 className="text-xl font-semibold text-foreground">Your Medications</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={handleAddMedication}
                  className="bg-[#a855f7] hover:bg-teal-600 dark:bg-[#a855f7] dark:hover:bg-teal-600 text-white rounded-lg text-sm px-4 py-2"
                >
                  <Plus className="mr-1 h-4 w-4" /> Add Medication
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">{editingMedication ? "Edit" : "New"} Medication</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Medication Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dosage" className="text-gray-700 dark:text-gray-300">Dosage</Label>
                      <Input
                        id="dosage"
                        value={formData.dosage}
                        onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                        placeholder="e.g., 500mg"
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="frequency" className="text-gray-700 dark:text-gray-300">Frequency</Label>
                      <Select
                        value={formData.frequency}
                        onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                      >
                        <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                          <SelectItem value="once-daily">Once daily</SelectItem>
                          <SelectItem value="twice-daily">Twice daily</SelectItem>
                          <SelectItem value="three-times-daily">Three times daily</SelectItem>
                          <SelectItem value="four-times-daily">Four times daily</SelectItem>
                          <SelectItem value="as-needed">As needed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate" className="text-gray-700 dark:text-gray-300">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate" className="text-gray-700 dark:text-gray-300">End Date (Optional)</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Reminder Times</Label>
                    {formData.reminderTimes.map((time, index) => (
                      <div key={index} className="flex items-center space-x-2 mt-2">
                        <Input
                          type="time"
                          value={time}
                          onChange={(e) => updateReminderTime(index, e.target.value)}
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white flex-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="HH:MM"
                        />
                        {formData.reminderTimes.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeReminderTime(index)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            aria-label="Remove reminder time"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={addReminderTime}
                      className="mt-2 text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Reminder Time
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-gray-700 dark:text-gray-300">Notes (Optional)</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes..."
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setDialogOpen(false)}
                      className="flex-1 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-[#a855f7] hover:bg-teal-600 dark:bg-[#a855f7] dark:hover:bg-teal-600 text-white"
                    >
                      {editingMedication ? "Update" : "Add"} Medication
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Loading medications...</div>
          ) : filteredMedications.length === 0 ? (
            <div className="text-center text-muted-foreground py-20">
              <Pill className="mx-auto mb-2 text-muted-foreground w-10 h-10" />
              No medications found. Try adding one or adjusting your search!
            </div>
          ) : (
            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold mb-2 text-[#a855f7] dark:text-[#a855f7]">Active Medications</h3>
                {filteredMedications.map((medication) => (
                  <Card key={medication.id} className="bg-card border-border rounded-lg mt-4 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-foreground font-semibold text-base">{medication.name}</h4>
                          <p className="text-muted-foreground text-sm">
                            {medication.dosage} • {medication.frequency} • {formatDate(medication.startDate)}
                            {medication.endDate && ` - ${formatDate(medication.endDate)}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {medication.reminderTimes.length > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => testReminder(medication)}
                              className="text-muted-foreground hover:text-teal-300 dark:hover:text-teal-500"
                              title=" Reminder"
                            >
                              <Bell className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditMedication(medication)}
                            className="text-muted-foreground hover:text-teal-300 dark:hover:text-teal-500"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => medication.id && handleDeleteMedication(medication.id)}
                            className="text-red-500 dark:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {medication.reminderTimes.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground mb-1">Reminder Times:</p>
                          <div className="flex flex-wrap gap-2">
                            {medication.reminderTimes.map((time, index) => (
                              <Badge key={index} className="bg-blue-600 dark:bg-blue-500 text-white text-xs">
                                {formatTime(time)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {medication.notes && (
                        <div className="mt-2 bg-muted text-muted-foreground p-2 rounded text-sm">
                          Note: {medication.notes}
                        </div>
                      )}
                      <div className="mt-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 dark:text-red-600 text-xs"
                          onClick={() => medication.id && handleDeleteMedication(medication.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </section>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}