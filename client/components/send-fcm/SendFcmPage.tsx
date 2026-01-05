"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  CheckCircle, 
  Send, 
  Users, 
  User, 
  UserCheck, 
  AlertCircle, 
  Bell, 
  Search, 
  ArrowRight, 
  ArrowLeft,
  Smartphone,
  Check,
  Sparkles,
  Wifi,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { sendFCMToRole, sendFCMToUser, sendFCMToMultipleUsers, sendTestFCM } from "@/app/actions/fcm"
import { fetchUsers } from "@/app/actions/user/main"
import { FCMResult, User as UserType } from "@/types/fcm"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { SidebarTrigger } from "../ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "../ui/breadcrumb"

type TargetType = "role" | "user" | "multiple"

interface FormData {
  targetType: TargetType
  roleId: string
  userId: string
  userIds: string
  title: string
  body: string
  clickAction: string
  data: string
}

export default function SendFcmPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [progress, setProgress] = useState(0)
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState<FCMResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<UserType[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [customKey, setCustomKey] = useState("")
  const [customValue, setCustomValue] = useState("")
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    targetType: "role",
    roleId: "",
    userId: "",
    userIds: "",
    title: "",
    body: "",
    clickAction: "",
    data: "",
  })

  useEffect(() => {
    fetchUsers().then(data => setUsers(Array.isArray(data.users) ? data.users : [])).catch(console.error)
  }, [])

  useEffect(() => {
    setFormData(prev => ({ ...prev, userIds: selectedUserIds.join(',') }))
  }, [selectedUserIds])

  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return users
    const query = userSearchQuery.toLowerCase()
    return users.filter(user => 
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query)
    )
  }, [users, userSearchQuery])

  const handleSelectAll = () => {
    const allFilteredIds = filteredUsers.map(user => user.id)
    setSelectedUserIds(prev => Array.from(new Set([...prev, ...allFilteredIds])))
  }

  const handleDeselectAll = () => {
    setSelectedUserIds([])
  }

  const steps = [
    { id: 1, title: "Audience", description: "Who receives this?", icon: Users },
    { id: 2, title: "Content", description: "Draft your message", icon: Sparkles },
    { id: 3, title: "Review", description: "Final check", icon: CheckCircle },
  ]

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addCustomData = () => {
    if (!customKey.trim()) return
    const currentData = formData.data ? JSON.parse(formData.data) : {}
    const newData = { ...currentData, [customKey.trim()]: customValue.trim() }
    setFormData(prev => ({ ...prev, data: JSON.stringify(newData) }))
    setCustomKey("")
    setCustomValue("")
  }

  const removeCustomData = (keyToRemove: string) => {
    const currentData = formData.data ? JSON.parse(formData.data) : {}
    const { [keyToRemove]: _, ...newData } = currentData
    setFormData(prev => ({ ...prev, data: Object.keys(newData).length ? JSON.stringify(newData) : "" }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (formData.targetType === "role" && !formData.roleId.trim()) return false
        if (formData.targetType === "user" && !formData.userId.trim()) return false
        if (formData.targetType === "multiple" && !formData.userIds.trim()) return false
        return true
      case 2:
        return !!(formData.title.trim() && formData.body.trim())
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const simulateProgress = () => {
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const handleSend = async () => {
    setIsSending(true)
    setError(null)
    setResult(null)
    simulateProgress()

    try {
      const payload = {
        title: formData.title,
        body: formData.body,
        clickAction: formData.clickAction || undefined,
        data: formData.data ? JSON.parse(formData.data) : undefined,
      }

      let result
      switch (formData.targetType) {
        case "role":
          result = await sendFCMToRole(formData.roleId, payload)
          break
        case "user":
          result = await sendFCMToUser(formData.userId, payload)
          break
        case "multiple":
          const userIds = formData.userIds.split(",").map((id) => id.trim()).filter((id) => id)
          result = await sendFCMToMultipleUsers(userIds, payload)
          break
      }

      setResult(result)
      setCurrentStep(4)
      
      // Show appropriate success message based on results
      if (result.success > 0) {
        toast.success(`Notification sent to ${result.success} device${result.success > 1 ? 's' : ''}!`, {
          description: result.failure > 0 ? `Some devices (${result.failure}) couldn't be reached` : undefined
        })
      } else if (result.failure > 0) {
        // All failed but don't show error if it's just token issues
        toast.info("No active devices found", {
          description: "Users may need to refresh their app to receive notifications"
        })
      }
    } catch (error: unknown) {
      console.error("Send notification error:", error)
      // Only show user-friendly errors, not token-related issues
      const errorMessage = error instanceof Error ? error.message : ""
      if (!errorMessage.includes("token") && !errorMessage.includes("registration")) {
        toast.error("Failed to send notification", {
          description: "Please check your connection and try again"
        })
        setError("Unable to send notification. Please try again.")
      } else {
        // Token error - treat as partial success
        toast.info("Notification queued", {
          description: "Some devices may not receive it immediately"
        })
      }
    } finally {
      setIsSending(false)
      setProgress(100)
    }
  }

  const handleTestSend = async () => {
    setIsSending(true)
    setError(null)
    setResult(null)
    simulateProgress()
    try {
      const result = await sendTestFCM()
      setResult(result)
      setCurrentStep(4)
      
      if (result.success > 0) {
        toast.success("Test notification sent!", {
          description: "Check your device for the notification"
        })
      } else {
        toast.info("No active device found", {
          description: "Please ensure you're logged in on a device with notifications enabled"
        })
      }
    } catch (error: unknown) {
      console.error("Test send error:", error)
      const errorMessage = error instanceof Error ? error.message : ""
      if (!errorMessage.includes("token") && !errorMessage.includes("registration")) {
        toast.error("Failed to send test", {
          description: "Please check your connection"
        })
        setError("Unable to send test notification.")
      } else {
        toast.info("No active device registered", {
          description: "Log in on a device to receive test notifications"
        })
      }
    } finally {
      setIsSending(false)
      setProgress(100)
    }
  }

  const resetForm = () => {
    setCurrentStep(1)
    setProgress(0)
    setResult(null)
    setError(null)
    setSelectedUserIds([])
    setFormData({
      targetType: "role",
      roleId: "",
      userId: "",
      userIds: "",
      title: "",
      body: "",
      clickAction: "",
      data: "",
    })
  }

  // --- UI Components ---

  const PhonePreview = () => (
    <div className="mx-auto w-[280px] h-[550px] bg-black rounded-[3rem] p-3 shadow-2xl border-4 border-gray-800 relative overflow-hidden ring-1 ring-white/10">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-20"></div>
      
      {/* Screen Content */}
      <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[2.2rem] overflow-hidden relative text-white">
        
        {/* Status Bar */}
        <div className="absolute top-2 w-full px-6 flex justify-between items-center text-[10px] font-medium z-10 opacity-90">
          <span>9:41</span>
          <div className="flex gap-1.5">
            <Wifi className="h-3 w-3" />
            <div className="h-3 w-4 bg-white/20 rounded-sm border border-white/40 relative">
               <div className="absolute inset-0.5 bg-white rounded-sm w-[70%]"></div>
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="mt-16 flex flex-col items-center opacity-90">
            <span className="text-sm font-medium">Tuesday, November 30</span>
            <span className="text-5xl font-light tracking-tight mt-1">9:41</span>
        </div>

        {/* Notification Card */}
        <div className="absolute top-1/3 left-0 w-full px-3">
            {formData.title || formData.body ? (
                <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-3 shadow-lg animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                            <div className="h-5 w-5 bg-black rounded-md flex items-center justify-center">
                                <Bell className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-white/90 uppercase">APP NAME</span>
                        </div>
                        <span className="text-[10px] text-white/70">Now</span>
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-0.5 leading-tight">{formData.title || "Notification Title"}</h4>
                    <p className="text-xs text-white/90 leading-snug">{formData.body || "Notification content will appear here..."}</p>
                </div>
            ) : (
                 <div className="flex flex-col items-center justify-center text-white/40 mt-10">
                    <Bell className="h-8 w-8 mb-2 opacity-50" />
                    <span className="text-xs">No notifications</span>
                 </div>
            )}
        </div>
        
        {/* Bottom Actions */}
         <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-full px-8 flex justify-between z-10">
             <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Smartphone className="h-5 w-5 opacity-80" />
             </div>
             <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <ArrowRight className="h-5 w-5 opacity-80" />
             </div>
         </div>
      </div>
    </div>
  )

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const isActive = currentStep === step.id
        const isCompleted = currentStep > step.id
        const isLast = index === steps.length - 1

        return (
          <div key={step.id} className="flex items-center">
             <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
                isActive ? "bg-primary text-primary-foreground shadow-lg scale-105" : 
                isCompleted ? "bg-muted text-muted-foreground" : "text-muted-foreground opacity-50"
             )}>
                {isCompleted ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                <span className="text-sm font-medium hidden sm:inline-block">{step.title}</span>
             </div>
             {!isLast && (
                 <div className={cn("w-8 h-[2px] mx-2", isCompleted ? "bg-primary" : "bg-muted")} />
             )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="bg-background">
      <header className="hidden md:flex h-16 shrink-0 items-center gap-2 px-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-20">
         <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Send FCM</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
            <StepIndicator />

            <div className={cn(
                "grid gap-8 transition-all duration-500",
                currentStep >= 2 ? "lg:grid-cols-2 items-start" : "max-w-3xl mx-auto"
            )}>
                
                {/* LEFT SIDE - FORM */}
                <Card className="border-0 shadow-xl ring-1 ring-border/50 overflow-hidden bg-background/60 backdrop-blur-sm h-fit">
                    <div className="h-1 bg-gradient-to-r from-primary to-purple-600" />
                    <CardContent className="p-6 md:p-8">
                        
                        {/* STEP 1: TARGET */}
                        {currentStep === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold tracking-tight">Select Audience</h2>
                                    <p className="text-muted-foreground">Who should receive this notification?</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {[
                                        { id: "role", label: "Group Role", icon: Users },
                                        { id: "user", label: "Single User", icon: User },
                                        { id: "multiple", label: "User List", icon: UserCheck },
                                    ].map((type) => (
                                        <div 
                                            key={type.id}
                                            onClick={() => handleInputChange("targetType", type.id)}
                                            className={cn(
                                                "cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition-all hover:bg-muted/50",
                                                formData.targetType === type.id 
                                                    ? "border-primary bg-primary/5 text-primary" 
                                                    : "border-transparent bg-muted/30"
                                            )}
                                        >
                                            <type.icon className="h-6 w-6" />
                                            <span className="font-medium text-sm">{type.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {formData.targetType === "role" && (
                                    <div className="animate-in fade-in zoom-in-95 p-4 rounded-xl bg-muted/30 border">
                                        <Label>Target Role ID</Label>
                                        <Input 
                                            value={formData.roleId} 
                                            onChange={(e) => handleInputChange("roleId", e.target.value)}
                                            placeholder="e.g. admin, subscriber" 
                                            className="mt-2 bg-background"
                                        />
                                    </div>
                                )}

                                {formData.targetType === "user" && (
                                    <div className="animate-in fade-in zoom-in-95 p-4 rounded-xl bg-muted/30 border">
                                        <Label>Select Individual</Label>
                                        <Select value={formData.userId} onValueChange={(val) => handleInputChange("userId", val)}>
                                            <SelectTrigger className="mt-2 bg-background">
                                                <SelectValue placeholder="Search user..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.map(u => (
                                                    <SelectItem key={u.id} value={u.id}>{u.name || u.username}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {formData.targetType === "multiple" && (
                                    <div className="animate-in fade-in zoom-in-95 space-y-4">
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                    placeholder="Filter users..." 
                                                    className="pl-9 bg-background"
                                                    value={userSearchQuery}
                                                    onChange={(e) => setUserSearchQuery(e.target.value)}
                                                />
                                            </div>
                                            <Button variant="outline" size="sm" onClick={handleSelectAll}>All</Button>
                                            <Button variant="ghost" size="sm" onClick={handleDeselectAll}>None</Button>
                                        </div>

                                        <ScrollArea className="h-64 rounded-xl border bg-muted/10 p-2">
                                            <div className="space-y-1">
                                                {filteredUsers.map(user => {
                                                    const isSelected = selectedUserIds.includes(user.id)
                                                    return (
                                                        <div 
                                                            key={user.id}
                                                            onClick={() => setSelectedUserIds(prev => 
                                                                isSelected ? prev.filter(id => id !== user.id) : [...prev, user.id]
                                                            )}
                                                            className={cn(
                                                                "flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm transition-colors",
                                                                isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn("w-4 h-4 rounded border flex items-center justify-center", isSelected ? "bg-primary border-primary" : "border-muted-foreground")}>
                                                                    {isSelected && <Check className="h-3 w-3 text-white" />}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span>{user.name || "Unknown"}</span>
                                                                    <span className="text-xs text-muted-foreground opacity-70">@{user.username}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </ScrollArea>
                                        <div className="flex flex-wrap gap-1">
                                            {selectedUserIds.slice(0, 5).map(id => (
                                                <Badge key={id} variant="secondary" className="text-xs">
                                                    {users.find(u => u.id === id)?.username}
                                                </Badge>
                                            ))}
                                            {selectedUserIds.length > 5 && (
                                                <Badge variant="outline" className="text-xs">+{selectedUserIds.length - 5} more</Badge>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STEP 2: COMPOSE */}
                        {currentStep === 2 && (
                            <div className="space-y-5 animate-in slide-in-from-left-4 duration-500">
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <Label>Notification Title</Label>
                                        <span className="text-xs text-muted-foreground">{formData.title.length}/100</span>
                                    </div>
                                    <Input 
                                        value={formData.title} 
                                        onChange={(e) => handleInputChange("title", e.target.value)}
                                        placeholder="Grab their attention" 
                                        maxLength={100}
                                        className="h-11 font-medium"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <Label>Body Message</Label>
                                        <span className="text-xs text-muted-foreground">{formData.body.length}/240</span>
                                    </div>
                                    <Textarea 
                                        value={formData.body} 
                                        onChange={(e) => handleInputChange("body", e.target.value)}
                                        placeholder="What do you want to tell them?" 
                                        className="resize-none"
                                        rows={4}
                                        maxLength={240}
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-4 pt-2">
                                    <div className="rounded-xl border bg-muted/20 overflow-hidden">
                                        <button 
                                            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                                            className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                                        >
                                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                                Advanced Options
                                            </h4>
                                            {isAdvancedOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                        </button>
                                        
                                        {isAdvancedOpen && (
                                            <div className="p-4 pt-0 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Click Action URL</Label>
                                                    <Input 
                                                        value={formData.clickAction} 
                                                        onChange={(e) => handleInputChange("clickAction", e.target.value)}
                                                        placeholder="https://example.com/page" 
                                                        className="h-9 mt-1 text-sm"
                                                    />
                                                    <p className="text-xs text-muted-foreground/70 mt-1">Where users go when they tap the notification</p>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                        Custom Data Payload
                                                    </Label>
                                                    
                                                    <div className="flex gap-2">
                                                        <Input 
                                                            placeholder="Key (e.g. orderId)" 
                                                            className="h-9 text-sm flex-1"
                                                            value={customKey}
                                                            onChange={(e) => setCustomKey(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && addCustomData()}
                                                        />
                                                        <Input 
                                                            placeholder="Value" 
                                                            className="h-9 text-sm flex-1"
                                                            value={customValue}
                                                            onChange={(e) => setCustomValue(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && addCustomData()}
                                                        />
                                                        <Button 
                                                            size="sm" 
                                                            variant="secondary"
                                                            onClick={addCustomData}
                                                            disabled={!customKey.trim()}
                                                            className="h-9 px-3"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    {formData.data && (
                                                        <div className="space-y-1 mt-2">
                                                            {Object.entries(JSON.parse(formData.data) || {}).map(([key, value]) => (
                                                                <div key={key} className="flex items-center justify-between p-2 bg-background rounded border text-xs group">
                                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                                        <span className="font-mono font-medium text-primary shrink-0">{key}:</span>
                                                                        <span className="font-mono text-muted-foreground truncate">{String(value)}</span>
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => removeCustomData(key)}
                                                                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <p className="text-[10px] text-muted-foreground/70">
                                                        Additional data sent to the app (hidden from user)
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3 & 4: REVIEW & SUCCESS */}
                        {(currentStep === 3 || currentStep === 4) && (
                            <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
                                {!result ? (
                                    <>
                                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3 items-start">
                                            <div className="bg-primary/10 p-2 rounded-lg">
                                                <Send className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-foreground">Ready to Send?</h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    You are about to notify 
                                                    <span className="font-bold text-foreground">
                                                        {formData.targetType === 'multiple' ? ` ${selectedUserIds.length} users` : ` 1 ${formData.targetType}`}
                                                    </span>.
                                                    This action cannot be undone.
                                                </p>
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg flex items-start gap-2">
                                                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="font-medium">Unable to Send</p>
                                                    <p className="text-xs opacity-90 mt-1">{error}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            <div className="flex justify-between py-2 border-b border-dashed">
                                                <span className="text-sm text-muted-foreground">Target</span>
                                                <Badge variant="outline" className="capitalize">{formData.targetType}</Badge>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-dashed">
                                                <span className="text-sm text-muted-foreground">Title</span>
                                                <span className="text-sm font-medium truncate max-w-[200px]">{formData.title}</span>
                                            </div>
                                            {isSending && (
                                                <div className="py-4">
                                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-primary to-purple-600 transition-all duration-300 animate-pulse" style={{width: `${progress}%`}} />
                                                    </div>
                                                    <p className="text-center text-xs text-muted-foreground mt-2 flex items-center justify-center gap-2">
                                                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{animationDelay: '0ms'}} />
                                                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{animationDelay: '150ms'}} />
                                                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{animationDelay: '300ms'}} />
                                                        <span className="ml-1">Sending notification...</span>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center py-6">
                                        {result.success > 0 ? (
                                            <>
                                                <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-4 animate-bounce">
                                                    <CheckCircle className="h-8 w-8" />
                                                </div>
                                                <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">Sent Successfully!</h3>
                                                <p className="text-muted-foreground mt-2">Delivered to {result.success} device{result.success > 1 ? 's' : ''}.</p>
                                                
                                                {result.failure > 0 && (
                                                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm rounded-lg flex items-start gap-2">
                                                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                                        <div className="text-left">
                                                            <p className="font-medium">Partial Delivery</p>
                                                            <p className="text-xs opacity-90 mt-1">{result.failure} device{result.failure > 1 ? 's' : ''} couldn&apos;t be reached (likely due to expired tokens or logged out users)</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mb-4">
                                                    <Bell className="h-8 w-8" />
                                                </div>
                                                <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-400">No Active Devices</h3>
                                                <p className="text-muted-foreground mt-2 max-w-sm">The target users don&apos;t have active notification tokens. They may need to log in or enable notifications.</p>
                                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-sm rounded-lg">
                                                    <p className="text-xs">💡 Invalid tokens have been automatically removed from the database</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* NAVIGATION BUTTONS */}
                        <div className="flex gap-3 mt-8 pt-6 border-t">
                            <Button 
                                variant="outline" 
                                onClick={prevStep} 
                                disabled={currentStep === 1 || isSending || !!result}
                                className="flex-1 sm:flex-none"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" /> Back
                            </Button>
                            
                            <div className="flex-1" />

                            {currentStep === 1 && (
                                <Button variant="secondary" onClick={handleTestSend} disabled={isSending}>
                                    Test Send
                                </Button>
                            )}

                            {currentStep < 3 ? (
                                <Button onClick={nextStep} disabled={!validateStep(currentStep)} className="min-w-[120px]">
                                    Next <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            ) : !result ? (
                                <Button onClick={handleSend} disabled={isSending} className="min-w-[140px] bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity">
                                    {isSending ? "Sending..." : "Send Notification"}
                                </Button>
                            ) : (
                                <Button onClick={resetForm}>Send Another</Button>
                            )}
                        </div>

                    </CardContent>
                </Card>

                {/* RIGHT SIDE - PREVIEW (Visible on Steps 2, 3, 4) */}
                {(currentStep >= 2) && (
                    <div className="hidden lg:flex flex-col items-center justify-center sticky top-24 animate-in fade-in slide-in-from-right-8 duration-700">
                        <div className="text-center mb-6">
                            <Badge variant="outline" className="mb-2 bg-background/50 backdrop-blur">Live Preview</Badge>
                            <h3 className="font-semibold text-lg">Lock Screen View</h3>
                            <p className="text-sm text-muted-foreground">How it looks on a user&apos;s device</p>
                        </div>
                        <PhonePreview />
                    </div>
                )}
            </div>
        </main>
      </div>
    )
}