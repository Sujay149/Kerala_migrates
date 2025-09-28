"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AdminGuard from '@/components/admin-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Building2,
  Activity,
  FileText,
  Download,
  Shield,
  BarChart3,
  MapPin,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export default function GovernmentAdminDashboard() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalHealthCenters: 0,
    activeSessions: 0,
    reportsGenerated: 0
  });

  useEffect(() => {
    if (user && userProfile) {
      // Check if user is government admin
      if (!userProfile.isAdmin || userProfile.adminRole !== 'government') {
        toast.error('Access denied. Government admin credentials required.');
        router.push('/auth/signin');
        return;
      }
      loadDashboardData();
    }
  }, [user, userProfile, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load users count
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      
      // Load health centers (admins with health_center role)
      const healthCentersQuery = query(
        collection(db, 'users'),
        where('adminRole', '==', 'health_center')
      );
      const healthCentersSnapshot = await getDocs(healthCentersQuery);
      
      setStats({
        totalUsers: usersSnapshot.size,
        totalHealthCenters: healthCentersSnapshot.size,
        activeSessions: Math.floor(Math.random() * 150) + 50, // Mock data
        reportsGenerated: Math.floor(Math.random() * 500) + 100 // Mock data
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (reportType: string) => {
    toast.success(`Exporting ${reportType} report...`);
    // Implement report export logic here
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AdminGuard requiredRole="government">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Government Admin Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  {userProfile?.organizationName}
                </p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Shield className="h-4 w-4 mr-1" />
                Government Access
              </Badge>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Registered patients</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Health Centers</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalHealthCenters}</div>
                <p className="text-xs text-muted-foreground">Connected facilities</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeSessions}</div>
                <p className="text-xs text-muted-foreground">Current users online</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.reportsGenerated}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Content */}
          <Tabs defaultValue="overview" className="space-y-6">

            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="health-centers">Health Centers</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="management">Management</TabsTrigger>
            </TabsList>
            {/* Management Tab */}
            <TabsContent value="management" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4">
                    <Button asChild className="flex-1 bg-blue-600 text-white hover:bg-blue-700">
                      <a href="/admin/documents">Manage Documents</a>
                    </Button>
                    <Button asChild className="flex-1 bg-orange-600 text-white hover:bg-orange-700">
                      <a href="/alerts/manage">Manage Alerts</a>
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground mt-4">
                    Access and manage all uploaded documents and system alerts from these dedicated admin panels.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      System Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Daily Active Users</span>
                        <span className="font-semibold">2,847</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Monthly Growth</span>
                        <span className="font-semibold text-green-600">+12.5%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">API Requests</span>
                        <span className="font-semibold">45,231</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      System Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                        <span className="text-sm">High server load detected</span>
                        <Badge variant="outline">Warning</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                        <span className="text-sm">Weekly backup completed</span>
                        <Badge variant="outline" className="bg-green-100">Info</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <Button onClick={() => exportReport('users')}>
                        <Download className="h-4 w-4 mr-2" />
                        Export User Data
                      </Button>
                      <Button variant="outline">
                        <Users className="h-4 w-4 mr-2" />
                        View All Users
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Manage registered users, view activity logs, and export user data for analysis.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="health-centers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Connected Health Centers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <Button onClick={() => exportReport('health-centers')}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Center Data
                      </Button>
                      <Button variant="outline">
                        <Building2 className="h-4 w-4 mr-2" />
                        Add New Center
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-border rounded-lg">
                        <h4 className="font-semibold">KIMS Hospital</h4>
                        <p className="text-sm text-muted-foreground">Trivandrum, Kerala</p>
                        <Badge className="mt-2" variant="outline">Active</Badge>
                      </div>
                      <div className="p-4 border border-border rounded-lg">
                        <h4 className="font-semibold">Apollo Hospital</h4>
                        <p className="text-sm text-muted-foreground">Chennai, Tamil Nadu</p>
                        <Badge className="mt-2" variant="outline">Active</Badge>
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
                      onClick={() => exportReport('health-statistics')}
                    >
                      <BarChart3 className="h-6 w-6 mb-2" />
                      Health Statistics Report
                    </Button>
                    <Button 
                      className="h-24 flex flex-col justify-center" 
                      variant="outline"
                      onClick={() => exportReport('system-usage')}
                    >
                      <Activity className="h-6 w-6 mb-2" />
                      System Usage Report
                    </Button>
                    <Button 
                      className="h-24 flex flex-col justify-center" 
                      variant="outline"
                      onClick={() => exportReport('demographic')}
                    >
                      <MapPin className="h-6 w-6 mb-2" />
                      Demographic Analysis
                    </Button>
                    <Button 
                      className="h-24 flex flex-col justify-center" 
                      variant="outline"
                      onClick={() => exportReport('monthly-summary')}
                    >
                      <Calendar className="h-6 w-6 mb-2" />
                      Monthly Summary
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