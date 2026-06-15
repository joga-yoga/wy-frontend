import { cacheLife, cacheTag } from "next/cache";

export class EventDetailNotFoundError extends Error {
  constructor(
    readonly eventType: "class" | "retreat" | "workshop" | "course",
    readonly id: string,
    readonly url: string,
  ) {
    super(`${eventType} detail not found: ${id}`);
    this.name = "EventDetailNotFoundError";
  }
}

export function isEventDetailNotFoundError(error: unknown): error is EventDetailNotFoundError {
  return (
    error instanceof EventDetailNotFoundError ||
    (error as Error)?.name === "EventDetailNotFoundError"
  );
}

function safeErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { message: String(error) };
}

export async function fetchEventDetail<T>(
  eventType: "class" | "retreat" | "workshop" | "course",
  id: string,
): Promise<T> {
  "use cache";

  const baseUrl = process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_ENDPOINT is not configured");
  }

  const collection =
    eventType === "class" ? "classes" : eventType === "course" ? "courses" : `${eventType}s`;
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag(collection, `${eventType}:${id}`);

  const url = `${baseUrl}/${collection}/${id}`;
  const startedAt = Date.now();

  try {
    const res = await fetch(url);
    const durationMs = Date.now() - startedAt;

    if (res.status === 404) {
      console.warn("[event-detail] not found", {
        eventType,
        id,
        url,
        status: res.status,
        durationMs,
      });
      throw new EventDetailNotFoundError(eventType, id, url);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => null);
      console.error("[event-detail] backend returned error", {
        eventType,
        id,
        url,
        status: res.status,
        statusText: res.statusText,
        durationMs,
        body,
      });
      throw new Error(`Failed to fetch ${eventType}: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    return {
      ...(data as object),
      organizer: data.partner ?? data.organizer ?? null,
    } as T;
  } catch (error) {
    if (isEventDetailNotFoundError(error)) {
      throw error;
    }

    console.error("[event-detail] request failed", {
      eventType,
      id,
      url,
      durationMs: Date.now() - startedAt,
      error: safeErrorDetails(error),
    });
    throw error;
  }
}
