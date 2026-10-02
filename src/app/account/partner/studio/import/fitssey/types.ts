export type RecordKind = "location" | "member" | "class" | "pass" | "session";
export type Value = string | number | boolean | null | Value[] | { [key: string]: Value };
export interface ImportRecord {
  id: string;
  kind: RecordKind;
  source_id: string;
  name: string;
  data: Record<string, Value>;
  overrides: Record<string, Value>;
  selected: boolean;
  issues: string[];
  targets: Record<string, Value>;
  asset_state: string;
  image_id: string | null;
}
export interface ImportJob {
  id: string;
  source_uuid: string;
  state:
    | "analyzing"
    | "review"
    | "importing"
    | "completed"
    | "failed"
    | "reconnect_required"
    | "cancelled"
    | "expired";
  stage: string;
  revision: number;
  scope: Record<string, Value>;
  error_code: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
  counts: Partial<Record<RecordKind, number>>;
  asset_failed_count: number;
  imported_count: number;
  selected_count: number;
  next_run_at: string | null;
  branches: ImportRecord[];
}
export interface RecordPage {
  total: number;
  items: ImportRecord[];
}
export interface ReviewIssue {
  record_id?: string;
  name?: string;
  code: string;
}
export const kinds: { key: RecordKind; label: string }[] = [
  { key: "location", label: "Lokalizacje" },
  { key: "member", label: "Zespół" },
  { key: "class", label: "Zajęcia" },
  { key: "pass", label: "Karnety" },
  { key: "session", label: "Grafik" },
];
export const issueLabels: Record<string, string> = {
  source_identifier_missing: "Brak identyfikatora w Fitssey — pomiń rekord i popraw go u źródła",
  conflicting_source_record: "Fitssey zwróciło sprzeczne dane — odśwież podgląd lub pomiń rekord",
  name_required: "Uzupełnij nazwę",
  currency_required: "Potwierdź walutę",
  duration_required: "Uzupełnij czas trwania",
  unsupported_service: "Ten typ usługi nie jest obsługiwany — pomiń go",
  invalid_color: "Wybierz kolor z palety",
  allowance_review_required: "Potwierdź liczbę wejść",
  validity_review_required: "Potwierdź zasady ważności",
  invalid_session_time: "Nieprawidłowa data lub godzina",
  location_required: "Wybierz lokalizację",
  class_required: "Wybierz zajęcia",
  primary_instructor_required: "Wybierz prowadzącego",
  dependency_excluded: "Zaznacz powiązane zajęcia, lokalizację lub prowadzącego, albo pomiń termin",
  unavailable_session: "Termin ukryty lub odwołany — pomiń go",
  invalid_capacity: "Sprawdź limit miejsc",
  source_record_removed: "Rekord zniknął z Fitssey — pomiń go",
  select_location: "Zaznacz przynajmniej jedną lokalizację",
  pass_branch_required: "Przypisz karnet do zaznaczonej lokalizacji",
};
