"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock } from "lucide-react";
import { login, storeFcmToken } from "@/app/actions/user/main";
import { updateUserToken } from "@/app/actions/notification/main";
import { useRouter } from "next/navigation";
import { setAuthenticated } from "@/lib/session";
import useFcmToken from "@/hooks/useFcmToken";
import { getDeviceId } from "@/lib/firebase";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);

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
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      className={cn(
        "flex flex-col gap-6 p-8 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 shadow-2xl transition-all duration-300 hover:shadow-primary/5",
        className
      )}
      {...props}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="p-3 rounded-full bg-primary/10 mb-2">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      <div className="grid gap-5">
        <div className="grid gap-2.5">
          <Label htmlFor="email" className="text-sm font-medium">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="name@example.com" 
              className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary transition-colors" 
              required 
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid gap-2.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <a 
              href="#" 
              className="text-xs text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
            >
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input 
              id="password" 
              name="password" 
              type="password" 
              placeholder="Enter your password" 
              className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary transition-colors" 
              required 
              disabled={isLoading}
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-500 text-center">
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-primary/25 transition-all duration-300"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>

        {/* OAuth Divider */}
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border/50">
          <span className="relative z-10 bg-card px-3 text-muted-foreground text-xs font-medium">
            Or continue with
          </span>
        </div>

        {/* OAuth Buttons */}
        <div className="grid gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 bg-background/50 hover:bg-background border-border/50 hover:border-border transition-all duration-300"
            onClick={() => (window.location.href = "/api/auth/google")}
            disabled={isLoading}
          >
            <svg
              className="mr-2 h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M21.35 11.1H12v2.8h5.4c-.3 1.6-1.8 4.6-5.4 4.6-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2-2C16 3 14.1 2.2 12 2.2 6.9 2.2 3 6.1 3 11.2s3.9 9 9 9c5.2 0 9-3.7 9-9.1 0-.6 0-1-.1-1.2Z" />
            </svg>
            Continue with Google
          </Button>

          <Button 
            type="button"
            variant="outline" 
            className="w-full h-11 bg-background/50 hover:bg-background border-border/50 hover:border-border transition-all duration-300"
            disabled={isLoading}
          >
            <svg
              className="mr-2 h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            Continue with GitHub
          </Button>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <a 
            href="/signup" 
            className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
          >
            Create account
          </a>
        </p>
      </div>
    </form>
  );
}
