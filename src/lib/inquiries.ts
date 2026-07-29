import { axiosInstance } from "@/lib/axiosInstance";

/**
 * Inquiries (rezerwacje + pytania) are auth-linked: sending one requires an account.
 * That is a deliberate product change — it is what lets the partner see who is asking
 * and lets the asker keep their own history. Callers must route anonymous users through
 * login first, using {@link loginRedirectHref}.
 */
export type InquiryKind = "reservation" | "question";

export interface InquiryPayload {
  kind: InquiryKind;
  /** At least one of event/instructor/studio is required — the backend rejects a contextless inquiry. */
  event_id?: string;
  instructor_id?: string;
  studio_id?: string;
  message?: string;
  preferred_contact?: string;
}

export async function submitInquiry(payload: InquiryPayload) {
  const { data } = await axiosInstance.post("/inquiries", payload);
  return data;
}

/** Login URL that returns the user to where they were once they are signed in. */
export function loginRedirectHref(returnTo: string) {
  return `/konto/logowanie?next=${encodeURIComponent(returnTo)}`;
}
