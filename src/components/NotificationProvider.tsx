"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { useAuth } from "./AuthProvider";
import { useOsNotifications } from "@/lib/use-os-notifications";

interface NotificationContextType {
  unreadCount: number;
  refresh: () => Promise<void>;
  osNotificationPermission: NotificationPermission;
  requestOsNotificationPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refresh: async () => {},
  osNotificationPermission: "default",
  requestOsNotificationPermission: async () => false,
});

export function useNotifications() {
  return useContext(NotificationContext);
}

// Simple global event bus — any component can call notifyRefresh() to trigger a count update
const listeners = new Set<() => void>();
export function notifyRefresh() {
  listeners.forEach((fn) => fn());
}

const POLL_INTERVAL = 15000;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { player } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [osNotificationsEnabled, setOsNotificationsEnabled] = useState(true);
  const lastFetchRef = useRef(0);
  const prevCountRef = useRef(0);
  const { permission: osPermission, requestPermission: requestOsPermission, showNotification, clearShown } =
    useOsNotifications();

  // Read user's OS notification preference from player data
  useEffect(() => {
    if (player && typeof (player as any).osNotifications === "boolean") {
      setOsNotificationsEnabled((player as any).osNotifications);
    }
  }, [player]);

  const fetchCount = useCallback(async () => {
    if (!player) {
      setUnreadCount(0);
      return;
    }
    const now = Date.now();
    if (now - lastFetchRef.current < 3000) return;
    lastFetchRef.current = now;

    try {
      const res = await fetch(`/api/notifications?playerId=${player.id}&unread=true`);
      if (res.ok) {
        const data = await res.json();
        const newCount = data.length;

        // Show OS notification if count increased, browser permission granted, AND user preference enabled
        if (newCount > prevCountRef.current && prevCountRef.current > 0 && osPermission === "granted" && osNotificationsEnabled) {
          const newNotifications = data.slice(0, newCount - prevCountRef.current);
          for (const n of newNotifications) {
            showNotification("Hades Star Trade", {
              body: n.message,
              tag: n.id,
            });
          }
        }

        prevCountRef.current = newCount;
        setUnreadCount(newCount);
      }
    } catch { /* */ }
  }, [player, osPermission, showNotification]);

  const refresh = useCallback(async () => {
    lastFetchRef.current = 0;
    await fetchCount();
  }, [fetchCount]);

  // Initial fetch + background polling
  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchCount]);

  // Reset when player logs out
  useEffect(() => {
    if (!player) {
      setUnreadCount(0);
      clearShown();
    }
  }, [player, clearShown]);

  // Subscribe to global event bus
  useEffect(() => {
    const handler = () => {
      lastFetchRef.current = 0;
      fetchCount();
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, [fetchCount]);

  const requestOsNotificationPermission = useCallback(async () => {
    return requestOsPermission();
  }, [requestOsPermission]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        refresh,
        osNotificationPermission: osPermission,
        requestOsNotificationPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
