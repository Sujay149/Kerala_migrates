"use client";

import React, { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  Home,
  Grid3X3,
  User,
  Users,
  Upload,
  Phone,
  MapPin,
  Globe,
  Clock,
  Settings,
  LogOut,
  ChevronDown,
  Edit,
  Save,
  Camera,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/auth-guard";
import { Sidebar } from "@/components/sidebar";
import { toast } from "sonner";

interface MigrantProfile {
  // Personal Details
  name: string;
  mobileNumber: string;
  age: string;
  gender: string;
  occupation: string;
  language: string;
  
  // Address Details
  state: string;
  district: string;
  policeStation: string;
  currentAddress: string;
  nativeAddress: string;
  
  // Skills Details
  primarySkill: string;
  secondarySkills: string[];
  experience: string;
  certifications: string[];
  
  // Family Details
  emergencyContact: string;
  emergencyName: string;
  familySize: string;
  dependents: string;
}

const Header = ({ user, onMenuToggle }: { user: any; onMenuToggle: () => void }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  return (
    <header className="bg-slate-700 text-white p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-lg hover:bg-slate-600"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
              <Globe className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">Athidhi Portal</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-sm">
            <Clock className="h-4 w-4" />
            <span>Idle timeout in 19:53</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-lg hover:bg-slate-600">
              <Home className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-600">
              <Grid3X3 className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-600">
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-600"
              >
                <User className="h-5 w-5" />
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-slate-800 rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b">
                    <p className="font-medium">Welcome {user?.displayName || 'User'}</p>
                  </div>
                  <button className="w-full text-left p-3 hover:bg-gray-100 flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                  <button className="w-full text-left p-3 hover:bg-gray-100 flex items-center space-x-2 text-red-600">
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

const NavigationSidebar = ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) => {
  const tabs = [
    { id: 'skills', label: 'Skills Details', icon: User },
    { id: 'contact', label: 'Alternate Contact Details', icon: Phone },
    { id: 'family', label: 'Family Details', icon: Users },
    { id: 'documents', label: 'Upload Documents/Photo', icon: Upload },
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
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors flex-shrink-0 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
          <Icon className="h-5 w-5" />
          <span>{tab.label}</span>
        </button>
      );
    })}
  </div>
</div>
    </div>
  );
};

const PersonalDetailsForm = ({ profile, onProfileChange, isEditing }: {
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
              onChange={(e) => onProfileChange('name', e.target.value)}
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
              onChange={(e) => onProfileChange('mobileNumber', e.target.value)}
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
              onChange={(e) => onProfileChange('age', e.target.value)}
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
              onValueChange={(value) => onProfileChange('gender', value)}
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
              onValueChange={(value) => onProfileChange('occupation', value)}
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
              onValueChange={(value) => onProfileChange('language', value)}
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

const AddressDetailsForm = ({ profile, onProfileChange, isEditing }: {
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
              onValueChange={(value) => onProfileChange('state', value)}
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
              onValueChange={(value) => onProfileChange('district', value)}
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
              onValueChange={(value) => onProfileChange('policeStation', value)}
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
              onChange={(e) => onProfileChange('currentAddress', e.target.value)}
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
              onChange={(e) => onProfileChange('nativeAddress', e.target.value)}
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

const SkillsDetailsForm = ({ profile, onProfileChange, isEditing }: {
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
              onValueChange={(value) => onProfileChange('primarySkill', value)}
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
              onValueChange={(value) => onProfileChange('experience', value)}
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
          <Label htmlFor="secondarySkills">
            Additional Skills (Optional)
          </Label>
          <Textarea
            id="secondarySkills"
            value={Array.isArray(profile.secondarySkills) ? profile.secondarySkills.join(', ') : ''}
            onChange={(e) => onProfileChange('secondarySkills', e.target.value)}
            disabled={!isEditing}
            placeholder="Enter additional skills separated by commas"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="certifications">
            Certifications & Training (Optional)
          </Label>
          <Textarea
            id="certifications"
            value={Array.isArray(profile.certifications) ? profile.certifications.join(', ') : ''}
            onChange={(e) => onProfileChange('certifications', e.target.value)}
            disabled={!isEditing}
            placeholder="Enter any certifications or training received"
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
};

const ContactDetailsForm = ({ profile, onProfileChange, isEditing }: {
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
              onChange={(e) => onProfileChange('emergencyName', e.target.value)}
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
              onChange={(e) => onProfileChange('emergencyContact', e.target.value)}
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

const FamilyDetailsForm = ({ profile, onProfileChange, isEditing }: {
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
              onValueChange={(value) => onProfileChange('familySize', value)}
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
            <Label htmlFor="dependents">
              Number of Dependents
            </Label>
            <Select
              value={profile.dependents}
              onValueChange={(value) => onProfileChange('dependents', value)}
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

const DocumentsUploadForm = ({ isEditing }: { isEditing: boolean }) => {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Documents & Photo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Profile Photo</Label>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Upload profile photo (JPG, PNG)</p>
              <Button disabled={!isEditing} className="mt-2" size="sm">
                Choose File
              </Button>
            </div>
          </div>
          
          <div>
            <Label>Identity Documents</Label>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Upload Aadhaar, Voter ID, or other identity documents (PDF, JPG, PNG)</p>
              <Button disabled={!isEditing} className="mt-2" size="sm">
                Choose Files
              </Button>
            </div>
          </div>
           <div>
            <Label>Health Certificates</Label>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Upload any skill certificates or training documents (PDF, JPG, PNG)</p>
              <Button disabled={!isEditing} className="mt-2" size="sm">
                Choose Files
              </Button>
            </div>
          </div>
          <div>
            <Label>Skill Certificates</Label>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Upload any skill certificates or training documents (PDF, JPG, PNG)</p>
              <Button disabled={!isEditing} className="mt-2" size="sm">
                Choose Files
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function MigrantProfilePage() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('skills');
  const [isEditing, setIsEditing] = useState(true);
  const [profile, setProfile] = useState<MigrantProfile>({
    name: 'mohan',
    mobileNumber: '9346491221',
    age: '',
    gender: '',
    occupation: '',
    language: '',
    state: '',
    district: '',
    policeStation: '',
    currentAddress: '',
    nativeAddress: '',
    primarySkill: '',
    secondarySkills: [],
    experience: '',
    certifications: [],
    emergencyContact: '',
    emergencyName: '',
    familySize: '',
    dependents: '',
  });

  const handleProfileChange = (field: keyof MigrantProfile, value: string) => {
    setProfile(prev => {
      if (field === 'secondarySkills' || field === 'certifications') {
        return { ...prev, [field]: value.split(',').map(item => item.trim()).filter(Boolean) };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSave = async () => {
    try {
      // Here you would save to your database
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar (same as dashboard) */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        {/* Main content */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-slate-800">Profile Information</h1>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                </Button>
                {isEditing && (
                  <Button
                    onClick={handleSave}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Submit</span>
                  </Button>
                )}
              </div>
            </div>
            {/* Tab navigation for profile sections */}
            <div className="mb-8">
              <NavigationSidebar activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
            {activeTab === 'skills' && (
              <>
                <PersonalDetailsForm 
                  profile={profile}
                  onProfileChange={handleProfileChange}
                  isEditing={isEditing}
                />
                <AddressDetailsForm 
                  profile={profile}
                  onProfileChange={handleProfileChange}
                  isEditing={isEditing}
                />
                <SkillsDetailsForm 
                  profile={profile}
                  onProfileChange={handleProfileChange}
                  isEditing={isEditing}
                />
              </>
            )}
            {activeTab === 'contact' && (
              <ContactDetailsForm 
                profile={profile}
                onProfileChange={handleProfileChange}
                isEditing={isEditing}
              />
            )}
            {activeTab === 'family' && (
              <FamilyDetailsForm 
                profile={profile}
                onProfileChange={handleProfileChange}
                isEditing={isEditing}
              />
            )}
            {activeTab === 'documents' && (
              <DocumentsUploadForm isEditing={isEditing} />
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}