"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AdminGuard from '@/components/admin-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Users,
  Calendar,
  FileText,
  Download,
  Stethoscope,
  Activity,
  UserCheck,
  ClipboardList,
  Search,
  Plus
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export default function HealthCenterAdminDashboard() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    activeRecords: 0,
    pendingReports: 0
  });

  useEffect(() => {
    if (user && userProfile) {
      // Check if user is health center admin
      if (!userProfile.isAdmin || userProfile.adminRole !== 'health_center') {
        toast.error('Access denied. Health center admin credentials required.');
        router.push('/auth/signin');
        return;
      }
      loadDashboardData();
    }
  }, [user, userProfile, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load patients count (regular users, not admins)
      const patientsQuery = query(
        collection(db, 'users'),
        where('isAdmin', '!=', true)
      );
      const patientsSnapshot = await getDocs(patientsQuery);
      
      // Mock data for other stats
      setStats({
        totalPatients: patientsSnapshot.size,
        todayAppointments: Math.floor(Math.random() * 25) + 5,
        activeRecords: Math.floor(Math.random() * 150) + 50,
        pendingReports: Math.floor(Math.random() * 10) + 2
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType: string) => {
    toast.success(`Generating ${reportType} report...`);
    // Implement report generation logic here
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AdminGuard requiredRole="health_center">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Health Center Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  {userProfile?.organizationName}
                </p>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Stethoscope className="h-4 w-4 mr-1" />
                Health Center Access
              </Badge>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPatients.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Registered patients</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayAppointments}</div>
                <p className="text-xs text-muted-foreground">Scheduled for today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Records</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeRecords}</div>
                <p className="text-xs text-muted-foreground">Patient records</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingReports}</div>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Content */}
          <Tabs defaultValue="patients" className="space-y-6">
            <TabsList>
              <TabsTrigger value="patients">Patient Management</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="records">Health Records</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="patients" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Patient Management</CardTitle>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Patient
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search patients..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export List
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {/* Sample patient data */}
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <h4 className="font-semibold">John Doe</h4>
                          <p className="text-sm text-muted-foreground">ID: P001 | Age: 45 | Last visit: 2 days ago</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">View</Button>
                          <Button size="sm">Edit</Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <h4 className="font-semibold">Jane Smith</h4>
                          <p className="text-sm text-muted-foreground">ID: P002 | Age: 32 | Last visit: 1 week ago</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">View</Button>
                          <Button size="sm">Edit</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appointments" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Appointment Management</CardTitle>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Appointment
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Today</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-blue-600">{stats.todayAppointments}</div>
                          <p className="text-sm text-muted-foreground">appointments</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">This Week</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">47</div>
                          <p className="text-sm text-muted-foreground">appointments</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Next Week</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-orange-600">38</div>
                          <p className="text-sm text-muted-foreground">appointments</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <Button className="w-full">
                      <Calendar className="h-4 w-4 mr-2" />
                      View Full Calendar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="records" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Health Records Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button className="h-20 flex flex-col justify-center" variant="outline">
                        <FileText className="h-6 w-6 mb-2" />
                        View All Records
                      </Button>
                      <Button className="h-20 flex flex-col justify-center" variant="outline">
                        <UserCheck className="h-6 w-6 mb-2" />
                        Patient History
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold">Recent Updates</h4>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">Patient P001 - Lab results updated</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">Patient P015 - Prescription added</p>
                        <p className="text-xs text-muted-foreground">4 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      className="h-24 flex flex-col justify-center"
                      onClick={() => generateReport('patient-statistics')}
                    >
                      <Activity className="h-6 w-6 mb-2" />
                      Patient Statistics
                    </Button>
                    <Button 
                      className="h-24 flex flex-col justify-center" 
                      variant="outline"
                      onClick={() => generateReport('appointment-summary')}
                    >
                      <Calendar className="h-6 w-6 mb-2" />
                      Appointment Summary
                    </Button>
                    <Button 
                      className="h-24 flex flex-col justify-center" 
                      variant="outline"
                      onClick={() => generateReport('health-trends')}
                    >
                      <Activity className="h-6 w-6 mb-2" />
                      Health Trends
                    </Button>
                    <Button 
                      className="h-24 flex flex-col justify-center" 
                      variant="outline"
                      onClick={() => generateReport('monthly-report')}
                    >
                      <FileText className="h-6 w-6 mb-2" />
                      Monthly Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminGuard>
  );
}