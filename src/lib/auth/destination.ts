import type { User } from "@/context/AuthContext";
import type { AppMode } from "@/lib/partnerMode";

/** Accept local destinations only; preserve their query and fragment verbatim. */
export function safeAuthNext(value: string | null | undefined): string | undefined {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\s]/.test(value)) return;
  return value;
}

/** The old email-only login URL doubles as its continuation, without device storage. */
export function authContinuation(params: Pick<URLSearchParams, "has" | "get">): string | undefined {
  if (params.has("next")) return safeAuthNext(params.get("next"));
  const email = params.get("email");
  return email ? `/account/login?email=${encodeURIComponent(email)}` : undefined;
}

export async function resolveAuthDestination(
  {
    next,
    user,
    mode,
    recovery = false,
  }: { next?: string | null; user: User | null; mode: AppMode | null; recovery?: boolean },
  hasInvitation: () => Promise<boolean>,
): Promise<string> {
  const target = safeAuthNext(next);
  if (target) {
    const url = new URL(target, "https://auth.invalid");
    if (url.pathname !== "/account/login") return target;
    // Never navigate back into login indefinitely. Only the legacy email-only
    // form is resolved here; explicit customer destinations never query invites.
    const email = url.searchParams.get("email");
    if (email && !url.searchParams.has("next")) {
      if (user && email.trim().toLowerCase() === user.email.trim().toLowerCase()) {
        try {
          if (await hasInvitation()) return "/account/partner";
        } catch {
          // Unconfirmed invitations cannot create a role.
        }
      }
    }
  }
  return user?.partner && (recovery || mode === "b2b") ? "/account/partner" : "/account";
}
