"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { AlertTriangle, Plus, Trash, Edit, Search, X, ArrowUp, Mail, Info } from "lucide-react"
import { Alert as AlertModel, AlertFormData, convertToAlertFormData, convertToAlert } from "../models"
import { db, storage } from "@/lib/firebase"
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  Timestamp,
  serverTimestamp
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { toast } from "sonner"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DatePicker } from "@/components/ui/date-picker"

export default function ManageAlertsPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [alerts, setAlerts] = useState<AlertModel[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<AlertFormData>({
    title: "",
    message: "",
    type: "health",
    priority: "medium",
    active: true,
    actionRequired: false,
    actionLink: "",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [currentAlertId, setCurrentAlertId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [alertToDelete, setAlertToDelete] = useState<AlertModel | null>(null)
  const [activeTab, setActiveTab] = useState("create")
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined)
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false)
  const [alertToNotify, setAlertToNotify] = useState<AlertModel | null>(null)
  const [isSendingNotification, setIsSendingNotification] = useState(false)
  
  // Fetch all alerts on component mount
  useEffect(() => {
    fetchAlerts()
  }, [user])

  // Fetch alerts from Firebase
  const fetchAlerts = async () => {
    if (!user) return

    setLoading(true)
    try {
      const alertsQuery = query(
        collection(db, "alerts"),
        orderBy("createdAt", "desc")
      )
      
      const querySnapshot = await getDocs(alertsQuery)
      const alertsData: AlertModel[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<AlertModel, "id">
        
        alertsData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt 
            ? (data.createdAt as any).toDate().toISOString() 
            : data.createdAt,
          updatedAt: data.updatedAt && typeof data.updatedAt === 'object' && 'toDate' in data.updatedAt 
            ? (data.updatedAt as any).toDate().toISOString() 
            : data.updatedAt,
          expiresAt: data.expiresAt && typeof data.expiresAt === 'object' && 'toDate' in data.expiresAt 
            ? (data.expiresAt as any).toDate() 
            : data.expiresAt,
        })
      })
      
      setAlerts(alertsData)
    } catch (error) {
      console.error("Error fetching alerts:", error)
      toast.error("Failed to load alerts")
    } finally {
      setLoading(false)
    }
  }
  
  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
  
  // Handle select input changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
  
  // Handle switch input changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }
  
  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setImageFile(file)
    
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview(null)
    }
  }
  
  // Clear image
  const handleClearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    
    // Reset the file input
    const fileInput = document.getElementById("image-upload") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error("You must be logged in to create alerts")
      return
    }
    
    if (!formData.title || !formData.message) {
      toast.error("Title and message are required")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      let imageUrl = formData.imageUrl || null
      
      // Upload image if provided
      if (imageFile) {
        console.log('📤 Uploading image file:', imageFile.name);
        
        // Create form data for upload
        const uploadFormData = new FormData()
        uploadFormData.append('file', imageFile)
        
        // Try Firebase Storage upload first
        try {
          console.log('🔄 Attempting Firebase Storage upload...');
          const response = await fetch('/api/alerts/upload-image', {
            method: 'POST',
            body: uploadFormData
          });
          
          const responseData = await response.json();
          
          if (!response.ok) {
            throw new Error(responseData.error || `Firebase upload failed with status: ${response.status}`);
          }
          
          console.log('✅ Firebase Storage upload successful');
          imageUrl = responseData.imageUrl;
        } catch (firebaseError) {
          console.error('❌ Firebase Storage upload failed:', firebaseError);
          
          // Fall back to local storage
          console.log('🔄 Falling back to local storage upload...');
          try {
            const localResponse = await fetch('/api/alerts/upload-local', {
              method: 'POST',
              body: uploadFormData
            });
            
            const localResponseData = await localResponse.json();
            
            if (!localResponse.ok) {
              throw new Error(localResponseData.error || `Local upload failed with status: ${localResponse.status}`);
            }
            
            console.log('✅ Local storage upload successful');
            imageUrl = localResponseData.imageUrl;
          } catch (localError) {
            console.error('❌ Local storage upload failed:', localError);
            throw new Error('All image upload methods failed');
          }
        }
      }
      
      // Create alert data object with proper timestamp handling
      const alertData = convertToAlert({
        ...formData,
        imageUrl: imageUrl || undefined,
        expiresAt: expiryDate || null // Use null instead of undefined
      })
      
      if (isEditing && currentAlertId) {
        // Update existing alert
        const alertRef = doc(db, "alerts", currentAlertId)
        
        
        // If updating with a new image, delete the old one
        if (imageFile && formData.imageUrl) {
          try {
            // Use server-side API to delete the old image
            const response = await fetch('/api/alerts/delete-image', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ imageUrl: formData.imageUrl })
            });
            
            if (!response.ok) {
              console.error("Failed to delete old image:", await response.text());
            }
          } catch (error) {
            console.error("Error deleting old image:", error)
          }
        }
        
        await updateDoc(alertRef, {
          ...alertData,
          updatedAt: serverTimestamp()
        })
        
        toast.success("Alert updated successfully")
      } else {
        // Create new alert
        await addDoc(collection(db, "alerts"), {
          ...alertData,
          expiresAt: alertData.expiresAt ? Timestamp.fromDate(alertData.expiresAt as Date) : null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        
        toast.success("Alert created successfully")
      }
      
      // Reset form and refresh alerts
      resetForm()
      fetchAlerts()
      setActiveTab("list")
    } catch (error) {
      console.error("Error saving alert:", error)
      toast.error("Failed to save alert")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Load alert data for editing
  const handleEditAlert = (alert: AlertModel) => {
    const formData = convertToAlertFormData(alert)
    setFormData(formData)
    setCurrentAlertId(alert.id)
    setIsEditing(true)
    setImagePreview(formData.imageUrl || null)
    setExpiryDate(alert.expiresAt instanceof Date ? alert.expiresAt : 
      alert.expiresAt ? new Date(alert.expiresAt) : undefined)
    setActiveTab("create")
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  
  // Confirm delete alert
  const confirmDeleteAlert = (alert: AlertModel) => {
    setAlertToDelete(alert)
    setDeleteDialogOpen(true)
  }
  
  // Confirm send notification
  const confirmSendNotification = (alert: AlertModel) => {
    setAlertToNotify(alert)
    setNotifyDialogOpen(true)
  }
  
  // Send email notification
  const handleSendNotification = async () => {
    if (!alertToNotify) return
    
    setIsSendingNotification(true)
    try {
      const response = await fetch("/api/alerts/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          alertId: alertToNotify.id
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to send notifications")
      }
      
      toast.success("Email notifications sent successfully")
      setNotifyDialogOpen(false)
      setAlertToNotify(null)
    } catch (error) {
      console.error("Error sending notifications:", error)
      toast.error("Failed to send notifications")
    } finally {
      setIsSendingNotification(false)
    }
  }
  
  // Delete alert
  const handleDeleteAlert = async () => {
    if (!alertToDelete) return
    
    try {
      // Delete the alert document
      await deleteDoc(doc(db, "alerts", alertToDelete.id))
      
      // Delete the image if it exists
      if (alertToDelete.imageUrl) {
        try {
          // Use server-side API to delete the image
          const response = await fetch('/api/alerts/delete-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imageUrl: alertToDelete.imageUrl })
          });
          
          if (!response.ok) {
            console.error("Failed to delete image:", await response.text());
          }
        } catch (error) {
          console.error("Error deleting image:", error)
        }
      }
      
      toast.success("Alert deleted successfully")
      fetchAlerts()
      setDeleteDialogOpen(false)
      setAlertToDelete(null)
    } catch (error) {
      console.error("Error deleting alert:", error)
      toast.error("Failed to delete alert")
    }
  }
  
  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      type: "health",
      priority: "medium",
      active: true,
      actionRequired: false,
      actionLink: "",
    })
    setImageFile(null)
    setImagePreview(null)
    setIsEditing(false)
    setCurrentAlertId(null)
    setExpiryDate(undefined)
  }
  
  // Filter alerts by search query
  const filteredAlerts = alerts.filter((alert) => {
    const query = searchQuery.toLowerCase()
    return (
      alert.title.toLowerCase().includes(query) ||
      alert.message.toLowerCase().includes(query) ||
      alert.type.toLowerCase().includes(query) ||
      alert.priority.toLowerCase().includes(query)
    )
  })
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Manage Health & Community Alerts</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="create">
            {isEditing ? "Edit Alert" : "Create New Alert"}
          </TabsTrigger>
          <TabsTrigger value="list">View All Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? "Edit Alert" : "Create New Alert"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <Label htmlFor="title">Alert Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter alert title"
                      required
                    />
                  </div>
                  
                  {/* Message */}
                  <div>
                    <Label htmlFor="message">Alert Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Enter alert message"
                      rows={5}
                      required
                    />
                  </div>
                  
                  {/* Type and Priority */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Alert Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => handleSelectChange("type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select alert type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="health">Health</SelectItem>
                          <SelectItem value="medication">Medication</SelectItem>
                          <SelectItem value="appointment">Appointment</SelectItem>
                          <SelectItem value="weather">Weather</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => handleSelectChange("priority", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Expiry Date */}
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                    <div className="mt-1">
                      <DatePicker
                        date={expiryDate}
                        setDate={setExpiryDate}
                        placeholder="Select expiry date"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Alert will automatically become inactive after this date
                    </p>
                  </div>
                  
                  {/* Switches */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="active">Active</Label>
                        <p className="text-sm text-gray-500">
                          Alert is visible to users
                        </p>
                      </div>
                      <Switch
                        id="active"
                        checked={formData.active}
                        onCheckedChange={(checked) => handleSwitchChange("active", checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="actionRequired">Action Required</Label>
                        <p className="text-sm text-gray-500">
                          Users should take action
                        </p>
                      </div>
                      <Switch
                        id="actionRequired"
                        checked={formData.actionRequired}
                        onCheckedChange={(checked) => handleSwitchChange("actionRequired", checked)}
                      />
                    </div>
                  </div>
                  
                  {/* Action Link */}
                  <div>
                    <Label htmlFor="actionLink">Action Link (Optional)</Label>
                    <Input
                      id="actionLink"
                      name="actionLink"
                      value={formData.actionLink || ""}
                      onChange={handleInputChange}
                      placeholder="https://example.com/resource"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      URL for users to learn more or take action
                    </p>
                  </div>
                  
                  {/* Image Upload */}
                  <div>
                    <Label htmlFor="image-upload">Image (Optional)</Label>
                    <div className="mt-1 flex items-center">
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="max-w-md"
                      />
                      {(imageFile || imagePreview) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleClearImage}
                          className="ml-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="mt-3 relative h-48 w-full max-w-md rounded-md overflow-hidden">
                        <Image
                          src={imagePreview}
                          alt="Image preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Form Actions */}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : isEditing ? "Update Alert" : "Create Alert"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>All Alerts</CardTitle>
                
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search alerts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-full"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded">
                      <div>
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-9 w-9 rounded" />
                        <Skeleton className="h-9 w-9 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No alerts found</h3>
                  <p className="text-gray-500 mt-2">
                    {searchQuery
                      ? "No alerts match your search criteria"
                      : "You haven't created any alerts yet"}
                  </p>
                  {searchQuery && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setSearchQuery("")}
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAlerts.map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {alert.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{alert.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                alert.priority === "critical"
                                  ? "destructive"
                                  : alert.priority === "high"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {alert.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={alert.active ? "default" : "outline"}
                              className={
                                alert.active ? "bg-green-100 text-green-800" : ""
                              }
                            >
                              {alert.active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(alert.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditAlert(alert)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => confirmSendNotification(alert)}
                                disabled={!alert.active}
                                title={alert.active ? "Send email notification" : "Inactive alerts cannot be sent"}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => confirmDeleteAlert(alert)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              <div className="mt-4 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => fetchAlerts()}
                  className="flex items-center gap-2"
                >
                  <ArrowUp className="h-4 w-4" />
                  Refresh
                </Button>
                
                <Button
                  onClick={() => {
                    resetForm()
                    setActiveTab("create")
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create New Alert
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Alert</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this alert? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {alertToDelete && (
            <div className="py-2">
              <h3 className="font-medium">{alertToDelete.title}</h3>
              <p className="text-sm text-gray-500 truncate">{alertToDelete.message}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAlert}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Send Notification Confirmation Dialog */}
      <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email Notification</DialogTitle>
            <DialogDescription>
              This will send an email notification to all users who have subscribed to health alerts.
              Use this feature for important announcements only.
            </DialogDescription>
          </DialogHeader>
          
          {alertToNotify && (
            <div className="py-2">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium">{alertToNotify.title}</h3>
              </div>
              <p className="text-sm text-gray-700 mb-2">{alertToNotify.message}</p>
              <div className="flex gap-2 text-sm">
                <Badge variant="outline">{alertToNotify.type}</Badge>
                <Badge 
                  variant={
                    alertToNotify.priority === "critical"
                      ? "destructive"
                      : alertToNotify.priority === "high"
                      ? "default"
                      : "secondary"
                  }
                >
                  {alertToNotify.priority}
                </Badge>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNotifyDialogOpen(false)}
              disabled={isSendingNotification}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleSendNotification}
              disabled={isSendingNotification}
              className="flex items-center gap-1"
            >
              {isSendingNotification ? (
                "Sending..."
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Notification
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}