"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import useFcmToken from "@/hooks/useFcmToken";

interface NotificationContextType {
  notificationPermissionStatus: NotificationPermission | null;
  requestPermission: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { notificationPermissionStatus, requestPermission } = useFcmToken();
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  if (notificationPermissionStatus === null) {
    return (
      <div className="flex justify-center flex-col items-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          {/* Simple responsive spinner */}
          <div className="relative">
            <div className="w-8 h-8 sm:w-12 sm:lg:h-12 lg:w-16 lg:h-16 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
          </div>
          {/* Loading text */}
          <div className="text-center">
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 font-medium">
              Setting up notifications...
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              This will only take a moment
            </p>
          </div>
        </div>
        {showButton && (
          <Button onClick={requestPermission} className="mt-5 z-101 relative">
            Allow Notification Permission
          </Button>
        )}
      </div>
    );
  }

  return (
    <NotificationContext.Provider
      value={{ notificationPermissionStatus, requestPermission }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};