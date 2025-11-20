"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const [show2FA, setShow2FA] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  // Fetch FCM Token
  useEffect(() => {
    async function getTokenFCM() {
      // Example: Replace with your own FCM token fetch logic
      try {
        const token = localStorage.getItem("fcm_token");
        if (token) setFcmToken(token);
      } catch (err) {
        console.log("FCM Token error:", err);
      }
    }
    getTokenFCM();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);

    const payload: any = {
      email: formData.get("email"),
      password: formData.get("password"),
      fcmToken,
      otp: formData.get("otp")
    };

    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.require2FA) {
      setShow2FA(true);
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      className={cn(
        "flex flex-col gap-6 p-4 bg-card rounded-lg border-2 border-border",
        className
      )}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email below to login to your account
        </p>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="m@example.com" required />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a href="#" className="ml-auto text-sm underline-offset-4 hover:underline">
              Forgot your password?
            </a>
          </div>
          <Input id="password" name="password" type="password" placeholder="Enter your password" required />
        </div>

        {/* 2FA Input (Only visible if backend requires OTP) */}
        {show2FA && (
          <div className="grid gap-2">
            <Label htmlFor="otp">2FA OTP</Label>
            <Input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              placeholder="Enter Google Authenticator OTP"
              required
            />
          </div>
        )}

        <Button type="submit" className="w-full">
          Login
        </Button>

        {/* OAuth Divider */}
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>

        {/* Google Login */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => (window.location.href = "/api/auth/google")}
        >
          <svg
            className="mr-2 h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M21.35 11.1H12v2.8h5.4c-.3 1.6-1.8 4.6-5.4 4.6-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2-2C16 3 14.1 2.2 12 2.2 6.9 2.2 3 6.1 3 11.2s3.9 9 9 9c5.2 0 9-3.7 9-9.1 0-.6 0-1-.1-1.2Z" />
          </svg>
          Login with Google
        </Button>

        {/* GitHub Button */}
        <Button variant="outline" className="w-full">
          <svg
            className="mr-2 h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303..." />
          </svg>
          Login with GitHub
        </Button>
      </div>

      <p className="text-center text-sm">
        Don’t have an account?{" "}
        <a href="/signup" className="underline underline-offset-4">
          Sign up
        </a>
      </p>
    </form>
  );
}
