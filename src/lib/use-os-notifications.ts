"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export function useOsNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const shownRef = useRef<Set<string>>(new Set());

  // Request permission on mount
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("denied");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    if (Notification.permission === "granted") {
      setPermission("granted");
      return true;
    }
    if (Notification.permission === "denied") return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, []);

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions & { tag?: string }) => {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (Notification.permission !== "granted") return;

      const tag = options?.tag || title;
      // Don't show duplicate notifications with the same tag
      if (shownRef.current.has(tag)) return;
      shownRef.current.add(tag);

      const notification = new Notification(title, {
        icon: "/icon.svg",
        badge: "/icon.svg",
        ...options,
        tag,
      });

      notification.onclick = () => {
        window.focus();
        // Navigate to notifications page
        if (typeof window !== "undefined") {
          window.location.href = "/notifications";
        }
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);

      return notification;
    },
    []
  );

  const clearShown = useCallback(() => {
    shownRef.current.clear();
  }, []);

  return { permission, requestPermission, showNotification, clearShown };
}
