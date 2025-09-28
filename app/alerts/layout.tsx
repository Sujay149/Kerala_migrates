"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Menu, Bell, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface AlertsLayoutProps {
  children: React.ReactNode;
}

export default function AlertsLayout({ children }: AlertsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Set sidebar open by default on desktop
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const navItems = [
    { 
      name: "View Alerts", 
      path: "/alerts", 
      icon: <Bell className="h-4 w-4 mr-2" />
    },
    // { 
    //   name: "Manage Alerts", 
    //   path: "/alerts/manage", 
    //   icon: <AlertTriangle className="h-4 w-4 mr-2" />
    // }
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
          {/* Mobile Header */}
          <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Alert Center</h1>
            <div></div>
          </div>
          
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-8 w-8 text-blue-600" />
                  Alert Center
                </h1>
                <p className="text-gray-600">Manage and view alerts for all users</p>
              </div>
              
              {/* Sub Navigation */}
              <div className="flex flex-wrap gap-2 mb-8 border-b pb-4">
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    variant={pathname === item.path ? "default" : "outline"}
                    className={cn(
                      pathname === item.path ? "bg-blue-600 text-white" : "text-gray-600",
                      "flex items-center"
                    )}
                    asChild
                  >
                    <Link href={item.path}>
                      {item.icon}
                      {item.name}
                    </Link>
                  </Button>
                ))}
              </div>
              
              {/* Page Content */}
              {children}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}