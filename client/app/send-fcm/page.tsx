"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Send, Users, User, UserCheck, AlertCircle } from "lucide-react"
import { sendFCMToRole, sendFCMToUser, sendFCMToMultipleUsers, sendTestFCM } from "@/app/actions/fcm"
import { fetchUsers } from "@/app/actions/user/main"
import { AppSidebar } from "@/components/app-sidebar"
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

export default function SendFCMPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [progress, setProgress] = useState(0)
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])

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
    fetchUsers().then(setUsers).catch(console.error)
  }, [])

  useEffect(() => {
    setFormData(prev => ({ ...prev, userIds: selectedUserIds.join(',') }))
  }, [selectedUserIds])

  const steps = [
    {
      id: 1,
      title: "Select Target",
      description: "Choose who receives this notification",
      icon: Users,
    },
    {
      id: 2,
      title: "Compose Message",
      description: "Write your notification content",
      icon: CheckCircle,
    },
    {
      id: 3,
      title: "Review & Send",
      description: "Confirm and send the notification",
      icon: Send,
    },
  ]

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
        click_action: formData.clickAction || undefined,
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
          const userIds = formData.userIds
            .split(",")
            .map((id) => id.trim())
            .filter((id) => id)
          result = await sendFCMToMultipleUsers(userIds, payload)
          break
      }

      setResult(result)
      setCurrentStep(4)
    } catch (err: any) {
      setError(err.message)
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
    } catch (err: any) {
      setError(err.message)
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

  const getTargetIcon = (type: TargetType) => {
    switch (type) {
      case "role":
        return <Users className="h-5 w-5" />
      case "user":
        return <User className="h-5 w-5" />
      case "multiple":
        return <UserCheck className="h-5 w-5" />
    }
  }

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Send FCM Notification</h1>
            <p className="text-sm text-muted-foreground">Send push notifications to users or roles</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Progress Steps */}
        <div className="mb-8 sm:mb-12">
          <div className="grid grid-cols-1 gap-4 sm:flex sm:items-center sm:justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              return (
                <div key={step.id} className="flex flex-col sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div
                      className={`flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full font-semibold transition-all ${
                        currentStep >= step.id
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "bg-muted text-muted-foreground border-2 border-border"
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                      ) : (
                        <StepIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                      )}
                    </div>
                    <div className="hidden sm:block">
                      <p
                        className={`text-sm font-semibold transition-colors ${
                          currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden sm:block ml-4 flex-1 h-1 mx-4 bg-gradient-to-r from-border to-border" />
                  )}
                </div>
              )
            })}
          </div>
          {/* Mobile step indicator */}
          <div className="flex items-center justify-center gap-2 mt-4 sm:hidden">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`h-2 w-2 rounded-full transition-all ${
                  currentStep >= step.id ? "bg-primary w-6" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-border shadow-lg">
          <CardHeader className="border-b border-border bg-gradient-to-r from-primary/5 to-accent/5 px-4 sm:px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                {getTargetIcon(formData.targetType)}
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl">{steps[currentStep - 1]?.title}</CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">{steps[currentStep - 1]?.description}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-4 sm:px-6 py-6 sm:py-8">
            <div className="space-y-6">
              {/* Step 1: Select Target */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="targetType" className="text-sm font-semibold">
                      Target Type
                    </Label>
                    <Select
                      value={formData.targetType}
                      onValueChange={(value: TargetType) => handleInputChange("targetType", value)}
                    >
                      <SelectTrigger id="targetType" className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="role">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Send to Role
                          </div>
                        </SelectItem>
                        <SelectItem value="user">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Send to Single User
                          </div>
                        </SelectItem>
                        <SelectItem value="multiple">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            Send to Multiple Users
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.targetType === "role" && (
                    <div>
                      <Label htmlFor="roleId" className="text-sm font-semibold">
                        Role ID
                      </Label>
                      <Input
                        id="roleId"
                        value={formData.roleId}
                        onChange={(e) => handleInputChange("roleId", e.target.value)}
                        placeholder="e.g., admin, moderator, user"
                        className="mt-2"
                      />
                    </div>
                  )}

                  {formData.targetType === "user" && (
                    <div>
                      <Label htmlFor="userId" className="text-sm font-semibold">
                        Select User
                      </Label>
                      <Select
                        value={formData.userId}
                        onValueChange={(value) => handleInputChange("userId", value)}
                      >
                        <SelectTrigger id="userId" className="mt-2">
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name || user.email} ({user.username})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.targetType === "multiple" && (
                    <div>
                      <Label className="text-sm font-semibold">
                        Select Users
                      </Label>
                      <div className="mt-2 max-h-40 overflow-y-auto border rounded-md p-2">
                        {users.map((user) => (
                          <div key={user.id} className="flex items-center justify-between py-1">
                            <span className="text-sm">{user.name || user.email} ({user.username})</span>
                            <Button
                              type="button"
                              variant={selectedUserIds.includes(user.id) ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                setSelectedUserIds(prev =>
                                  prev.includes(user.id)
                                    ? prev.filter(id => id !== user.id)
                                    : [...prev, user.id]
                                )
                              }}
                            >
                              {selectedUserIds.includes(user.id) ? "Selected" : "Select"}
                            </Button>
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Selected: {selectedUserIds.length} users
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Compose Message */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="title" className="text-sm font-semibold">
                      Notification Title
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Enter notification title"
                      className="mt-2"
                      maxLength={100}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">{formData.title.length}/100 characters</p>
                  </div>

                  <div>
                    <Label htmlFor="body" className="text-sm font-semibold">
                      Message Body
                    </Label>
                    <Textarea
                      id="body"
                      value={formData.body}
                      onChange={(e) => handleInputChange("body", e.target.value)}
                      placeholder="Enter notification message"
                      rows={4}
                      className="mt-2 resize-none"
                      maxLength={240}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">{formData.body.length}/240 characters</p>
                  </div>

                  <div>
                    <Label htmlFor="clickAction" className="text-sm font-semibold">
                      Click Action URL (optional)
                    </Label>
                    <Input
                      id="clickAction"
                      value={formData.clickAction}
                      onChange={(e) => handleInputChange("clickAction", e.target.value)}
                      placeholder="https://app.com/page"
                      type="url"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="data" className="text-sm font-semibold">
                      Additional Data (JSON, optional)
                    </Label>
                    <Textarea
                      id="data"
                      value={formData.data}
                      onChange={(e) => handleInputChange("data", e.target.value)}
                      placeholder='{"key": "value"}'
                      rows={2}
                      className="mt-2 resize-none font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Review & Send */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div className="rounded-lg bg-muted p-4 sm:p-6 border border-border">
                    <h3 className="font-semibold text-foreground mb-4">Notification Preview</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Target</p>
                        <Badge variant="secondary" className="mt-1">
                          {formData.targetType === "role"
                            ? `Role: ${formData.roleId}`
                            : formData.targetType === "user"
                              ? `User: ${formData.userId}`
                              : `${formData.userIds.split(",").length} users`}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Title</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{formData.title}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Message</p>
                        <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{formData.body}</p>
                      </div>
                      {formData.clickAction && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Click Action</p>
                          <p className="mt-1 text-sm text-primary break-all">{formData.clickAction}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {isSending && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Sending notification...</Label>
                        <span className="text-xs font-semibold text-primary">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  {error && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 flex gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-destructive text-sm">Error</p>
                        <p className="text-sm text-destructive/80 mt-1">{error}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Success */}
              {currentStep === 4 && result && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 sm:p-6 flex gap-4">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-green-900 dark:text-green-200">
                        Notification Sent Successfully!
                      </h3>
                      <div className="mt-3 space-y-2 text-sm text-green-800 dark:text-green-300">
                        <div className="flex justify-between">
                          <span className="font-medium">Successful:</span>
                          <span className="font-semibold">{result.success} recipients</span>
                        </div>
                        {result.failure > 0 && (
                          <div className="flex justify-between">
                            <span className="font-medium">Failed:</span>
                            <span className="font-semibold">{result.failure} recipients</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-green-200 dark:border-green-800">
                          <span className="font-medium">Target:</span>
                          <span className="font-semibold">{result.targetDescription}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:justify-between pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1 || isSending}
                className="w-full sm:w-auto bg-transparent"
              >
                Previous
              </Button>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {currentStep === 1 && (
                  <Button
                    variant="outline"
                    onClick={handleTestSend}
                    disabled={isSending}
                    className="w-full sm:w-auto bg-transparent"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Test
                  </Button>
                )}

                {currentStep < 3 ? (
                  <Button onClick={nextStep} disabled={!validateStep(currentStep)} className="w-full sm:w-auto">
                    Next
                  </Button>
                ) : currentStep === 3 ? (
                  <Button onClick={handleSend} disabled={isSending} className="w-full sm:w-auto">
                    <Send className="h-4 w-4 mr-2" />
                    {isSending ? "Sending..." : "Send Notification"}
                  </Button>
                ) : (
                  <Button onClick={resetForm} className="w-full sm:w-auto">
                    Send Another
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
