"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Bell, X, Check, Clock, Calendar, Pill, Activity, Info, CloudRain, Filter, Search, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { Alert as AlertModel } from "./models"
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Define a user-specific read status tracker interface
interface AlertReadStatus {
  id: string
  userId: string
  alertId: string
  read: boolean
  readAt?: Date | string
}

type FilterType = "all" | "unread" | "read"
type PriorityType = "all" | "critical" | "high" | "medium" | "low"
type AlertType = "all" | "medication" | "appointment" | "health" | "weather" | "system"

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertModel[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<AlertModel[]>([])
  const [readStatuses, setReadStatuses] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")
  const [priorityFilter, setPriorityFilter] = useState<PriorityType>("all")
  const [typeFilter, setTypeFilter] = useState<AlertType>("all")
  const { user } = useAuth()
  
  // Filter alerts based on search and filter criteria
  useEffect(() => {
    let result = alerts
    
    // Apply read/unread filter
    if (filter === "read") {
      result = result.filter(alert => readStatuses[alert.id])
    } else if (filter === "unread") {
      result = result.filter(alert => !readStatuses[alert.id])
    }
    
    // Apply priority filter
    if (priorityFilter !== "all") {
      result = result.filter(alert => alert.priority === priorityFilter)
    }
    
    // Apply type filter
    if (typeFilter !== "all") {
      result = result.filter(alert => alert.type === typeFilter)
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(alert => 
        alert.title.toLowerCase().includes(query) || 
        alert.message.toLowerCase().includes(query)
      )
    }
    
    setFilteredAlerts(result)
  }, [alerts, readStatuses, filter, priorityFilter, typeFilter, searchQuery])
  
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

  // Mark all alerts as read
  const markAllAsRead = async () => {
    if (!user?.uid) return
    
    try {
      const unreadAlertIds = alerts
        .filter(alert => !readStatuses[alert.id])
        .map(alert => alert.id)
      
      // Update local state
      const newStatuses = { ...readStatuses }
      unreadAlertIds.forEach(id => {
        newStatuses[id] = true
      })
      setReadStatuses(newStatuses)
      
      // Update in Firebase (you would need to implement this endpoint)
      await fetch("/api/alerts/mark-all-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: user.uid,
          alertIds: unreadAlertIds
        })
      })
      
      toast.success(`Marked ${unreadAlertIds.length} alerts as read`)
    } catch (error) {
      console.error("Error marking all alerts as read:", error)
      toast.error("Failed to mark all alerts as read")
    }
  }

  // Helper function to get appropriate icon for alert type
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'medication':
        return <Pill className="h-5 w-5" />
      case 'appointment':
        return <Calendar className="h-5 w-5" />
      case 'health':
        return <Activity className="h-5 w-5" />
      case 'weather':
        return <CloudRain className="h-5 w-5" />
      case 'system':
      default:
        return <Info className="h-5 w-5" />
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
        return 'bg-red-50 border-red-200 text-red-800'
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'low':
      default:
        return 'bg-green-50 border-green-200 text-green-800'
    }
  }

  // Get priority badge style
  const getPriorityBadgeStyle = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
      default:
        return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  const unreadCount = alerts.filter(alert => !readStatuses[alert.id]).length

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex-1 min-h-screen">
        <div className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Health & Community Alerts
          </h1>
          <p className="text-gray-600 mt-1">Stay informed about important updates</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-2 px-3 py-2 bg-blue-50">
            <Bell className="h-4 w-4 text-blue-600" />
            <span className="font-semibold">{unreadCount}</span>
            <span>Unread</span>
          </Badge>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={markAllAsRead}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={filter} onValueChange={(value: FilterType) => setFilter(value)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Alerts</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={(value: PriorityType) => setPriorityFilter(value)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={(value: AlertType) => setTypeFilter(value)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="medication">Medication</SelectItem>
                  <SelectItem value="appointment">Appointment</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="weather">Weather</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        // Enhanced loading skeletons
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="mb-4 overflow-hidden border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-5 w-48 mb-2" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-16 rounded-full" />
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                      </div>
                    </div>
                    <Skeleton className="h-8 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-16 w-full mt-4" />
                  <div className="flex justify-between mt-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAlerts.length === 0 ? (
        <Card className="mb-4 border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {searchQuery || filter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all' 
                ? "No matching alerts" 
                : "No active alerts"}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchQuery || filter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all'
                ? "Try adjusting your search or filters to see more results."
                : "You're all caught up! Check back later for new alerts and updates."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <Card 
              key={alert.id} 
              className={`mb-4 overflow-hidden border-l-4 transition-all duration-200 hover:shadow-md ${
                !readStatuses[alert.id] 
                  ? 'border-l-blue-500 bg-blue-50/30' 
                  : 'border-l-gray-200'
              } ${getPriorityStyle(alert.priority)}`}
            >
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-full mt-1 ${
                        alert.priority === 'critical' ? 'bg-red-100 text-red-600' :
                        alert.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                        alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg pr-2">{alert.title}</h3>
                          <Badge 
                            variant="outline" 
                            className={`${getPriorityBadgeStyle(alert.priority)} font-medium`}
                          >
                            {alert.priority}
                          </Badge>
                          {alert.actionRequired && (
                            <Badge variant="destructive" className="flex items-center gap-1 font-medium">
                              <AlertTriangle className="h-3 w-3" />
                              Action Required
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                          <Badge variant="outline" className="font-normal">
                            {alert.type}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(alert.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge 
                            variant="outline" 
                            className={`flex items-center gap-1 cursor-default ${
                              readStatuses[alert.id] 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {readStatuses[alert.id] ? (
                              <>
                                <Eye className="h-3 w-3" />
                                Read
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3" />
                                Unread
                              </>
                            )}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{readStatuses[alert.id] ? "You've read this alert" : "You haven't read this alert yet"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <div className="mt-4 pl-11">
                    <p className="text-gray-700 leading-relaxed">{alert.message}</p>
                    
                    {/* Display image if available */}
                    {alert.imageUrl && (
                      <div className="mt-4 relative h-48 sm:h-64 w-full rounded-lg overflow-hidden border">
                        <Image 
                          src={alert.imageUrl} 
                          alt={alert.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4 pt-4 border-t border-gray-100 pl-11">
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Created {formatDate(alert.createdAt)}
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
                          size="sm"
                          onClick={() => window.open(alert.actionLink, '_blank')}
                          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
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
      </div>
    </div>
  )
}