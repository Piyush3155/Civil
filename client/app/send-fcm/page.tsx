"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Send, Users, User, UserCheck } from "lucide-react";
import { sendFCMToRole, sendFCMToUser, sendFCMToMultipleUsers, sendTestFCM } from "@/app/actions/fcm";

type TargetType = "role" | "user" | "multiple";

interface FormData {
  targetType: TargetType;
  roleId: string;
  userId: string;
  userIds: string;
  title: string;
  body: string;
  clickAction: string;
  data: string;
}

export default function SendFCMPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    targetType: "role",
    roleId: "",
    userId: "",
    userIds: "",
    title: "",
    body: "",
    clickAction: "",
    data: "",
  });

  const steps = [
    { id: 1, title: "Select Target", description: "Choose who to send the notification to" },
    { id: 2, title: "Compose Message", description: "Enter the notification details" },
    { id: 3, title: "Send & Confirm", description: "Review and send the notification" },
  ];

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (formData.targetType === "role" && !formData.roleId.trim()) return false;
        if (formData.targetType === "user" && !formData.userId.trim()) return false;
        if (formData.targetType === "multiple" && !formData.userIds.trim()) return false;
        return true;
      case 2:
        return !!(formData.title.trim() && formData.body.trim());
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleSend = async () => {
    setIsSending(true);
    setError(null);
    setResult(null);
    simulateProgress();

    try {
      const payload = {
        title: formData.title,
        body: formData.body,
        click_action: formData.clickAction || undefined,
        data: formData.data ? JSON.parse(formData.data) : undefined,
      };

      let result;
      switch (formData.targetType) {
        case "role":
          result = await sendFCMToRole(formData.roleId, payload);
          break;
        case "user":
          result = await sendFCMToUser(formData.userId, payload);
          break;
        case "multiple":
          const userIds = formData.userIds.split(",").map(id => id.trim()).filter(id => id);
          result = await sendFCMToMultipleUsers(userIds, payload);
          break;
      }

      setResult(result);
      setCurrentStep(4); // Success step
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSending(false);
      setProgress(100);
    }
  };

  const handleTestSend = async () => {
    setIsSending(true);
    setError(null);
    setResult(null);
    simulateProgress();

    try {
      const result = await sendTestFCM();
      setResult(result);
      setCurrentStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSending(false);
      setProgress(100);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setProgress(0);
    setResult(null);
    setError(null);
    setFormData({
      targetType: "role",
      roleId: "",
      userId: "",
      userIds: "",
      title: "",
      body: "",
      clickAction: "",
      data: "",
    });
  };

  const getTargetIcon = (type: TargetType) => {
    switch (type) {
      case "role": return <Users className="h-4 w-4" />;
      case "user": return <User className="h-4 w-4" />;
      case "multiple": return <UserCheck className="h-4 w-4" />;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Send FCM Notification</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    currentStep >= step.id ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground text-muted-foreground"
                  }`}>
                    {currentStep > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
                  </div>
                  <div className="ml-2">
                    <p className={`text-sm font-medium ${currentStep >= step.id ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-4 ${currentStep > step.id ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getTargetIcon(formData.targetType)}
                {steps[currentStep - 1]?.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="targetType">Target Type</Label>
                    <Select value={formData.targetType} onValueChange={(value: TargetType) => handleInputChange("targetType", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="role">Send to Role</SelectItem>
                        <SelectItem value="user">Send to Single User</SelectItem>
                        <SelectItem value="multiple">Send to Multiple Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.targetType === "role" && (
                    <div>
                      <Label htmlFor="roleId">Role ID</Label>
                      <Input
                        id="roleId"
                        value={formData.roleId}
                        onChange={(e) => handleInputChange("roleId", e.target.value)}
                        placeholder="Enter role ID"
                      />
                    </div>
                  )}

                  {formData.targetType === "user" && (
                    <div>
                      <Label htmlFor="userId">User ID</Label>
                      <Input
                        id="userId"
                        value={formData.userId}
                        onChange={(e) => handleInputChange("userId", e.target.value)}
                        placeholder="Enter user ID"
                      />
                    </div>
                  )}

                  {formData.targetType === "multiple" && (
                    <div>
                      <Label htmlFor="userIds">User IDs (comma-separated)</Label>
                      <Textarea
                        id="userIds"
                        value={formData.userIds}
                        onChange={(e) => handleInputChange("userIds", e.target.value)}
                        placeholder="user1,user2,user3"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Notification title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="body">Body</Label>
                    <Textarea
                      id="body"
                      value={formData.body}
                      onChange={(e) => handleInputChange("body", e.target.value)}
                      placeholder="Notification message"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="clickAction">Click Action URL (optional)</Label>
                    <Input
                      id="clickAction"
                      value={formData.clickAction}
                      onChange={(e) => handleInputChange("clickAction", e.target.value)}
                      placeholder="https://app.com/page"
                    />
                  </div>

                  <div>
                    <Label htmlFor="data">Additional Data (JSON, optional)</Label>
                    <Textarea
                      id="data"
                      value={formData.data}
                      onChange={(e) => handleInputChange("data", e.target.value)}
                      placeholder='{"key": "value"}'
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Review Notification</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Target:</strong> {formData.targetType === "role" ? `Role ${formData.roleId}` : formData.targetType === "user" ? `User ${formData.userId}` : `Multiple users: ${formData.userIds}`}</p>
                      <p><strong>Title:</strong> {formData.title}</p>
                      <p><strong>Body:</strong> {formData.body}</p>
                      {formData.clickAction && <p><strong>Click Action:</strong> {formData.clickAction}</p>}
                      {formData.data && <p><strong>Data:</strong> {formData.data}</p>}
                    </div>
                  </div>

                  {isSending && (
                    <div className="space-y-2">
                      <Label>Sending notification...</Label>
                      <Progress value={progress} className="w-full" />
                    </div>
                  )}

                  {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                      <p className="text-destructive">{error}</p>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 4 && result && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-green-800">Notification Sent Successfully!</h3>
                    </div>
                    <div className="text-sm text-green-700">
                      <p>Success: {result.success}</p>
                      <p>Failure: {result.failure}</p>
                      <p>Target: {result.targetDescription}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1 || isSending}
                >
                  Previous
                </Button>

                <div className="flex gap-2">
                  {currentStep === 1 && (
                    <Button variant="outline" onClick={handleTestSend} disabled={isSending}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Test to Me
                    </Button>
                  )}

                  {currentStep < 3 ? (
                    <Button onClick={nextStep} disabled={!validateStep(currentStep)}>
                      Next
                    </Button>
                  ) : currentStep === 3 ? (
                    <Button onClick={handleSend} disabled={isSending}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Notification
                    </Button>
                  ) : (
                    <Button onClick={resetForm}>
                      Send Another
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}