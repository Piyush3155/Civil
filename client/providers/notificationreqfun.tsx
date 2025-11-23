"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import useFcmToken from "@/hooks/useFcmToken";

interface NotificationServiceProps {
	onComplete?: () => void;
}

const NotificationService = ({ onComplete }: NotificationServiceProps = {}) => {
	const { notificationPermissionStatus, requestPermission } = useFcmToken();
	const [showButton, setShowButton] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setShowButton(true);
		}, 5000);
		return () => clearTimeout(timer);
	}, []);

	// Notify parent when permission status changes - handles both null and non-null cases
	useEffect(() => {
		// If permission status is not null and onComplete is provided, call it
		if (notificationPermissionStatus !== null && onComplete) {
			onComplete();
		}
	}, [notificationPermissionStatus, onComplete]);

	// Render UI based on permission status
	if (notificationPermissionStatus === null) {
		return (
			<div className="fixed inset-0 flex justify-center items-center bg-inherit bg-opacity-75 z-100">
				<div className="flex flex-col items-center space-y-4">
					{/* Simple responsive spinner */}
					<div className="relative">
						<div className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
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
					<Button
						onClick={() => {
							requestPermission();
							// If user manually clicks, we'll give it a moment then complete
							if (onComplete) {
								setTimeout(onComplete, 2000);
							}
						}}
						className="mt-5 z-101 relative"
					>
						Allow Notification Permission
					</Button>
				)}
			</div>
		);
	}

	// Permission already handled, return null without conditional hooks
	return null;
};

export default NotificationService;