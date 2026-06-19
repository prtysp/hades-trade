"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { useAuth } from "./AuthProvider";

interface NotificationContextType {
  unreadCount: number;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refresh: async () => {},
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
  const lastFetchRef = useRef(0);

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
        setUnreadCount(data.length);
      }
    } catch { /* */ }
  }, [player]);

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

  // Subscribe to global event bus
  useEffect(() => {
    const handler = () => {
      lastFetchRef.current = 0;
      fetchCount();
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, [fetchCount]);

  useEffect(() => {
    if (!player) setUnreadCount(0);
  }, [player]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}
