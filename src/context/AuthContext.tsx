import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

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
  // add other properties as necessary
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
          id: decoded.sub, // adjust based on your JWT payload
          email: decoded.email,
          name: decoded.name,
          organizer: null, // Initially we don't know about the organizer
        });
        // After setting user from token, refresh from backend to get full user object
        refreshUser();
      } catch (error) {
        console.error("Failed to decode token", error);
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  async function refreshUser() {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const response = await axiosInstance.get("/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Keep the name from the token, as the backend doesn't provide it
        setUser((prevUser) => ({ ...response.data, name: prevUser?.name }));
      } catch (error) {
        console.error("Error refreshing user", error);
        clearToken();
      }
    }
  }

  function updateUserFromToken() {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUser({
          id: decoded.sub, // adjust based on your JWT payload
          email: decoded.email,
          name: decoded.name,
          organizer: null, // Initially we don't know about the organizer
        });
        // After setting user from token, refresh from backend to get full user object
        refreshUser();
      } catch (error) {
        console.error("Failed to decode token", error);
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
    localStorage.removeItem("access_token");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    router.push("/");
  }

  function clearToken() {
    localStorage.removeItem("access_token");
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
