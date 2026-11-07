import { axiosInstance } from "@/lib/axiosInstance";

export async function hasCurrentInvitation(): Promise<boolean> {
  const { data } = await axiosInstance.get<unknown>("/users/me/invitations");
  return Array.isArray(data) && data.length > 0;
}
