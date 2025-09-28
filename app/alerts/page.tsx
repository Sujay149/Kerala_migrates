"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Bell, X, Check, Clock, Calendar, Pill, Activity, Info, CloudRain } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { Alert as AlertModel } from "./models"
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"

// Define a user-specific read status tracker interface
interface AlertReadStatus {
  id: string
  userId: string
  alertId: string
  read: boolean
  readAt?: Date | string
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertModel[]>([])
  const [readStatuses, setReadStatuses] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  
  // Fetch alerts from Firebase
  useEffect(() => {
    const fetchAlerts = async () => {
      if (!user) return
      
      setLoading(true)
      try {
        // Get current date for checking expired alerts
        const now = new Date()
        
        // Query all alerts first - we'll filter active ones in memory
        // This avoids needing a composite index on active + createdAt
        const alertsQuery = query(
          collection(db, "alerts"),
          orderBy("createdAt", "desc")
        )
        
        const querySnapshot = await getDocs(alertsQuery)
        const alertsData: AlertModel[] = []
        
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<AlertModel, "id">
          
          // Skip inactive and expired alerts
          if (!data.active) return
          
          // Skip expired alerts
          if (data.expiresAt) {
            const expiryDate =
              data.expiresAt && typeof data.expiresAt === 'object' && 'toDate' in data.expiresAt
                ? (data.expiresAt as { toDate: () => Date }).toDate()
                : new Date(data.expiresAt);
            if (expiryDate < now) return;
          }
          
          alertsData.push({  
            id: doc.id, 
            ...data,
            createdAt: data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt 
              ? (data.createdAt as any).toDate().toISOString() 
              : data.createdAt,
            updatedAt: data.updatedAt && typeof data.updatedAt === 'object' && 'toDate' in data.updatedAt 
              ? (data.updatedAt as any).toDate().toISOString() 
              : data.updatedAt,
          })
        })
        
        setAlerts(alertsData)
        
        // Fetch user's read status for these alerts
        await fetchReadStatuses(alertsData.map(a => a.id))
      } catch (error) {
        console.error("Error fetching alerts:", error)
        toast.error("Failed to load alerts")
      } finally {
        setLoading(false)
      }
    }
    
    // Fetch read statuses for the alerts
    const fetchReadStatuses = async (alertIds: string[]) => {
      if (!user?.uid || alertIds.length === 0) return
      
      try {
        const readStatusQuery = query(
          collection(db, "alertReadStatus"),
          where("userId", "==", user.uid),
          where("alertId", "in", alertIds)
        )
        
        const readStatusSnapshot = await getDocs(readStatusQuery)
        const statuses: Record<string, boolean> = {}
        
        readStatusSnapshot.forEach((doc) => {
          const data = doc.data() as AlertReadStatus
          statuses[data.alertId] = data.read
        })
        
        setReadStatuses(statuses)
      } catch (error) {
        console.error("Error fetching read statuses:", error)
      }
    }
    
    fetchAlerts()
  }, [user])

  // Mark an alert as read
  const markAsRead = async (alertId: string) => {
    if (!user?.uid) return

    try {
      // Update the local state first for immediate feedback
      setReadStatuses(prev => ({ ...prev, [alertId]: true }))

      // Create or update the read status in Firebase
      const alertReadStatusRef = collection(db, "alertReadStatus")
      const readStatusQuery = query(
        alertReadStatusRef,
        where("userId", "==", user.uid),
        where("alertId", "==", alertId)
      )

      const existingStatusSnapshot = await getDocs(readStatusQuery)
      
      if (existingStatusSnapshot.empty) {
        // Create new read status
        const newReadStatus: AlertReadStatus = {
          id: `${user.uid}_${alertId}`,
          userId: user.uid,
          alertId: alertId,
          read: true,
          readAt: new Date().toISOString()
        }
        
        await fetch("/api/alerts/mark-read", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(newReadStatus)
        })
      }

      toast.success("Alert marked as read")
    } catch (error) {
      console.error("Error marking alert as read:", error)
      toast.error("Failed to update alert status")
      
      // Revert the local state
      setReadStatuses(prev => ({ ...prev, [alertId]: false }))
    }
  }

  // Helper function to get appropriate icon for alert type
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'medication':
        return <Pill className="h-6 w-6" />
      case 'appointment':
        return <Calendar className="h-6 w-6" />
      case 'health':
        return <Activity className="h-6 w-6" />
      case 'weather':
        return <CloudRain className="h-6 w-6" />
      case 'system':
      default:
        return <Info className="h-6 w-6" />
    }
  }

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // Get priority style (background color, text color)
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 hover:bg-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
      case 'low':
      default:
        return 'bg-green-100 text-green-800 hover:bg-green-200'
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Health & Community Alerts</h1>
        <Badge variant="outline" className="flex items-center gap-1">
          <Bell className="h-4 w-4" />
          {alerts.filter(alert => !readStatuses[alert.id]).length} Unread
        </Badge>
      </div>

      {loading ? (
        // Loading skeletons
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="mb-4">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div>
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-16 w-full mt-4" />
                  <div className="flex justify-between mt-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <Card className="mb-4">
          <CardContent className="p-6 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium">No active alerts</h3>
            <p className="text-gray-500 mt-2">
              You don't have any active alerts at this time. Check back later for updates.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card 
              key={alert.id} 
              className={`mb-4 border-l-4 ${
                !readStatuses[alert.id] ? 'border-l-blue-500' : 'border-l-gray-200'
              }`}
            >
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getPriorityStyle(alert.priority)}`}>
                        {getAlertIcon(alert.type)}
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{alert.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Badge variant="outline">{alert.type}</Badge>
                          <Badge 
                            variant={alert.priority === 'critical' ? 'destructive' : 'secondary'}
                          >
                            {alert.priority}
                          </Badge>
                          {alert.actionRequired && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Action Required
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`flex items-center gap-1 ${
                          readStatuses[alert.id] ? 'text-green-600' : 'text-blue-600'
                        }`}
                      >
                        {readStatuses[alert.id] ? (
                          <>
                            <Check className="h-3 w-3" />
                            Read
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" />
                            Unread
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-gray-700">{alert.message}</p>
                    
                    {/* Display image if available */}
                    {alert.imageUrl && (
                      <div className="mt-4 relative h-48 sm:h-64 w-full rounded-md overflow-hidden">
                        <Image 
                          src={alert.imageUrl} 
                          alt={alert.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDate(alert.createdAt)}
                    </div>
                    
                    <div className="flex gap-2">
                      {!readStatuses[alert.id] && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => markAsRead(alert.id)}
                          className="flex items-center gap-1"
                        >
                          <Check className="h-4 w-4" />
                          Mark as Read
                        </Button>
                      )}
                      
                      {alert.actionLink && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => window.open(alert.actionLink, '_blank')}
                          className="flex items-center gap-1"
                        >
                          Learn More
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}