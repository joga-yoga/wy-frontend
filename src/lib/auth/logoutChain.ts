export function clearAuthStorage() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("access_token");
  localStorage.removeItem("wy_auth_next");
}
