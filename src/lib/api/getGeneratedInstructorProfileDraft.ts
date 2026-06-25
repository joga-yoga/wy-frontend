import type { GeneratedInstructorProfileDraft } from "@/types/instructor";

export class GeneratedInstructorProfileDraftNotFoundError extends Error {
  constructor(readonly token: string) {
    super(`Generated instructor profile draft not found: ${token}`);
    this.name = "GeneratedInstructorProfileDraftNotFoundError";
  }
}

export function isGeneratedInstructorProfileDraftNotFoundError(
  error: unknown,
): error is GeneratedInstructorProfileDraftNotFoundError {
  return (
    error instanceof GeneratedInstructorProfileDraftNotFoundError ||
    (error as Error)?.name === "GeneratedInstructorProfileDraftNotFoundError"
  );
}

async function fetchGeneratedInstructorProfileDraft(
  token: string,
): Promise<GeneratedInstructorProfileDraft> {
  const baseUrl = process.env.API_ENDPOINT ?? process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!baseUrl) {
    throw new Error("API_ENDPOINT or NEXT_PUBLIC_API_ENDPOINT is not configured");
  }

  const res = await fetch(`${baseUrl}/instructor-profile-drafts/${token}`, {
    cache: "no-store",
  });

  if (res.status === 404 || res.status === 410) {
    throw new GeneratedInstructorProfileDraftNotFoundError(token);
  }

  if (!res.ok) {
    throw new Error(
      `Failed to fetch generated instructor profile draft: ${res.status} ${res.statusText}`,
    );
  }

  return res.json();
}

export async function getGeneratedInstructorProfileDraft(
  token: string,
): Promise<GeneratedInstructorProfileDraft | null> {
  try {
    return await fetchGeneratedInstructorProfileDraft(token);
  } catch (error) {
    if (isGeneratedInstructorProfileDraftNotFoundError(error)) {
      return null;
    }

    console.error("Error fetching generated instructor profile draft:", error);
    throw error;
  }
}
