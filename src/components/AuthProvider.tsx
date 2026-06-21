"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Player {
  id: string;
  username: string;
  corporation: string;
  theme: string;
  osNotifications: boolean;
  showInventory: boolean;
  showListings: boolean;
  showArchived: boolean;
  showPreferences: boolean;
  discordUsername: string | null;
  shareFormat: string;
}

interface AuthContextType {
  player: Player | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  player: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setPlayer(data);
      } else {
        setPlayer(null);
      }
    } catch {
      setPlayer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setPlayer(null);
  };

  return (
    <AuthContext.Provider value={{ player, loading, refresh: fetchMe, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
