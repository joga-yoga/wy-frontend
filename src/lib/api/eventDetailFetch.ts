export class EventDetailNotFoundError extends Error {
  constructor(
    readonly eventType: "retreat" | "workshop",
    readonly id: string,
    readonly url: string,
  ) {
    super(`${eventType} detail not found: ${id}`);
    this.name = "EventDetailNotFoundError";
  }
}

export function isEventDetailNotFoundError(error: unknown): error is EventDetailNotFoundError {
  return error instanceof EventDetailNotFoundError;
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
  eventType: "retreat" | "workshop",
  id: string,
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_ENDPOINT;
  const url = `${baseUrl}/${eventType}s/${id}`;
  const startedAt = Date.now();

  try {
    const res = await fetch(url, {
      next: {
        revalidate: 300,
        tags: [`${eventType}s`],
      },
    });
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
    console.info("[event-detail] fetched", {
      eventType,
      id,
      url,
      status: res.status,
      durationMs,
    });

    return {
      ...data,
      organizer: data.partner ?? data.organizer ?? null,
    };
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
