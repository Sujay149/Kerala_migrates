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

        <div className="flex-1 min-h-screen">
          <div className="w-full bg-white border-b border-gray-200 shadow-sm">
            {/* Page Content */}
            {children}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}