"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchToken, handleTokenRefresh } from "@/lib/firebase";

async function getNotificationPermissionAndToken() {
  // Step 1: Check if Notifications are supported in the browser.
  if (!("Notification" in window)) {
    console.info("This browser does not support desktop notification");
    return null;
  }

  console.log("Current notification permission:", Notification.permission);

  // Step 2: Check if permission is already granted.
  if (Notification.permission === "granted") {
    console.log("Permission already granted, fetching token...");
    const token = await fetchToken();
    console.log("getNotificationPermissionAndToken - token from fetchToken:", token);
    return token;
  }

  // Step 3: If permission is not denied, request permission from the user.
  if (Notification.permission !== "denied") {
    console.log("Requesting notification permission...");
    const permission = await Notification.requestPermission();
    console.log("Permission result:", permission);
    if (permission === "granted") {
      console.log("Permission granted, fetching token...");
      const token = await fetchToken();
      console.log("getNotificationPermissionAndToken - token after permission granted:", token);
      return token;
    }
  }

  console.log("Notification permission not granted.");
  return null;
}

const useFcmToken = () => {
  const router = useRouter(); // Initialize the router for navigation.
  const [notificationPermissionStatus, setNotificationPermissionStatus] =
    useState<NotificationPermission | null>(null); // State to store the notification permission status.
  const [token, setToken] = useState<string | null>(null); // State to store the FCM token.
  const isLoading = useRef(false); // Ref to keep track if a token fetch is currently in progress.

  const loadToken = useCallback(async () => {
    // Step 4: Prevent multiple fetches if already fetched or in progress.
    if (isLoading.current) return;

    // Retry logic with a loop instead of recursion
    for (let attempt = 0; attempt <= 3; attempt++) {
      isLoading.current = true; // Mark loading as in progress.
      const token = await getNotificationPermissionAndToken(); // Fetch the token.

      // Step 5: Handle the case where permission is denied.
      if (Notification.permission === "denied") {
        setNotificationPermissionStatus("denied");
        isLoading.current = false;
        return;
      }

      // Step 6: If token was fetched successfully, set it and return
      if (token) {
        setToken(token);
        setNotificationPermissionStatus(Notification.permission);
        isLoading.current = false;
        return;
      }

      // Step 7: If token fetch failed, wait before retrying.
      if (attempt < 3) {
        console.log(`Token fetch attempt ${attempt + 1} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      }
    }

    // Step 8: If all attempts failed, set permission status and stop loading.
    setNotificationPermissionStatus(Notification.permission);
    isLoading.current = false;
  }, []);

  const requestPermission = async () => {
    console.log("requestPermission - calling getNotificationPermissionAndToken");
    const token = await getNotificationPermissionAndToken();
    console.log("requestPermission - token received:", token);
    if (Notification.permission === "denied") {
      setNotificationPermissionStatus("denied");
      return null;
    }
    if (!token) {
      setNotificationPermissionStatus(Notification.permission);
      return null;
    }

    console.log("requestPermission - setting token state:", token);
    setNotificationPermissionStatus(Notification.permission);
    setToken(token);
    await handleTokenRefresh();
    return token;
  };

  useEffect(() => {
    // Remove the automatic token loading
    if ("Notification" in window) {
      setNotificationPermissionStatus(Notification.permission);
    }
  }, [loadToken]);

  useEffect(() => {
    const setupListener = async () => {
      const fcmMessaging = await import("@/lib/firebase").then(mod => mod.messaging());
      if (fcmMessaging) {
        // Listen for token refresh
        const unsubscribe = () => {}; // Placeholder for cleanup
        return unsubscribe;
      }
    };

    let unsubscribe: (() => void) | null = null;

    setupListener().then((unsub) => {
      unsubscribe = unsub || (() => {});
    });

    // Step 11: Cleanup the listener when the component unmounts.
    return () => unsubscribe?.();
  }, [token, router]); // Removed toast from dependencies

  return { token, notificationPermissionStatus, requestPermission }; // Return the token and permission status.
};

export default useFcmToken;