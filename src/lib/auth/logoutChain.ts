export function clearAuthStorage() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("access_token");
}
