import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

import { buildGlobalLogoutStartUrl, clearAuthStorage } from "@/lib/auth/logoutChain";
import { axiosInstance } from "@/lib/axiosInstance";

type Organizer = {
  id: string;
  user_id: string;
  name?: string;
  description?: string;
  image_id?: string;
  phone_number?: string;
  phone_verified: boolean;
};

type User = {
  id: string;
  email: string;
  name?: string;
  organizer?: Organizer | null;
};

type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
  updateUserFromToken: () => void;
  storeToken: (token: string) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUser({
          id: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          organizer: null,
        });
        refreshUser();
      } catch (error) {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  async function refreshUser() {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const response = await axiosInstance.get("/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser((prevUser) => ({ ...response.data, name: prevUser?.name }));
    } catch (error) {
      clearToken();
    }
  }

  function updateUserFromToken() {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUser({
          id: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          organizer: null,
        });
        refreshUser();
      } catch (error) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }

  function storeToken(token: string) {
    localStorage.setItem("access_token", token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    updateUserFromToken();
  }

  async function signOut() {
    try {
      await axiosInstance.post("/logout");
    } catch (error) {
      // Ignore network/logout errors and clear local auth state anyway.
    } finally {
      clearToken();

      const currentOrigin = window.location.origin;
      const finalRedirect = process.env.NEXT_PUBLIC_PROFILE_HOST || currentOrigin;
      const startUrl = buildGlobalLogoutStartUrl({
        currentOrigin,
        finalRedirect,
      });

      window.location.href = startUrl;
    }
  }

  function clearToken() {
    clearAuthStorage();
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, refreshUser, updateUserFromToken, storeToken, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
