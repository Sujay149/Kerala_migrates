"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Menu, User, Palette, Bell, Shield, Database, Camera, AlertCircle, Image } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { updateUserProfile, type UserProfile as FirestoreUserProfile } from "@/lib/firestore";
import { toast } from "sonner";
import { deleteUser } from 'firebase/auth'
import { doc, deleteDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

// 🔒 Type Definitions
type ExtendedPreferences = {
  theme: "dark" | "light";
  notifications: boolean;
  emailNotifications: boolean;
  medicationReminders: boolean;
  appointmentReminders: boolean;
  healthTips: boolean;
  pushNotifications: boolean;
  shareDataForResearch: boolean;
  analytics: boolean;
  saveConversations: boolean;
};

type ExtendedUserProfile = Omit<FirestoreUserProfile, "preferences"> & {
  preferences: ExtendedPreferences;
};

// Validation regex patterns
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;
const NAME_REGEX = /^[a-zA-Z\s-]{2,50}$/;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export default function ProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const { user, userProfile } = useAuth() as {
    user: any;
    userProfile: ExtendedUserProfile | null;
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    phoneNumber: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    allergies: "",
    conditions: "",
    bloodType: "",
    preferences: {
      theme: "dark" as "dark" | "light",
      notifications: true,
      emailNotifications: true,
      medicationReminders: true,
      appointmentReminders: true,
      healthTips: false,
      pushNotifications: true,
      shareDataForResearch: false,
      analytics: true,
      saveConversations: true,
    },
  });

  // ⏬ Initialize form with user profile data
  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || "",
        email: userProfile.email || "",
        dateOfBirth: userProfile.dateOfBirth || "",
        gender: userProfile.gender || "",
        phoneNumber: userProfile.phoneNumber || "",
        emergencyContactName: userProfile.emergencyContact?.name || "",
        emergencyContactPhone: userProfile.emergencyContact?.phone || "",
        emergencyContactRelationship: userProfile.emergencyContact?.relationship || "",
        allergies: userProfile.medicalInfo?.allergies?.join(", ") || "",
        conditions: userProfile.medicalInfo?.conditions?.join(", ") || "",
        bloodType: userProfile.medicalInfo?.bloodType || "",
        preferences: {
          theme: userProfile.preferences?.theme || "dark",
          notifications: userProfile.preferences?.notifications ?? true,
          emailNotifications: userProfile.preferences?.emailNotifications ?? true,
          medicationReminders: userProfile.preferences?.medicationReminders ?? true,
          appointmentReminders: userProfile.preferences?.appointmentReminders ?? true,
          healthTips: userProfile.preferences?.healthTips ?? false,
          pushNotifications: userProfile.preferences?.pushNotifications ?? true,
          shareDataForResearch: userProfile.preferences?.shareDataForResearch ?? false,
          analytics: userProfile.preferences?.analytics ?? true,
          saveConversations: userProfile.preferences?.saveConversations ?? true,
        },
      });
      setPreviewUrl(userProfile.photoURL || null);
      setLogoPreviewUrl(userProfile.customLogoURL || null);
    }
  }, [userProfile]);

  // ⏳ Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // 🔍 Validate form fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.displayName.match(NAME_REGEX)) {
      newErrors.displayName = "Display name must be 2-50 characters, letters only";
    }

    if (formData.phoneNumber && !formData.phoneNumber.match(PHONE_REGEX)) {
      newErrors.phoneNumber = "Invalid phone number format (e.g., +1234567890)";
    }

    if (formData.emergencyContactPhone && !formData.emergencyContactPhone.match(PHONE_REGEX)) {
      newErrors.emergencyContactPhone = "Invalid emergency contact phone format";
    }

    if (formData.emergencyContactName && !formData.emergencyContactName.match(NAME_REGEX)) {
      newErrors.emergencyContactName = "Contact name must be 2-50 characters, letters only";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✍️ Handle form input changes
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasUnsavedChanges(true);
  };

  // ⚙️ Handle preference changes
  const handlePreferenceChange = (key: string, value: boolean | string) => {
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }));
    setHasUnsavedChanges(true);
  };

  // 📸 Handle profile picture change
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setSelectedImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setHasUnsavedChanges(true);
  };

  // 🎨 Handle custom logo change
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Logo file size must be less than 2MB");
      return;
    }

    setSelectedLogoFile(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
    setHasUnsavedChanges(true);
  };

  // 💾 Update profile in Firestore
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validateForm()) {
      toast.error("Please fix form errors before submitting");
      return;
    }

    setLoading(true);
    try {
      const updateData: Partial<ExtendedUserProfile> = {
        displayName: formData.displayName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        phoneNumber: formData.phoneNumber,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelationship,
        },
        medicalInfo: {
          allergies: formData.allergies
            .split(",")
            .map((a) => a.trim())
            .filter((a) => a),
          conditions: formData.conditions
            .split(",")
            .map((c) => c.trim())
            .filter((c) => c),
          bloodType: formData.bloodType,
        },
        preferences: formData.preferences,
      };

      // ⬆️ Upload image to Cloudinary if selected
      if (selectedImageFile) {
        setUploadingPhoto(true);
        const imageForm = new FormData();
        imageForm.append("file", selectedImageFile);
        imageForm.append("upload_preset", "MigrantBot_uploads");

        const res = await fetch("https://api.cloudinary.com/v1_1/dygmrde1v/image/upload", {
          method: "POST",
          body: imageForm,
        });

        const data = await res.json();
        if (!data.secure_url) throw new Error("Cloudinary upload failed");
        updateData.photoURL = data.secure_url;
      }

      // 🎨 Upload custom logo to Cloudinary if selected
      if (selectedLogoFile) {
        setUploadingLogo(true);
        const logoForm = new FormData();
        logoForm.append("file", selectedLogoFile);
        logoForm.append("upload_preset", "MigrantBot_uploads");

        const logoRes = await fetch("https://api.cloudinary.com/v1_1/dygmrde1v/image/upload", {
          method: "POST",
          body: logoForm,
        });

        const logoData = await logoRes.json();
        if (!logoData.secure_url) throw new Error("Logo upload failed");
        updateData.customLogoURL = logoData.secure_url;
      }

      await updateUserProfile(user.uid, updateData);
      setHasUnsavedChanges(false);
      setSelectedImageFile(null);
      setSelectedLogoFile(null);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      
      // Provide user-friendly error messages
      let errorMessage = "Failed to update profile";
      if (error instanceof Error) {
        // Use the specific error message from the updated updateUserProfile function
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setUploadingPhoto(false);
      setUploadingLogo(false);
    }
  };

  // 📤 Export user data
  const handleExportData = () => {
    const exportData = {
      profile: userProfile,
      exportDate: new Date().toISOString(),
      note: "This is your MigrantBot data export",
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MigrantBot-data-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Data exported successfully!");
  };

  // 🗑️ Clear user data (placeholder)
  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear all your data? This action cannot be undone.")) {
      toast.success("Data clearing initiated. This feature will be implemented soon.");
    }
  };

  return (
    <AuthGuard>
      <div className="bg-background text-foreground min-h-screen">
        <div className="flex h-screen overflow-hidden">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-card">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="text-muted-foreground lg:hidden h-10 w-10"
                  aria-label="Open sidebar"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="font-semibold text-lg">Profile Settings</h1>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Profile Settings */}
                <Card className="bg-card border-border rounded-xl shadow">
                  <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                    <User className="h-5 w-5 text-muted-foreground mr-2" />
                    <CardTitle className="text-foreground">Profile Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      {/* Profile Picture */}
                      <div className="flex items-center space-x-6">
                        <Avatar className="w-20 h-20">
                          <AvatarImage src={previewUrl || userProfile?.photoURL || ""} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                            {formData.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Button
                            type="button"
                            variant="outline"
                            className="bg-muted border-border text-foreground hover:bg-primary hover:text-primary-foreground"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingPhoto}
                            aria-label="Change profile picture"
                          >
                            {uploadingPhoto ? (
                              <>
                                <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin mr-2" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Camera className="mr-2 h-4 w-4" />
                                Change Photo
                              </>
                            )}
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                            aria-hidden="true"
                          />
                          <p className="text-muted-foreground text-sm mt-2">JPG, PNG, or GIF. Max size 2MB.</p>
                        </div>
                      </div>

                      {/* Custom Logo */}
                      <div className="flex items-center space-x-6">
                        <div className="w-20 h-20 flex items-center justify-center bg-muted rounded-lg border-2 border-dashed border-border">
                          {logoPreviewUrl ? (
                            <img 
                              src={logoPreviewUrl} 
                              alt="Custom logo preview" 
                              className="w-full h-full object-contain rounded-lg"
                            />
                          ) : (
                            <Image className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <Button
                            type="button"
                            variant="outline"
                            className="bg-muted border-border text-foreground hover:bg-primary hover:text-primary-foreground"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={uploadingLogo}
                            aria-label="Change custom logo"
                          >
                            {uploadingLogo ? (
                              <>
                                <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin mr-2" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Image className="mr-2 h-4 w-4" />
                                {logoPreviewUrl ? 'Change Logo' : 'Upload Logo'}
                              </>
                            )}
                          </Button>
                          <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                            aria-hidden="true"
                          />
                          <p className="text-muted-foreground text-sm mt-2">
                            Custom logo for your dashboard. JPG, PNG, or SVG. Max size 2MB.
                          </p>
                          {logoPreviewUrl && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 mt-1 p-0 h-auto"
                              onClick={() => {
                                setSelectedLogoFile(null);
                                setLogoPreviewUrl(null);
                                setHasUnsavedChanges(true);
                              }}
                            >
                              Remove Logo
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Basic Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="displayName" className="block text-sm font-medium text-muted-foreground mb-1">
                            Display Name
                          </label>
                          <Input
                            id="displayName"
                            value={formData.displayName}
                            onChange={(e) => handleInputChange("displayName", e.target.value)}
                            className="bg-muted border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Enter your display name"
                            aria-describedby="displayName-error"
                            required
                          />
                          {errors.displayName && (
                            <p id="displayName-error" className="text-red-500 text-xs mt-1">
                              {errors.displayName}
                            </p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">
                            Email Address
                          </label>
                          <Input
                            id="email"
                            value={formData.email}
                            disabled
                            className="bg-muted border-border text-muted-foreground"
                            aria-describedby="email-note"
                          />
                          <p id="email-note" className="text-muted-foreground text-xs mt-1">
                            Email cannot be changed
                          </p>
                        </div>
                      </div>

                      {/* Personal Information */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-muted-foreground mb-1">
                            Date of Birth
                          </label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                            className="bg-muted border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            max={new Date().toISOString().split("T")[0]}
                          />
                        </div>
                        <div>
                          <label htmlFor="gender" className="block text-sm font-medium text-muted-foreground mb-1">
                            Gender
                          </label>
                          <Select
                            value={formData.gender}
                            onValueChange={(value) => handleInputChange("gender", value)}
                          >
                            <SelectTrigger
                              id="gender"
                              className="bg-muted border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              aria-label="Select gender"
                            >
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground shadow-lg">
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label htmlFor="phoneNumber" className="block text-sm font-medium text-muted-foreground mb-1">
                            Phone Number
                          </label>
                          <Input
                            id="phoneNumber"
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                            className="bg-muted border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="+1234567890"
                            aria-describedby="phoneNumber-error"
                          />
                          {errors.phoneNumber && (
                            <p id="phoneNumber-error" className="text-red-500 text-xs mt-1">
                              {errors.phoneNumber}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Emergency Contact */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-foreground">Emergency Contact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label htmlFor="emergencyContactName" className="block text-sm font-medium text-muted-foreground mb-1">
                              Contact Name
                            </label>
                            <Input
                              id="emergencyContactName"
                              value={formData.emergencyContactName}
                              onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                              className="bg-muted border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="Emergency contact name"
                              aria-describedby="emergencyContactName-error"
                            />
                            {errors.emergencyContactName && (
                              <p id="emergencyContactName-error" className="text-red-500 text-xs mt-1">
                                {errors.emergencyContactName}
                              </p>
                            )}
                          </div>
                          <div>
                            <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-muted-foreground mb-1">
                              Contact Phone
                            </label>
                            <Input
                              id="emergencyContactPhone"
                              type="tel"
                              value={formData.emergencyContactPhone}
                              onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                              className="bg-muted border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="+1234567890"
                              aria-describedby="emergencyContactPhone-error"
                            />
                            {errors.emergencyContactPhone && (
                              <p id="emergencyContactPhone-error" className="text-red-500 text-xs mt-1">
                                {errors.emergencyContactPhone}
                              </p>
                            )}
                          </div>
                          <div>
                            <label
                              htmlFor="emergencyContactRelationship"
                              className="block text-sm font-medium text-muted-foreground mb-1"
                            >
                              Relationship
                            </label>
                            <Input
                              id="emergencyContactRelationship"
                              value={formData.emergencyContactRelationship}
                              onChange={(e) => handleInputChange("emergencyContactRelationship", e.target.value)}
                              className="bg-muted border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="e.g., Parent, Spouse"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Medical Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-foreground">Medical Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="allergies" className="block text-sm font-medium text-muted-foreground mb-1">
                              Allergies
                            </label>
                            <Input
                              id="allergies"
                              value={formData.allergies}
                              onChange={(e) => handleInputChange("allergies", e.target.value)}
                              className="bg-muted border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="e.g., Penicillin, Peanuts (comma separated)"
                            />
                          </div>
                          <div>
                            <label htmlFor="conditions" className="block text-sm font-medium text-muted-foreground mb-1">
                              Medical Conditions
                            </label>
                            <Input
                              id="conditions"
                              value={formData.conditions}
                              onChange={(e) => handleInputChange("conditions", e.target.value)}
                              className="bg-muted border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="e.g., Diabetes, Hypertension (comma separated)"
                            />
                          </div>
                        </div>
                        <div className="w-full md:w-1/3">
                          <label htmlFor="bloodType" className="block text-sm font-medium text-muted-foreground mb-1">
                            Blood Type
                          </label>
                          <Select
                            value={formData.bloodType}
                            onValueChange={(value) => handleInputChange("bloodType", value)}
                          >
                            <SelectTrigger
                              id="bloodType"
                              className="bg-muted border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              aria-label="Select blood type"
                            >
                              <SelectValue placeholder="Select blood type" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground shadow-lg">
                              <SelectItem value="A+">A+</SelectItem>
                              <SelectItem value="A-">A-</SelectItem>
                              <SelectItem value="B+">B+</SelectItem>
                              <SelectItem value="B-">B-</SelectItem>
                              <SelectItem value="AB+">AB+</SelectItem>
                              <SelectItem value="AB-">AB-</SelectItem>
                              <SelectItem value="O+">O+</SelectItem>
                              <SelectItem value="O-">O-</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={loading || Object.keys(errors).length > 0}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold w-full"
                        aria-label="Update profile"
                      >
                        {loading ? "Updating..." : "Update Profile"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Notifications */}
                <Card className="bg-card border-border rounded-xl shadow">
                  <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                    <Bell className="h-5 w-5 text-muted-foreground mr-2" />
                    <CardTitle className="text-foreground">Notifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Medication Reminders</p>
                        <p className="text-muted-foreground text-sm">Get notified to take your medications</p>
                      </div>
                      <Switch
                        checked={formData.preferences.medicationReminders}
                        onCheckedChange={(checked) => handlePreferenceChange("medicationReminders", checked)}
                        aria-label="Toggle medication reminders"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Appointment Reminders</p>
                        <p className="text-muted-foreground text-sm">Reminders for upcoming medical appointments</p>
                      </div>
                      <Switch
                        checked={formData.preferences.appointmentReminders}
                        onCheckedChange={(checked) => handlePreferenceChange("appointmentReminders", checked)}
                        aria-label="Toggle appointment reminders"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Health Tips</p>
                        <p className="text-muted-foreground text-sm">General health tips and wellness advice</p>
                      </div>
                      <Switch
                        checked={formData.preferences.healthTips}
                        onCheckedChange={(checked) => handlePreferenceChange("healthTips", checked)}
                        aria-label="Toggle health tips"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Email Notifications</p>
                        <p className="text-muted-foreground text-sm">Receive notifications via email</p>
                      </div>
                      <Switch
                        checked={formData.preferences.emailNotifications}
                        onCheckedChange={(checked) => handlePreferenceChange("emailNotifications", checked)}
                        aria-label="Toggle email notifications"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Push Notifications</p>
                        <p className="text-muted-foreground text-sm">Receive push notifications on your device</p>
                      </div>
                      <Switch
                        checked={formData.preferences.pushNotifications}
                        onCheckedChange={(checked) => handlePreferenceChange("pushNotifications", checked)}
                        aria-label="Toggle push notifications"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Privacy & Security */}
                <Card className="bg-card border-border rounded-xl shadow">
                  <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                    <Shield className="h-5 w-5 text-muted-foreground mr-2" />
                    <CardTitle className="text-foreground">Privacy & Security</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Share Data for Research</p>
                        <p className="text-muted-foreground text-sm">Help improve healthcare by sharing anonymized data</p>
                      </div>
                      <Switch
                        checked={formData.preferences.shareDataForResearch}
                        onCheckedChange={(checked) => handlePreferenceChange("shareDataForResearch", checked)}
                        aria-label="Toggle data sharing for research"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Save Conversations</p>
                        <p className="text-muted-foreground text-sm">Keep chat history for future reference</p>
                      </div>
                      <Switch
                        checked={formData.preferences.saveConversations}
                        onCheckedChange={(checked) => handlePreferenceChange("saveConversations", checked)}
                        aria-label="Toggle save conversations"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Data Management */}
                <Card className="bg-card border-border rounded-xl shadow">
                  <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                    <Database className="h-5 w-5 text-muted-foreground mr-2" />
                    <CardTitle className="text-foreground">Data Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                      <Button
                        onClick={handleExportData}
                        variant="outline"
                        className="bg-muted border-border text-foreground hover:bg-primary hover:text-primary-foreground"
                        aria-label="Export my data"
                      >
                        📤 Export My Data
                      </Button>
                      <Button
                        onClick={handleClearData}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        aria-label="Clear all data"
                      >
                        🗑️ Clear All Data
                      </Button>
                    </div>
                    <p className="text-muted-foreground">
                      Export your data to keep a backup, or clear all your data to start fresh.
                    </p>
                  </CardContent>
                </Card>
                {/* Delete Account */}
                <Card className="bg-card border-border rounded-xl shadow">
                  <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                    <User className="h-5 w-5 text-muted-foreground mr-2" />
                    <CardTitle className="text-foreground">Delete Account</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
                    <div className="flex gap-3">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            aria-label="Delete account"
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Delete my account
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <div className="flex items-center space-x-3">
                              <AlertCircle className="w-6 h-6 text-red-600" />
                              <AlertDialogTitle>Delete account</AlertDialogTitle>
                            </div>
                            <AlertDialogDescription>
                              This will permanently delete your account and all associated data. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <div className="mt-4">
                            <p className="text-sm text-muted-foreground mb-2">
                              Type "delete my account" to confirm.
                            </p>
                            <Input
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                              placeholder='Type: delete my account'
                              aria-label="Type to confirm account deletion"
                              className="w-full"
                            />
                          </div>

                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              disabled={deleteConfirmText.trim().toLowerCase() !== "delete my account"}
                              onClick={async () => {
                                if (!user) {
                                  toast.error("No authenticated user")
                                  return
                                }
                                try {
                                  // delete Firestore user doc
                                  const userRef = doc(db, "users", user.uid)
                                  await deleteDoc(userRef)
                                  // delete Firebase Auth user
                                  await deleteUser(user)
                                  setDeleteConfirmText("")
                                  toast.success("Account deleted — redirecting to home")
                                  window.location.href = "/"
                                } catch (err: any) {
                                  console.error("Failed to delete account", err)
                                  if (err?.code === "auth/requires-recent-login") {
                                    // Inform user reauth is required
                                    toast.error("Account deletion failed: recent authentication required. Please sign in again and retry.")
                                  } else {
                                    toast.error(err?.message || "Failed to delete account")
                                  }
                                }
                              }}
                            >
                              Delete account
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}