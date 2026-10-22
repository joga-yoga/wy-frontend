import { isAxiosError } from "axios";

import { axiosInstance } from "@/lib/axiosInstance";

import type { ImportJob, ImportRecord, RecordKind, RecordPage, ReviewIssue, Value } from "./types";
const root = "/studio-migrations";
export const importsApi = {
  offer: (studioId?: string, jobId?: string) =>
    axiosInstance
      .get<{ enabled: boolean; eligible: boolean }>(`${root}/transfer-offer`, {
        params: { studio_id: studioId, job_id: jobId },
      })
      .then((r) => r.data),
  optOut: (studioId?: string, jobId?: string) =>
    axiosInstance.post(`${root}/transfer-offer/opt-out`, null, {
      params: { studio_id: studioId, job_id: jobId },
    }),
  config: () => axiosInstance.get<{ enabled: boolean }>(`${root}/config`).then((r) => r.data),
  list: () => axiosInstance.get<ImportJob[]>(root).then((r) => r.data),
  create: (body: {
    origin_studio_id?: string;
    source_uuid: string;
    api_key: string;
    start_date: string;
    end_date: string;
    timezone: string;
  }) => axiosInstance.post<ImportJob>(root, body).then((r) => r.data),
  job: (id: string) => axiosInstance.get<ImportJob>(`${root}/${id}`).then((r) => r.data),
  records: (id: string, kind: RecordKind, search: string, offset: number, day?: string) =>
    axiosInstance
      .get<RecordPage>(`${root}/${id}/records`, {
        params: { kind, search, offset, day, limit: 30 },
      })
      .then((r) => r.data),
  choices: (id: string, kind: RecordKind, offset = 0) =>
    axiosInstance
      .get<RecordPage>(`${root}/${id}/records`, { params: { kind, offset, limit: 100 } })
      .then((r) => r.data),
  edit: (
    id: string,
    revision: number,
    record: Pick<ImportRecord, "id"> & { selected?: boolean; overrides?: Record<string, Value> },
  ) =>
    axiosInstance
      .patch<ImportJob>(`${root}/${id}/selection`, { revision, records: [record] })
      .then((r) => r.data),
  start: (id: string, revision: number) =>
    axiosInstance.post<ImportJob>(`${root}/${id}/import`, { revision }).then((r) => r.data),
  action: (id: string, operation: "cancel" | "retry" | "refresh" | "retry-assets") =>
    axiosInstance.post<ImportJob>(`${root}/${id}/${operation}`).then((r) => r.data),
  reconnect: (id: string, api_key: string) =>
    axiosInstance.post<ImportJob>(`${root}/${id}/reconnect`, { api_key }).then((r) => r.data),
  publish: (id: string, record: string, enable_bookings: boolean) =>
    axiosInstance
      .post<ImportJob>(`${root}/${id}/publish/${record}`, {
        reviewed: true,
        enable_bookings,
        reservations_not_transferred_acknowledged: enable_bookings,
      })
      .then((r) => r.data),
};
export function importError(error: unknown): {
  message: string;
  issues: ReviewIssue[];
  code?: string;
} {
  const detail: unknown = isAxiosError(error) ? error.response?.data?.detail : null;
  const value =
    detail && typeof detail === "object" && !Array.isArray(detail)
      ? (detail as { code?: string; issues?: ReviewIssue[] })
      : {};
  const messages: Record<string, string> = {
    migration_transfer_closed: "Przenoszenie dla tego studia zostało już zakończone lub wyłączone.",
    migration_context_conflict:
      "Ten import jest już rozpoczęty dla innego studia. Wróć do zapisanego importu.",
    migration_encryption_unavailable: "Import jest chwilowo niedostępny. Skontaktuj się z obsługą.",
    migration_snapshot_expired:
      "Podgląd źródłowy wygasł. Dodaj brakujące zdjęcia ręcznie w edytorze studia.",
    migration_unavailable: "Import jest obecnie niedostępny. Spróbuj później.",
    migration_revision_conflict:
      "Dane zmieniły się w innej karcie. Odświeżono podgląd — sprawdź wybór ponownie.",
    migration_review_required: "Przed importem rozwiąż wskazane uwagi lub pomiń te rekordy.",
    migration_not_found: "Nie znaleziono importu na tym koncie.",
    migration_not_completed: "Poczekaj na zakończenie importu.",
    capacity_review_required:
      "Sprawdź limity miejsc i potwierdź, że rezerwacje z Fitssey nie zostały przeniesione.",
    studio_review_required: "Uzupełnij nazwę i walutę w profilu studia.",
    phone_verification_required: "Potwierdź numer telefonu przed publikacją studia.",
  };
  return {
    code: value.code,
    message: messages[value.code ?? ""] ?? "Nie udało się zapisać zmiany. Spróbuj ponownie.",
    issues: value.issues ?? [],
  };
}
