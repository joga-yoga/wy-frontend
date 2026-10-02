"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { axiosInstance } from "@/lib/axiosInstance";

import { importsApi } from "./api";
import { type ImportRecord, issueLabels, type RecordKind, type Value } from "./types";

function ReferenceField({
  jobId,
  kind,
  label,
  value,
  onChange,
}: {
  jobId: string;
  kind: RecordKind;
  label: string;
  value: Value | undefined;
  onChange: (value: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [choices, setChoices] = useState<ImportRecord[]>([]);
  useEffect(() => {
    let current = true;
    const timer = setTimeout(() => {
      Promise.all([
        importsApi.records(jobId, kind, search, 0),
        typeof value === "string" && value
          ? importsApi.records(jobId, kind, value, 0)
          : Promise.resolve({ total: 0, items: [] }),
      ])
        .then(([page, selected]) => {
          if (current)
            setChoices([
              ...page.items,
              ...selected.items.filter(
                (item) => !page.items.some((existing) => existing.id === item.id),
              ),
            ]);
        })
        .catch(() => {});
    }, 200);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [jobId, kind, search, value]);
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Input
        aria-label={`Szukaj: ${label}`}
        placeholder="Szukaj po nazwie"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Select value={typeof value === "string" ? value : ""} onValueChange={onChange}>
        <SelectTrigger aria-label={label}>
          <SelectValue placeholder="Wybierz rekord" />
        </SelectTrigger>
        <SelectContent>
          {choices.map((record) => (
            <SelectItem key={record.id} value={record.source_id}>
              {record.name}
              {record.selected ? "" : " (pominięty)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldDescription>
        {choices.length === 30 ? "Zawęź wyszukiwanie, aby znaleźć dalsze rekordy. " : ""}Powiązany
        rekord musi być zaznaczony do importu.
      </FieldDescription>
    </Field>
  );
}

export function RecordEditor({
  record,
  jobId,
  branches,
  readOnly = false,
  onClose,
  onSave,
  busy,
}: {
  record: ImportRecord | null;
  jobId: string;
  branches: ImportRecord[];
  readOnly?: boolean;
  onClose: () => void;
  onSave: (overrides: Record<string, Value>) => Promise<void>;
  busy: boolean;
}) {
  const photoRequest = useRef(0);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  useEffect(() => {
    photoRequest.current++;
    setPhoto(null);
    setPhotoBusy(false);
    setPhotoError("");
  }, [record?.id]);
  useEffect(
    () => () => {
      if (photo) URL.revokeObjectURL(photo);
    },
    [photo],
  );
  async function loadPhoto() {
    if (!record) return;
    const generation = ++photoRequest.current;
    setPhotoBusy(true);
    try {
      const response = await axiosInstance.get<Blob>(
        `/studio-migrations/${jobId}/records/${record.id}/image`,
        { responseType: "blob" },
      );
      if (generation === photoRequest.current) setPhoto(URL.createObjectURL(response.data));
    } catch {
      if (generation === photoRequest.current)
        setPhotoError("Nie udało się wczytać zdjęcia. Możesz dodać je później w edytorze.");
    } finally {
      if (generation === photoRequest.current) setPhotoBusy(false);
    }
  }
  const [values, setValues] = useState<Record<string, Value>>({});
  useEffect(() => {
    setValues(record ? { ...record.data, ...record.overrides } : {});
  }, [record]);
  const set = (field: string, value: Value) =>
    setValues((previous) => ({ ...previous, [field]: value }));
  const text = (field: string) =>
    typeof values[field] === "string" ? (values[field] as string) : "";
  const stringField = (field: string, label: string) => (
    <Field key={field}>
      <FieldLabel htmlFor={`edit-${field}`}>{label}</FieldLabel>
      <Input
        id={`edit-${field}`}
        value={text(field)}
        onChange={(e) => set(field, e.target.value)}
      />
    </Field>
  );
  const numberField = (field: string, label: string) => (
    <Field key={field}>
      <FieldLabel htmlFor={`edit-${field}`}>{label}</FieldLabel>
      <Input
        id={`edit-${field}`}
        type="number"
        min={1}
        value={typeof values[field] === "number" ? (values[field] as number) : ""}
        onChange={(e) => set(field, e.target.value ? Number(e.target.value) : null)}
      />
    </Field>
  );
  const check = (field: string, label: string) => (
    <Field orientation="horizontal" key={field}>
      <Checkbox
        id={`edit-${field}`}
        checked={values[field] === true}
        onCheckedChange={(value) => set(field, value === true)}
      />
      <FieldLabel htmlFor={`edit-${field}`}>{label}</FieldLabel>
    </Field>
  );
  const fields: Record<RecordKind, string[]> = {
    location: ["name", "description", "currency", "address", "city"],
    member: ["name", "description"],
    class: ["name", "description", "duration_minutes", "color", "level"],
    pass: [
      "name",
      "description",
      "currency",
      "session_count",
      "unlimited",
      "duration_days",
      "branch_ids",
    ],
    session: ["primary_member", "location_id", "class_id", "room_id"],
  };
  async function save() {
    if (!record) return;
    const changes: Record<string, Value> = {};
    for (const field of fields[record.kind])
      if (
        JSON.stringify(values[field]) !==
        JSON.stringify({ ...record.data, ...record.overrides }[field])
      )
        changes[field] = values[field] ?? null;
    await onSave(changes);
  }
  return (
    <Dialog
      open={Boolean(record)}
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{record?.name || "Sprawdź rekord"}</DialogTitle>
          <DialogDescription>
            Sprawdź dane i dopasuj ustawienia przed importem. Zmiany zapiszą się w tym podglądzie.
          </DialogDescription>
        </DialogHeader>
        {record && (
          <>
            {record.data.image_url && (
              <div className="space-y-2">
                {photo ? (
                  <Image
                    unoptimized
                    src={photo}
                    width={400}
                    height={300}
                    alt="Zdjęcie z Fitssey do sprawdzenia"
                    className="max-h-64 w-auto rounded-lg object-contain"
                  />
                ) : (
                  <Button variant="outline" disabled={photoBusy} onClick={() => void loadPhoto()}>
                    {photoBusy ? "Wczytywanie zdjęcia…" : "Zobacz zdjęcie"}
                  </Button>
                )}
                {photoError && (
                  <p role="status" className="text-sm text-amber-800">
                    {photoError}
                  </p>
                )}
              </div>
            )}
            <fieldset disabled={readOnly}>
              <FieldGroup>
                {record.kind !== "session" && stringField("name", "Nazwa")}
                {record.kind !== "session" && (
                  <Field>
                    <FieldLabel htmlFor="edit-description">Opis</FieldLabel>
                    <Textarea
                      id="edit-description"
                      value={text("description")}
                      onChange={(e) => set("description", e.target.value)}
                      rows={4}
                    />
                  </Field>
                )}
                {record.kind === "location" && (
                  <>
                    {stringField("address", "Adres")}
                    {stringField("city", "Miasto")}
                    {stringField("currency", "Waluta (np. PLN)")}
                    <FieldDescription>
                      Nowe studio powstanie z salami tej lokalizacji.
                    </FieldDescription>
                  </>
                )}
                {record.kind === "class" && (
                  <>
                    {numberField("duration_minutes", "Domyślny czas trwania (minuty)")}
                    {stringField("level", "Poziom")}
                    <Field>
                      <FieldLabel>Kolor</FieldLabel>
                      <Select value={text("color")} onValueChange={(value) => set("color", value)}>
                        <SelectTrigger aria-label="Kolor">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            ["green", "Zielony"],
                            ["teal", "Morski"],
                            ["blue", "Niebieski"],
                            ["lavender", "Lawendowy"],
                            ["rose", "Różowy"],
                            ["sand", "Piaskowy"],
                            ["apricot", "Morelowy"],
                          ].map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        Terminy zachowają dokładny czas z Fitssey, nawet jeśli różni się od tego
                        ustawienia.
                      </FieldDescription>
                    </Field>
                  </>
                )}
                {record.kind === "pass" && (
                  <>
                    <Field>
                      <FieldLabel>Lokalizacje karnetu</FieldLabel>
                      {branches
                        .filter((b) => b.selected)
                        .map((branch) => {
                          const selected = Array.isArray(values.branch_ids)
                            ? (values.branch_ids as string[])
                            : branches.filter((b) => b.selected).map((b) => b.source_id);
                          return (
                            <Field key={branch.id} orientation="horizontal">
                              <Checkbox
                                id={`pass-branch-${branch.id}`}
                                checked={selected.includes(branch.source_id)}
                                onCheckedChange={(checked) =>
                                  set(
                                    "branch_ids",
                                    checked
                                      ? [...selected, branch.source_id]
                                      : selected.filter((id) => id !== branch.source_id),
                                  )
                                }
                              />
                              <FieldLabel htmlFor={`pass-branch-${branch.id}`}>
                                {String(branch.overrides.name ?? branch.name)}
                              </FieldLabel>
                            </Field>
                          );
                        })}
                    </Field>
                    <p className="text-sm text-gray-600">
                      Cena: {String(values.price ?? "—")}. Typ w Fitssey:{" "}
                      {String(values.session_type ?? "—")}. Nie przenosimy aktywnych karnetów
                      klientów ani wykorzystanych wejść.
                    </p>
                    {stringField("currency", "Waluta (np. PLN)")}
                    {check("unlimited", "Bez limitu wejść")}
                    {values.unlimited !== true && numberField("session_count", "Liczba wejść")}
                    {numberField("duration_days", "Ważność od zakupu (dni)")}
                    <FieldDescription>
                      Sprawdź liczbę wejść i okres ważności przed publikacją studia. Bezterminowość
                      wymaga zgodnej reguły źródłowej; inne reguły wymagają liczby dni.
                    </FieldDescription>
                  </>
                )}
                {record.kind === "session" && (
                  <>
                    <p className="text-sm">
                      {new Date(String(values.starts_at)).toLocaleString("pl-PL", {
                        timeZone: "Europe/Warsaw",
                      })}{" "}
                      →{" "}
                      {new Date(String(values.ends_at)).toLocaleString("pl-PL", {
                        timeZone: "Europe/Warsaw",
                      })}
                      <br />
                      Limit: {String(values.capacity ?? "nie podano")} ·{" "}
                      {values.bookable
                        ? "Rezerwacje dostępne w Fitssey"
                        : "Rezerwacje wyłączone w Fitssey"}
                    </p>
                    <ReferenceField
                      jobId={jobId}
                      kind="location"
                      label="Lokalizacja"
                      value={values.location_id}
                      onChange={(value) => {
                        set("location_id", value);
                        set("room_id", null);
                      }}
                    />
                    <ReferenceField
                      jobId={jobId}
                      kind="class"
                      label="Zajęcia"
                      value={values.class_id}
                      onChange={(value) => set("class_id", value)}
                    />
                    <ReferenceField
                      jobId={jobId}
                      kind="member"
                      label="Główny prowadzący"
                      value={values.primary_member}
                      onChange={(value) => set("primary_member", value)}
                    />
                    <FieldDescription>
                      Źródłowa sala: {String(values.room_id ?? "brak")}. Zmiana lokalizacji usuwa
                      przypisanie do źródłowej sali; można dodać salę w edytorze grafiku.
                    </FieldDescription>
                  </>
                )}
              </FieldGroup>
            </fieldset>
            {record.issues.length > 0 && (
              <ul className="list-inside list-disc text-sm text-amber-800">
                {record.issues.map((issue) => (
                  <li key={issue}>{issueLabels[issue] ?? "Sprawdź dane"}</li>
                ))}
              </ul>
            )}
            <details className="rounded-lg border p-3 text-sm">
              <summary className="cursor-pointer font-medium">
                Dane z Fitssey i zapisane zmiany
              </summary>
              <dl className="mt-3 space-y-3">
                {Object.entries(record.data)
                  .filter(([key]) =>
                    [
                      "name",
                      "description",
                      "currency",
                      "duration_minutes",
                      "price",
                      "starts_at",
                      "ends_at",
                      "capacity",
                      "address",
                      "city",
                      "level",
                      "session_type",
                      "session_count",
                      "duration_days",
                      "unlimited",
                      "hidden",
                      "cancelled",
                      "bookable",
                    ].includes(key),
                  )
                  .map(([key, value]) => (
                    <div key={key} className="grid gap-1 break-words">
                      <dt className="font-medium">
                        {(
                          {
                            name: "Nazwa",
                            description: "Opis",
                            currency: "Waluta",
                            duration_minutes: "Czas trwania",
                            price: "Cena",
                            starts_at: "Początek",
                            ends_at: "Koniec",
                            capacity: "Limit miejsc",
                            address: "Adres",
                            city: "Miasto",
                            level: "Poziom",
                            session_type: "Typ karnetu",
                            session_count: "Wejścia",
                            duration_days: "Ważność w dniach",
                            unlimited: "Bez limitu",
                            hidden: "Ukryty termin",
                            cancelled: "Odwołany termin",
                            bookable: "Rezerwacje w Fitssey",
                          } as Record<string, string>
                        )[key] ?? key}
                      </dt>
                      <dd className="text-gray-500">
                        Fitssey:{" "}
                        {typeof value === "object" ? JSON.stringify(value) : String(value ?? "—")}
                      </dd>
                      {key in record.overrides && (
                        <dd>WY: {String(record.overrides[key] ?? "—")}</dd>
                      )}
                    </div>
                  ))}
              </dl>
            </details>
            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={busy}>
                Zamknij
              </Button>
              {!readOnly && (
                <Button variant="green" onClick={save} disabled={busy}>
                  {busy ? "Zapisywanie…" : "Zapisz zmiany"}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
