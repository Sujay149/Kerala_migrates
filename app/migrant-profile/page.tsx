"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  File,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Trash2,
  Download,
  Menu,
  Phone,
  User,
  Users,
  Save,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/auth-guard";
import { Sidebar } from "@/components/sidebar";
import { toast } from "sonner";
import Link from "next/link";

interface MigrantProfile {
  name: string;
  mobileNumber: string;
  age: string;
  gender: string;
  occupation: string;
  language: string;
  state: string;
  district: string;
  policeStation: string;
  currentAddress: string;
  nativeAddress: string;
  primarySkill: string;
  secondarySkills: string[];
  experience: string;
  certifications: string[];
  emergencyContact: string;
  emergencyName: string;
  familySize: string;
  dependents: string;
  familyMembers?: {
    name: string;
    age: string;
    gender: string;
    bloodGroup: string;
    relation: string;
  }[];
}

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "pdf" | "document";
  description: string;
  status: "pending" | "uploading" | "uploaded" | "error";
  error?: string;
  timestamp: Date;
}

interface Submission {
  id: string;
  files: any[];
  status:
    | "draft"
    | "uploading"
    | "submitted"
    | "partial_approved"
    | "approved"
    | "rejected"
    | "pending";
  submittedAt?: Date;
  totalFiles: number;
  approvedFiles: number;
  rejectedFiles: number;
  pendingFiles: number;
}

const Header = ({ user, onMenuToggle }: { user: any; onMenuToggle: () => void }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return <header className="bg-slate-700 text-white p-4 shadow-lg"></header>;
};

const NavigationSidebar = ({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) => {
  const tabs = [
    { id: "skills", label: "Skills Details", icon: User },
    { id: "contact", label: "Alternate Contact Details", icon: Phone },
    { id: "family", label: "Family Details", icon: Users },
    // shorter label to match visual alignment with other tabs
    { id: "documents", label: "Documents", icon: Upload },
  ];

  return (
    <div className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-4">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Migrant Profile</h2>
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                // give tabs a consistent min width and center content so labels align
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors flex-shrink-0 whitespace-nowrap min-w-[150px] sm:min-w-[180px] text-sm md:text-base ${
                  activeTab === tab.id
                    ? "bg-cyan-500 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Icon className="h-5 w-5" />
                  <span className="text-center truncate max-w-[110px]">{tab.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const PersonalDetailsForm = ({
  profile,
  onProfileChange,
  isEditing,
}: {
  profile: MigrantProfile;
  onProfileChange: (field: keyof MigrantProfile, value: string) => void;
  isEditing: boolean;
}) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Personal Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="name">
              Migrant name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={profile.name}
              onChange={(e) => onProfileChange("name", e.target.value)}
              disabled={!isEditing}
              placeholder="Enter full name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="mobile">
              Migrant mobile number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="mobile"
              value={profile.mobileNumber}
              onChange={(e) => onProfileChange("mobileNumber", e.target.value)}
              disabled={!isEditing}
              placeholder="Enter mobile number"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="age">
              Age <span className="text-red-500">*</span>
            </Label>
            <Input
              id="age"
              value={profile.age}
              onChange={(e) => onProfileChange("age", e.target.value)}
              disabled={!isEditing}
              placeholder="Enter age"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="gender">
              Gender <span className="text-red-500">*</span>
            </Label>
            <Select
              value={profile.gender}
              onValueChange={(value) => onProfileChange("gender", value)}
              disabled={!isEditing}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="occupation">
              Occupation <span className="text-red-500">*</span>
            </Label>
            <Select
              value={profile.occupation}
              onValueChange={(value) => onProfileChange("occupation", value)}
              disabled={!isEditing}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select occupation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="construction">Construction Worker</SelectItem>
                <SelectItem value="domestic">Domestic Worker</SelectItem>
                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                <SelectItem value="agriculture">Agriculture</SelectItem>
                <SelectItem value="transportation">Transportation</SelectItem>
                <SelectItem value="hospitality">Hospitality</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="language">
              Migrant Language <span className="text-red-500">*</span>
            </Label>
            <Select
              value={profile.language}
              onValueChange={(value) => onProfileChange("language", value)}
              disabled={!isEditing}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="malayalam">Malayalam</SelectItem>
                <SelectItem value="tamil">Tamil</SelectItem>
                <SelectItem value="hindi">Hindi</SelectItem>
                <SelectItem value="bengali">Bengali</SelectItem>
                <SelectItem value="kannada">Kannada</SelectItem>
                <SelectItem value="telugu">Telugu</SelectItem>
                <SelectItem value="english">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AddressDetailsForm = ({
  profile,
  onProfileChange,
  isEditing,
}: {
  profile: MigrantProfile;
  onProfileChange: (field: keyof MigrantProfile, value: string) => void;
  isEditing: boolean;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Address Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Label htmlFor="state">
              Migrant state <span className="text-red-500">*</span>
            </Label>
            <Select
              value={profile.state}
              onValueChange={(value) => onProfileChange("state", value)}
              disabled={!isEditing}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kerala">Kerala</SelectItem>
                <SelectItem value="tamil-nadu">Tamil Nadu</SelectItem>
                <SelectItem value="karnataka">Karnataka</SelectItem>
                <SelectItem value="andhra-pradesh">Andhra Pradesh</SelectItem>
                <SelectItem value="telangana">Telangana</SelectItem>
                <SelectItem value="west-bengal">West Bengal</SelectItem>
                <SelectItem value="bihar">Bihar</SelectItem>
                <SelectItem value="uttar-pradesh">Uttar Pradesh</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="district">
              Migrant native district <span className="text-red-500">*</span>
            </Label>
            <Select
              value={profile.district}
              onValueChange={(value) => onProfileChange("district", value)}
              disabled={!isEditing}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thiruvananthapuram">Thiruvananthapuram</SelectItem>
                <SelectItem value="kollam">Kollam</SelectItem>
                <SelectItem value="pathanamthitta">Pathanamthitta</SelectItem>
                <SelectItem value="alappuzha">Alappuzha</SelectItem>
                <SelectItem value="kottayam">Kottayam</SelectItem>
                <SelectItem value="ernakulam">Ernakulam</SelectItem>
                <SelectItem value="thrissur">Thrissur</SelectItem>
                <SelectItem value="palakkad">Palakkad</SelectItem>
                <SelectItem value="malappuram">Malappuram</SelectItem>
                <SelectItem value="kozhikode">Kozhikode</SelectItem>
                <SelectItem value="wayanad">Wayanad</SelectItem>
                <SelectItem value="kannur">Kannur</SelectItem>
                <SelectItem value="kasaragod">Kasaragod</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="policeStation">
              Migrant native police station <span className="text-red-500">*</span>
            </Label>
            <Select
              value={profile.policeStation}
              onValueChange={(value) => onProfileChange("policeStation", value)}
              disabled={!isEditing}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select police station" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="museum">Museum Police Station</SelectItem>
                <SelectItem value="cantonment">Cantonment Police Station</SelectItem>
                <SelectItem value="fort">Fort Police Station</SelectItem>
                <SelectItem value="vellayambalam">Vellayambalam Police Station</SelectItem>
                <SelectItem value="pettah">Pettah Police Station</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="currentAddress">
              Current residence address in Kerala <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="currentAddress"
              value={profile.currentAddress}
              onChange={(e) => onProfileChange("currentAddress", e.target.value)}
              disabled={!isEditing}
              placeholder="Enter current address in Kerala"
              className="mt-1 min-h-[100px]"
            />
          </div>

          <div>
            <Label htmlFor="nativeAddress">
              Migrant native address <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="nativeAddress"
              value={profile.nativeAddress}
              onChange={(e) => onProfileChange("nativeAddress", e.target.value)}
              disabled={!isEditing}
              placeholder="Enter native address"
              className="mt-1 min-h-[100px]"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SkillsDetailsForm = ({
  profile,
  onProfileChange,
  isEditing,
}: {
  profile: MigrantProfile;
  onProfileChange: (field: keyof MigrantProfile, value: string) => void;
  isEditing: boolean;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills & Experience Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="primarySkill">
              Primary Skill <span className="text-red-500">*</span>
            </Label>
            <Select
              value={profile.primarySkill}
              onValueChange={(value) => onProfileChange("primarySkill", value)}
              disabled={!isEditing}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select primary skill" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="construction">Construction Work</SelectItem>
                <SelectItem value="carpentry">Carpentry</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="electrical">Electrical Work</SelectItem>
                <SelectItem value="painting">Painting</SelectItem>
                <SelectItem value="masonry">Masonry</SelectItem>
                <SelectItem value="welding">Welding</SelectItem>
                <SelectItem value="farming">Farming</SelectItem>
                <SelectItem value="housekeeping">Housekeeping</SelectItem>
                <SelectItem value="cooking">Cooking</SelectItem>
                <SelectItem value="driving">Driving</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="experience">
              Years of Experience <span className="text-red-500">*</span>
            </Label>
            <Select
              value={profile.experience}
              onValueChange={(value) => onProfileChange("experience", value)}
              disabled={!isEditing}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-1">0-1 years</SelectItem>
                <SelectItem value="1-3">1-3 years</SelectItem>
                <SelectItem value="3-5">3-5 years</SelectItem>
                <SelectItem value="5-10">5-10 years</SelectItem>
                <SelectItem value="10+">10+ years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-4">
          <Label htmlFor="secondarySkills">Additional Skills (Optional)</Label>
          <Textarea
            id="secondarySkills"
            value={Array.isArray(profile.secondarySkills) ? profile.secondarySkills.join(", ") : ""}
            onChange={(e) => onProfileChange("secondarySkills", e.target.value)}
            disabled={!isEditing}
            placeholder="Enter additional skills separated by commas"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="certifications">Certifications & Training (Optional)</Label>
          <Textarea
            id="certifications"
            value={Array.isArray(profile.certifications) ? profile.certifications.join(", ") : ""}
            onChange={(e) => onProfileChange("certifications", e.target.value)}
            disabled={!isEditing}
            placeholder="Enter any certifications or training received"
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
};

const ContactDetailsForm = ({
  profile,
  onProfileChange,
  isEditing,
}: {
  profile: MigrantProfile;
  onProfileChange: (field: keyof MigrantProfile, value: string) => void;
  isEditing: boolean;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Emergency Contact Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="emergencyName">
              Emergency Contact Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="emergencyName"
              value={profile.emergencyName}
              onChange={(e) => onProfileChange("emergencyName", e.target.value)}
              disabled={!isEditing}
              placeholder="Enter emergency contact name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="emergencyContact">
              Emergency Contact Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="emergencyContact"
              value={profile.emergencyContact}
              onChange={(e) => onProfileChange("emergencyContact", e.target.value)}
              disabled={!isEditing}
              placeholder="Enter emergency contact number"
              className="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const FamilyDetailsForm = ({
  profile,
  onProfileChange,
  isEditing,
}: {
  profile: MigrantProfile;
  onProfileChange: (field: keyof MigrantProfile, value: string) => void;
  isEditing: boolean;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Family Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="familySize">
              Family Size <span className="text-red-500">*</span>
            </Label>
            <Select
              value={profile.familySize}
              onValueChange={(value) => onProfileChange("familySize", value)}
              disabled={!isEditing}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select family size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 person</SelectItem>
                <SelectItem value="2">2 people</SelectItem>
                <SelectItem value="3">3 people</SelectItem>
                <SelectItem value="4">4 people</SelectItem>
                <SelectItem value="5">5 people</SelectItem>
                <SelectItem value="6+">6+ people</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dependents">Number of Dependents</Label>
            <Select
              value={profile.dependents}
              onValueChange={(value) => onProfileChange("dependents", value)}
              disabled={!isEditing}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select number of dependents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 dependents</SelectItem>
                <SelectItem value="1">1 dependent</SelectItem>
                <SelectItem value="2">2 dependents</SelectItem>
                <SelectItem value="3">3 dependents</SelectItem>
                <SelectItem value="4">4 dependents</SelectItem>
                <SelectItem value="5+">5+ dependents</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const DocumentsUploadForm = () => {
  const { user, loading } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentTypes = [
    "Medical Certificate",
    "Blood Test Report",
    "X-Ray Report",
    "Prescription",
    "Lab Results",
    "Vaccination Certificate",
    "Health Insurance Card",
    "ID Proof",
    "Work Permit",
    "Symptom Notes",
    "Other Medical Document",
  ];

  useEffect(() => {
    if (user) {
      loadUserSubmissions();
    }
  }, [user]);

  const loadUserSubmissions = async () => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch("/api/documents/submissions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error("Error loading submissions:", error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleFiles = (fileList: FileList) => {
    const newFiles: UploadedFile[] = [];
    Array.from(fileList).forEach((file) => {
      if (file.size > 1 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 1MB (Firestore limit)`);
        return;
      }
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/gif",
        "image/webp",
        "application/pdf",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          `${file.name} type "${file.type}" is not supported. Please use JPG, PNG, GIF, WEBP, or PDF files.`,
        );
        return;
      }
      const fileType = file.type.startsWith("image/")
        ? "image"
        : file.type === "application/pdf"
        ? "pdf"
        : "document";
      const newFile: UploadedFile = {
        id: `file_${Date.now()}_${Math.random()}`,
        file,
        type: fileType,
        description: "",
        status: "pending",
        timestamp: new Date(),
      };
      if (fileType === "image") {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === newFile.id ? { ...f, preview: e.target?.result as string } : f,
            ),
          );
        };
        reader.readAsDataURL(file);
      }
      newFiles.push(newFile);
    });
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const updateFileDescription = (fileId: string, description: string) => {
    setFiles((prev) => prev.map((file) => (file.id === fileId ? { ...file, description } : file)));
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const getFileIcon = (file: UploadedFile) => {
    switch (file.type) {
      case "image":
        return <ImageIcon className="w-6 h-6 text-blue-500" />;
      case "pdf":
        return <FileText className="w-6 h-6 text-red-500" />;
      default:
        return <File className="w-6 h-6 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "uploading":
        return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const toggleSubmissionDetails = (submissionId: string) => {
    setExpandedSubmissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
  };

  const handleSubmitAll = async () => {
    if (files.length === 0) {
      toast.error("Please upload at least one file");
      return;
    }
    const incompleteFiles = files.filter((f) => !f.description.trim());
    if (incompleteFiles.length > 0) {
      toast.error("Please add descriptions for all files");
      return;
    }
    setIsUploading(true);
    try {
      const token = await user?.getIdToken();
      setFiles((prev) => prev.map((f) => ({ ...f, status: "uploading" })));
      const filesWithData = await Promise.all(
        files.map(async (fileObj) => {
          return new Promise<any>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              const base64Data = result.split(",")[1];
              resolve({
                originalName: fileObj.file.name,
                fileName: `${Date.now()}_${fileObj.file.name}`,
                fileType: fileObj.file.type,
                fileSize: fileObj.file.size,
                description: fileObj.description,
                fileData: base64Data,
              });
            };
            reader.readAsDataURL(fileObj.file);
          });
        }),
      );
      const submissionData = {
        userInfo: {
          uid: user?.uid,
          email: user?.email,
          displayName: user?.displayName || user?.email?.split("@")[0] || "User",
        },
        files: filesWithData,
      };
      const response = await fetch("/api/document-submission", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });
      if (response.ok) {
        const result = await response.json();
        const submissionInfo = result.submission;
        setFiles((prev) => prev.map((f) => ({ ...f, status: "uploaded" })));
        const newSubmission: Submission = {
          id: submissionInfo.id,
          files: files.map((f) => ({ ...f, status: "uploaded" })),
          status: "submitted",
          submittedAt: new Date(submissionInfo.submittedAt),
          totalFiles: files.length,
          approvedFiles: 0,
          rejectedFiles: 0,
          pendingFiles: files.length,
        };
        setSubmissions((prev) => [newSubmission, ...prev]);
        toast.success(
          <div>
            <p className="mb-2">{files.length} files submitted successfully</p>
            <p className="text-sm text-green-700 font-medium">
              Submission ID: {submissionInfo.submissionId}
            </p>
            <p className="text-xs text-green-600 mt-1">QR code generated for admin access</p>
          </div>,
        );
        setFiles([]);
        await loadUserSubmissions();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit documents. Please try again.");
      setFiles((prev) => prev.map((f) => ({ ...f, status: "error", error: error.message })));
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Please Sign In</h2>
            <p className="text-gray-600 mb-4">You need to be signed in to upload documents.</p>
            <Button onClick={() => (window.location.href = "/auth/signin")}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gray-50 flex">
  <div className="flex-1 min-h-screen">
    <div className="w-full">
      <div className="w-full bg-white border-b border-gray-200 shadow-sm">
            
          </div>

          

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Upload New Documents</h2>
              <p className="text-sm text-gray-600">
                Follow these steps: <span className="font-medium">1) Choose files</span> →{" "}
                <span className="font-medium">2) Add descriptions</span> →{" "}
                <span className="font-medium">3) Submit all</span>
              </p>
              <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                Debug: Files in state: {files.length} | User: {user?.email || "Not authenticated"}
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <div
                  className={`px-2 py-1 rounded ${
                    files.length === 0 ? "bg-blue-100 text-blue-800 font-medium" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Step 1: Choose Files {files.length > 0 && "✓"} ({files.length})
                </div>
                <div
                  className={`px-2 py-1 rounded ${
                    files.length > 0 && files.some((f) => !f.description)
                      ? "bg-blue-100 text-blue-800 font-medium"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Step 2: Add Descriptions {files.length > 0 && files.every((f) => f.description) && "✓"}
                </div>
                <div
                  className={`px-2 py-1 rounded ${
                    files.length > 0 && files.every((f) => f.description)
                      ? "bg-green-100 text-green-800 font-medium"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Step 3: Submit All {files.length > 0 && files.every((f) => f.description) && "→ Ready!"}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-left transition-colors ${
                  dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <div className="flex items-center gap-4 mb-4">
                  <Upload className="w-12 h-12 text-gray-400" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-700">Drop files here or click to browse</h3>
                    <p className="text-sm text-gray-500">Support: JPG, PNG, PDF (Max 1MB each)</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    size="lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Choose Files to Upload
                  </Button>
                  {files.length === 0 && (
                    <Button variant="default" disabled={true} size="lg" className="opacity-50">
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Documents (Select files first)
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {files.length === 0 && submissions.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Upload className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Ready to upload more documents?</p>
                    <p className="text-sm text-blue-700">
                      Use the upload area above to add new medical documents. After uploading, don't forget to add
                      descriptions and click "Submit All Files".
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {files.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <h2 className="text-xl font-semibold">Selected Files ({files.length})</h2>
                <Button
                  onClick={handleSubmitAll}
                  disabled={isUploading || files.some((f) => !f.description.trim())}
                  className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold"
                  size="lg"
                >
                  {isUploading ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Submit All Files
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {files.map((file) => (
                    <div key={file.id} className="bg-white border rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-shrink-0">
                          {file.preview ? (
                            <img
                              src={file.preview}
                              alt={file.file.name}
                              className="w-12 h-12 object-cover rounded border"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                              {getFileIcon(file)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.file.size)}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {getStatusIcon(file.status)}
                            <span className="text-xs capitalize text-gray-600">{file.status}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          disabled={isUploading}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Document Type *</label>
                        <select
                          value={file.description}
                          onChange={(e) => updateFileDescription(file.id, e.target.value)}
                          disabled={isUploading}
                          className="w-full text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select type...</option>
                          {documentTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                      {file.error && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">{file.error}</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {submissions.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Previous Submissions</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              ID: {submission.id}
                            </Badge>
                            <Badge
                              variant={
                                submission.status === "approved"
                                  ? "default"
                                  : submission.status === "rejected"
                                  ? "destructive"
                                  : submission.status === "partial_approved"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {submission.status.replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">{submission.totalFiles}</span> files submitted
                            {submission.submittedAt && (
                              <span className="ml-2">
                                on {new Date(submission.submittedAt).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                          <div className="flex gap-4 text-xs text-gray-500">
                            <span className="text-green-600">✓ {submission.approvedFiles} approved</span>
                            <span className="text-red-600">✗ {submission.rejectedFiles} rejected</span>
                            <span className="text-yellow-600">⧖ {submission.pendingFiles} pending</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => toggleSubmissionDetails(submission.id)}>
                            <Eye className="w-4 h-4 mr-1" />
                            {expandedSubmissions.has(submission.id) ? "Hide Details" : "View Details"}
                          </Button>
                          {submission.status === "approved" && (
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                      {expandedSubmissions.has(submission.id) && (
                        <div className="mt-4 border-t pt-4">
                          <h4 className="text-sm font-semibold text-gray-800 mb-3">Document Details</h4>
                          <div className="space-y-3">
                            {submission.files?.map((document: any, idx: number) => (
                              <div key={document.id || idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="flex-shrink-0">
                                  <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-gray-400" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h5 className="text-sm font-medium text-gray-800 truncate">
                                      {document.description || document.fileName || `Document ${idx + 1}`}
                                    </h5>
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant={
                                          document.status === "approved"
                                            ? "default"
                                            : document.status === "rejected"
                                            ? "destructive"
                                            : "secondary"
                                        }
                                        className="text-xs"
                                      >
                                        {(document.status || "pending").toUpperCase()}
                                      </Badge>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-500 mb-1">Status: {document.status || "pending"}</p>
                                  {document.status === "rejected" && document.rejectionReason && (
                                    <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                                      <p className="text-xs text-red-700">
                                        <strong>Reason:</strong> {document.rejectionReason}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )) || (
                              <p className="text-sm text-gray-500">No documents found</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-800">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Status Updates</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                You will be notified here when administrators review your documents
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default function MigrantProfilePage() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams?.get("tab") || "skills";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditing, setIsEditing] = useState(true);
  const [profile, setProfile] = useState<MigrantProfile>({
    name: "mohan",
    mobileNumber: "9346491221",
    age: "",
    gender: "",
    occupation: "",
    language: "",
    state: "",
    district: "",
    policeStation: "",
    currentAddress: "",
    nativeAddress: "",
    primarySkill: "",
    secondarySkills: [],
    experience: "",
    certifications: [],
    emergencyContact: "",
    emergencyName: "",
    familySize: "",
    dependents: "",
    familyMembers: [],
  });

  const handleProfileChange = (field: keyof MigrantProfile, value: string) => {
    setProfile((prev) => {
      if (field === "secondarySkills" || field === "certifications") {
        return { ...prev, [field]: value.split(",").map((item) => item.trim()).filter(Boolean) };
      }
      return { ...prev, [field]: value };
    });
    setProfile((prev) => {
      if (field === "secondarySkills" || field === "certifications") {
        return { ...prev, [field]: value.split(",").map((item) => item.trim()).filter(Boolean) };
      }
      if (field === "familySize") {
        const newSize = value === "6+" ? 6 : parseInt(value || "0", 10) || 0;
        const existing = prev.familyMembers || [];
        const newMembers = [...existing];
        if (newMembers.length < newSize) {
          for (let i = newMembers.length; i < newSize; i++) {
            newMembers.push({ name: "", age: "", gender: "", bloodGroup: "", relation: "" });
          }
        } else if (newMembers.length > newSize) {
          newMembers.length = newSize;
        }
        return { ...prev, [field]: value, familyMembers: newMembers } as MigrantProfile;
      }
      return { ...prev, [field]: value };
    });
  };

  const handleFamilyMemberChange = (index: number, memberField: string, value: string) => {
    setProfile((prev) => {
      const members = prev.familyMembers ? [...prev.familyMembers] : [];
      while (members.length <= index) {
        members.push({ name: "", age: "", gender: "", bloodGroup: "", relation: "" });
      }
      // @ts-ignore
      members[index] = { ...members[index], [memberField]: value };
      return { ...prev, familyMembers: members };
    });
  };

  const handleSave = async () => {
    try {
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  return (
    <AuthGuard>
      <div className="bg-background text-foreground min-h-screen">
        <div className="flex h-screen overflow-hidden">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex-1 flex flex-col">
            <Header user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="bg-white border-b">
                <div className="px-6 py-4">
                  <NavigationSidebar
                    activeTab={activeTab}
                    onTabChange={(tab: string) => {
                      setActiveTab(tab);
                      try {
                        const params = new URLSearchParams(window.location.search);
                        params.set("tab", tab);
                        const newUrl = `${window.location.pathname}?${params.toString()}`;
                        // use router.replace to avoid adding history entries
                        router.replace(newUrl);
                      } catch (e) {
                        // fallback
                        window.history.replaceState({}, "", `?tab=${tab}`);
                      }
                    }}
                  />
                </div>
              </div>
              <main className="flex-1 p-6 overflow-auto">
                <div className="flex items-center justify-between mb-4">
                  
                  <div className="flex items-center space-x-2">
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)}>Edit</Button>
                    ) : (
                      <Button onClick={handleSave}>
                        <Save className="mr-2" /> Save
                      </Button>
                    )}
                  </div>
                </div>
                {activeTab === "skills" && (
                  <SkillsDetailsForm profile={profile} onProfileChange={handleProfileChange} isEditing={isEditing} />
                )}
                {activeTab === "contact" && (
                  <ContactDetailsForm profile={profile} onProfileChange={handleProfileChange} isEditing={isEditing} />
                )}
                {activeTab === "family" && (
                  <>
                    <FamilyDetailsForm profile={profile} onProfileChange={handleProfileChange} isEditing={isEditing} />
                    {(() => {
                      const count = profile.familySize === "6+" ? 6 : parseInt(profile.familySize || "0", 10) || 0;
                      if (count <= 0) return null;
                      return (
                        <div className="mt-6 space-y-4">
                          <h3 className="text-lg font-medium">Family Members</h3>
                          {Array.from({ length: count }).map((_, idx) => {
                            const member =
                              (profile.familyMembers && profile.familyMembers[idx]) || {
                                name: "",
                                age: "",
                                gender: "",
                                bloodGroup: "",
                                relation: "",
                              };
                            return (
                              <div key={idx} className="p-4 border rounded-lg bg-white">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <Label>Name</Label>
                                    <Input
                                      value={member.name}
                                      onChange={(e) => handleFamilyMemberChange(idx, "name", e.target.value)}
                                      disabled={!isEditing}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label>Age</Label>
                                    <Input
                                      value={member.age}
                                      onChange={(e) => handleFamilyMemberChange(idx, "age", e.target.value)}
                                      disabled={!isEditing}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label>Gender</Label>
                                    <Select
                                      value={member.gender}
                                      onValueChange={(v) => handleFamilyMemberChange(idx, "gender", v)}
                                      disabled={!isEditing}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select gender" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                  <div>
                                    <Label>Blood Group</Label>
                                    <Select
                                      value={member.bloodGroup}
                                      onValueChange={(v) => handleFamilyMemberChange(idx, "bloodGroup", v)}
                                      disabled={!isEditing}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select blood group" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="A+">A+</SelectItem>
                                        <SelectItem value="A-">A-</SelectItem>
                                        <SelectItem value="B+">B+</SelectItem>
                                        <SelectItem value="B-">B-</SelectItem>
                                        <SelectItem value="O+">O+</SelectItem>
                                        <SelectItem value="O-">O-</SelectItem>
                                        <SelectItem value="AB+">AB+</SelectItem>
                                        <SelectItem value="AB-">AB-</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Relation</Label>
                                    <Input
                                      value={member.relation}
                                      onChange={(e) => handleFamilyMemberChange(idx, "relation", e.target.value)}
                                      disabled={!isEditing}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label>Notes (optional)</Label>
                                    <Input value={""} disabled className="mt-1" placeholder="Optional" />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </>
                )}
                {activeTab === "documents" && <DocumentsUploadForm />}
              </main>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
