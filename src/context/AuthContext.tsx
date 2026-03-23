import axios from "axios";
import { AxiosError } from "axios";
import { jwtDecode } from "jwt-decode";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

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
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isUnauthorizedError(error: unknown) {
  return error instanceof AxiosError && error.response?.status === 401;
}

function isIgnorableAuthRefreshError(error: unknown) {
  if (error instanceof AxiosError) {
    if (error.code === "ERR_CANCELED") {
      return true;
    }

    if (!error.response) {
      return true;
    }
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("object may no longer exist") ||
      message.includes("load failed") ||
      message.includes("the network connection was lost")
    );
  }

  return false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const clearToken = useCallback(() => {
    clearAuthStorage();
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const response = await axiosInstance.get("/me");
      setUser((prevUser) => ({ ...response.data, name: prevUser?.name }));
    } catch (error) {
      if (isUnauthorizedError(error)) {
        clearToken();
        return;
      }

      if (!isIgnorableAuthRefreshError(error)) {
        console.error("Failed to refresh current user", error);
      }
    }
  }, [clearToken]);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const token = localStorage.getItem("access_token");

      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          if (isMounted) {
            setUser({
              id: decoded.sub,
              email: decoded.email,
              name: decoded.name,
              organizer: null,
            });
          }
          await refreshUser();
        } catch (error) {
          clearToken();
        }
      } else if (isMounted) {
        setUser(null);
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [clearToken, refreshUser]);

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

  function signOut() {
    const currentOrigin = window.location.origin;
    const finalRedirect = process.env.NEXT_PUBLIC_PROFILE_HOST || currentOrigin;
    const startUrl = buildGlobalLogoutStartUrl({
      currentOrigin,
      finalRedirect,
    });

    window.location.assign(startUrl);
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
