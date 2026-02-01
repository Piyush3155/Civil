"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, ArrowRight, CheckCircle2, KeyRound } from "lucide-react";
import { login, storeFcmToken } from "@/app/actions/user/main";
import { requestPasswordReset } from "@/app/actions/password-reset/main";
import { updateUserToken } from "@/app/actions/notification/main";
import { useRouter } from "next/navigation";
import { setAuthenticated } from "@/lib/session";
import useFcmToken from "@/hooks/useFcmToken";
import { getDeviceId } from "@/lib/firebase";
import { toast } from "sonner";
import { motion, HTMLMotionProps } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function LoginForm({
  className,
  ...props
}: HTMLMotionProps<"form">) {
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [resetRequestSent, setResetRequestSent] = useState(false);
  const router = useRouter();
  const { token, requestPermission } = useFcmToken();

  // Request FCM permission on component mount
  useEffect(() => {
    const setupFCM = async () => {
      if ("Notification" in window) {
        // Request permission if not already granted
        if (Notification.permission === "default") {
          await requestPermission();
        }
      }
    };
    setupFCM();
  }, [requestPermission]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const result = await login(formData);
      
      // Store the access token in localStorage for client-side API calls
      if (result.token) {
        localStorage.setItem('accessToken', result.token);
      }
      
      setAuthenticated(true);

      // Try to get FCM token - if not available, request it
      let fcmToken = token;
      if (!fcmToken) {
        console.log("FCM token not available, requesting permission...");
        fcmToken = await requestPermission();
      }

      // Store FCM token if available
      if (fcmToken) {
        // Get device info for token storage
        const deviceId = await getDeviceId();
        const deviceType = "WEB";

        console.log("Storing FCM token after login:", { token: fcmToken.substring(0, 20) + "...", deviceId, deviceType });

        // Small delay to ensure session is fully established
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
          await updateUserToken(fcmToken, deviceId, deviceType);
          console.log("FCM token stored successfully");
        } catch (fcmError) {
          console.error("Failed to store FCM token with updateUserToken, trying alternative method:", fcmError);

          // Try alternative method using storeFcmToken
          try {
            await storeFcmToken(fcmToken, deviceType);
            console.log("FCM token stored successfully using alternative method");
          } catch (altError) {
            console.error("Failed to store FCM token with alternative method:", altError);
            // Don't fail login if FCM storage fails
          }
        }
      } else {
        console.log("No FCM token available to store after login");
      }

      router.push('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      const displayMessage = errorMessage.toLowerCase().includes('unauthorized') || errorMessage.toLowerCase().includes('invalid') 
        ? 'Invalid email or password' 
        : errorMessage;
      toast.error(displayMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setIsRequestingReset(true);
    try {
      await requestPasswordReset(forgotPasswordEmail);
      setResetRequestSent(true);
      toast.success("Password reset request sent to admin");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request password reset';
      toast.error(errorMessage);
    } finally {
      setIsRequestingReset(false);
    }
  };

  const handleCloseDialog = () => {
    setIsForgotPasswordOpen(false);
    setForgotPasswordEmail("");
    setResetRequestSent(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.form
      variants={containerVariants}
      initial="hidden"
      animate="show"
      onSubmit={handleLogin}
      className={cn(
        "flex flex-col gap-6",
        className
      )}
      {...props}
    >
      <motion.div variants={itemVariants} className="flex flex-col gap-2 text-center sm:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
        <p className="text-muted-foreground text-sm">
          Please enter your credentials to access your dashboard.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="email" className="text-sm font-medium pl-1">
            Email
          </Label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground/70 transition-colors group-hover:text-primary group-focus-within:text-primary" />
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="name@civildesk.com" 
              className="pl-11 h-12 bg-muted/40 border-transparent hover:bg-muted/60 focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 rounded-xl" 
              required 
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between pl-1">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
              <DialogTrigger asChild>
                <button 
                  type="button"
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-primary" />
                    Reset Password
                  </DialogTitle>
                  <DialogDescription>
                    {resetRequestSent 
                      ? "Your password reset request has been sent to the administrator. You will be notified when your password has been reset."
                      : "Enter your email address and we'll send a password reset request to the administrator."}
                  </DialogDescription>
                </DialogHeader>
                {resetRequestSent ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-4">
                    <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                      Please wait for the admin to process your request. You will receive a new password once approved.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="forgot-email">Email Address</Label>
                      <div className="relative group">
                        <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground/70" />
                        <Input
                          id="forgot-email"
                          type="email"
                          placeholder="Enter your registered email"
                          value={forgotPasswordEmail}
                          onChange={(e) => setForgotPasswordEmail(e.target.value)}
                          className="pl-10"
                          autoComplete="email"
                        />
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  {resetRequestSent ? (
                    <Button onClick={handleCloseDialog} className="w-full">
                      Close
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" onClick={handleCloseDialog} type="button">
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleForgotPassword} 
                        disabled={isRequestingReset || !forgotPasswordEmail}
                        className="gap-2"
                      >
                        {isRequestingReset ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Request"
                        )}
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground/70 transition-colors group-hover:text-primary group-focus-within:text-primary" />
            <Input 
              id="password" 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              className="pl-11 h-12 bg-muted/40 border-transparent hover:bg-muted/60 focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 rounded-xl" 
              required 
              disabled={isLoading}
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 mt-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl font-medium text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              Sign in <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="text-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <span className="text-primary font-medium hover:underline cursor-pointer">
            Contact Admin
          </span>
        </p>
      </motion.div>
    </motion.form>
  );
}

