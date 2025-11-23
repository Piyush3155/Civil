// lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { v4 as uuidv4 } from 'uuid';

// IndexedDB helpers for persistent device ID
const DB_NAME = 'fcm-db';
const STORE_NAME = 'fcm-store';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

const getFromIndexedDB = async (key: string): Promise<string | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

const setInIndexedDB = async (key: string, value: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error storing in IndexedDB:', error);
  }
};

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const messaging = async () => {
  console.log("Checking FCM support...");
  const supported = await isSupported();
  console.log("FCM supported:", supported);
  return supported ? getMessaging(app) : null;
};

// Get or Generate Persistent Device ID
const getDeviceId = async (): Promise<string> => {
  let deviceId = await getFromIndexedDB("deviceId");

  if (!deviceId) {
    deviceId = uuidv4(); // Generate new UUID
    await setInIndexedDB("deviceId", deviceId); // Store it in IndexedDB
  }
  return deviceId;
};

enum DeviceType {
  ANDROID = "ANDROID",
  IOS = "IOS",
  MAC = "MAC",
  WINDOWS = "WINDOWS",
  LINUX = "LINUX",
  WEB = "WEB",
  OTHER = "OTHER",
}

const getDeviceType = (): DeviceType => {
  const userAgent = navigator.userAgent.toLowerCase();

  if (/android/i.test(userAgent)) return DeviceType.ANDROID;
  if (/iphone|ipad|ipod/i.test(userAgent)) return DeviceType.IOS;
  if (/macintosh|mac os x/i.test(userAgent)) return DeviceType.MAC;
  if (/windows|win32/i.test(userAgent)) return DeviceType.WINDOWS;
  if (/linux/i.test(userAgent)) return DeviceType.LINUX;

  return DeviceType.WEB; // Default to WEB for browsers if nothing matches
};

export const fetchToken = async () => {
  try {
    console.log("Checking if messaging is supported...");
    const fcmMessaging = await messaging();
    console.log("Messaging supported:", !!fcmMessaging);

    if (fcmMessaging) {
      console.log("Getting FCM token with VAPID key...");
      const token = await getToken(fcmMessaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      if (token) {
        console.log("FCM Token:", token);
        const deviceId = await getDeviceId(); // Get persistent device ID
        const deviceType = getDeviceType(); // Get device type
        console.log("Device ID:", deviceId, "Device Type:", deviceType);
        return token;
      } else {
        console.log("No token received from FCM");
      }
    } else {
      console.log("FCM messaging not supported in this environment");
    }
    return null;
  } catch (err) {
    console.error("An error occurred while fetching the token:", err);
    return null;
  }
};

// Handle token changes manually
export const handleTokenRefresh = async () => {
  const fcmMessaging = await messaging();
  if (fcmMessaging) {
    // Listen for messages when the app is in the foreground
    onMessage(fcmMessaging, async (payload) => {
      console.log("Message received:", payload);
      // Handle foreground messages here
    });
  }
};

export { app, messaging };