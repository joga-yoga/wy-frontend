import { useEffect, useState } from "react";

import { axiosInstance } from "@/lib/axiosInstance";

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    axiosInstance
      .get("/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setUser(response.data);
      })
      .catch((error) => {
        console.error("Error fetching user info", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { user, loading };
}
