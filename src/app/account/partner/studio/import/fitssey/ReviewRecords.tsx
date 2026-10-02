"use client";
import { AlertTriangle, CalendarDays, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { importError, importsApi } from "./api";
import { RecordEditor } from "./RecordEditor";
import {
  type ImportJob,
  type ImportRecord,
  issueLabels,
  kinds,
  type RecordKind,
  type RecordPage,
  type Value,
} from "./types";

export function ReviewRecords({
  job,
  onJob,
  refresh,
  readOnly = false,
}: {
  job: ImportJob;
  onJob: (job: ImportJob) => void;
  refresh: () => Promise<ImportJob | null>;
  readOnly?: boolean;
}) {
  const latest = useRef(0);
  const invalidate = useCallback(() => {
    latest.current++;
  }, []);
  const [kind, setKind] = useState<RecordKind>("location");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [page, setPage] = useState<RecordPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<ImportRecord | null>(null);
  const [agenda, setAgenda] = useState("agenda");
  const [day, setDay] = useState("");
  const load = useCallback(async () => {
    const request = ++latest.current;
    setLoading(true);
    try {
      const next = await importsApi.records(job.id, kind, search, offset, day || undefined);
      if (request === latest.current) setPage(next);
    } catch (error) {
      if (request === latest.current) setError(importError(error).message);
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, [job.id, kind, search, offset, day]);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) void load();
    }, 200);
    return () => {
      active = false;
      invalidate();
      clearTimeout(timer);
    };
  }, [load, job.revision, invalidate]);
  async function save(
    record: ImportRecord,
    changes: { selected?: boolean; overrides?: Record<string, Value> },
  ) {
    setBusy(true);
    setError("");
    if (changes.selected !== undefined)
      setPage((previous) =>
        previous
          ? {
              ...previous,
              items: previous.items.map((item) =>
                item.id === record.id ? { ...item, selected: changes.selected! } : item,
              ),
            }
          : previous,
      );
    try {
      onJob(await importsApi.edit(job.id, job.revision, { id: record.id, ...changes }));
      setEditor(null);
      await load();
    } catch (error) {
      setError(importError(error).message);
      await refresh();
      await load();
    } finally {
      setBusy(false);
    }
  }
  const shown = page?.items ?? [];
  return (
    <section className="space-y-4">
      <nav aria-label="Dane do przeniesienia" className="flex gap-2 overflow-x-auto pb-1">
        {kinds.map((item) => (
          <Button
            key={item.key}
            variant={kind === item.key ? "green" : "outline"}
            aria-current={kind === item.key ? "step" : undefined}
            onClick={() => {
              setKind(item.key);
              setOffset(0);
              setSearch("");
              setDay("");
            }}
          >
            {item.label} <span className="text-xs">{job.counts[item.key] ?? 0}</span>
          </Button>
        ))}
      </nav>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-3 size-4 text-gray-400" />
          <Input
            className="pl-9"
            aria-label="Szukaj rekordów"
            placeholder="Szukaj po nazwie"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
          />
        </div>
        {kind === "session" && (
          <ToggleGroup
            type="single"
            value={agenda}
            onValueChange={(value) => {
              if (value) setAgenda(value);
            }}
            aria-label="Widok grafiku"
          >
            <ToggleGroupItem value="agenda">Lista</ToggleGroupItem>
            <ToggleGroupItem value="day">
              <CalendarDays size={16} />
              Dzień
            </ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>
      {kind === "session" && agenda === "day" && (
        <div className="space-y-2">
          <label htmlFor="schedule-day" className="text-sm font-medium">
            Dzień grafiku
          </label>
          <Input
            id="schedule-day"
            type="date"
            min={String(job.scope.start_date)}
            max={String(job.scope.end_date)}
            value={day}
            onChange={(e) => {
              setDay(e.target.value);
              setOffset(0);
            }}
          />
          <p className="text-xs text-gray-500">
            Terminy dla wybranego dnia, w strefie Europe/Warsaw.
          </p>
        </div>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {kind === "location" && (
        <p className="text-sm text-gray-600">
          Każda zaznaczona lokalizacja utworzy nowe studio ze swoimi salami. Potwierdź walutę w
          szczegółach.
        </p>
      )}
      {kind === "member" && (
        <p className="text-sm text-gray-600">
          Powstaną profile zespołu do edycji. Nikt nie otrzyma zaproszenia ani dostępu do konta.
        </p>
      )}
      {kind === "pass" && (
        <p className="text-sm text-gray-600">
          Domyślnie kopiujemy produkty do zaznaczonych lokalizacji. Sprawdź liczbę wejść i okres
          ważności przed publikacją studia.
        </p>
      )}
      {loading ? (
        <p role="status" className="py-8 text-center text-gray-500">
          Wczytywanie danych…
        </p>
      ) : shown.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Brak rekordów w tym widoku</EmptyTitle>
            <EmptyDescription>Zmień wyszukiwanie, datę lub kategorię.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className={kind === "session" ? "space-y-3" : "grid gap-3 sm:grid-cols-2"}>
          {shown.map((record) => {
            const data = { ...record.data, ...record.overrides };
            return (
              <Card key={record.id} className={!record.selected ? "opacity-70" : ""}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`select-${record.id}`}
                      aria-label={`Przenieś: ${String(data.name || record.name)}`}
                      checked={record.selected}
                      disabled={busy || readOnly}
                      onCheckedChange={(value) => void save(record, { selected: value === true })}
                    />
                    <div className="min-w-0 flex-1">
                      <label htmlFor={`select-${record.id}`} className="block font-semibold">
                        {String(data.name || record.name)}
                      </label>
                      <Badge variant="outline" className="mt-1">
                        {Object.keys(record.targets).length
                          ? "Przeniesiono"
                          : record.selected
                            ? "Do importu"
                            : "Pominięto"}
                      </Badge>
                    </div>
                  </div>
                  {typeof data.description === "string" && data.description && (
                    <p className="line-clamp-3 text-sm text-gray-600">{data.description}</p>
                  )}
                  {record.kind === "location" && (
                    <p className="text-sm text-gray-500">
                      {String(data.address ?? "")} {String(data.city ?? "")} ·{" "}
                      {Array.isArray(data.rooms) ? data.rooms.length : 0} sal ·{" "}
                      {String(data.currency ?? "potwierdź walutę")}
                    </p>
                  )}
                  {record.kind === "class" && (
                    <p className="text-sm text-gray-500">
                      {data.duration_minutes
                        ? `${data.duration_minutes} min`
                        : "Uzupełnij czas trwania"}
                    </p>
                  )}
                  {record.kind === "pass" && (
                    <p className="text-sm">
                      {String(data.price ?? "—")} {String(data.currency ?? "waluta studia")}
                    </p>
                  )}
                  {record.kind === "session" && data.starts_at && (
                    <p className="text-sm">
                      {new Date(String(data.starts_at)).toLocaleString("pl-PL", {
                        timeZone: String(job.scope.timezone || "Europe/Warsaw"),
                      })}{" "}
                      –{" "}
                      {new Date(String(data.ends_at)).toLocaleTimeString("pl-PL", {
                        timeZone: String(job.scope.timezone || "Europe/Warsaw"),
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {Number.isFinite(
                        Date.parse(String(data.ends_at)) - Date.parse(String(data.starts_at)),
                      ) && (
                        <>
                          {" "}
                          ·{" "}
                          {Math.round(
                            (Date.parse(String(data.ends_at)) -
                              Date.parse(String(data.starts_at))) /
                              60000,
                          )}{" "}
                          min
                        </>
                      )}
                      <span className="block text-gray-500">
                        Limit: {String(data.capacity ?? "nie podano")} ·{" "}
                        {data.bookable
                          ? "Źródło pozwala na rezerwacje"
                          : "Źródło wyłączyło rezerwacje"}
                      </span>
                    </p>
                  )}
                  {record.issues.length > 0 && (
                    <div className="flex gap-2 text-sm text-amber-800">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                      <ul>
                        {record.issues.map((issue) => (
                          <li key={issue}>{issueLabels[issue] ?? "Sprawdź dane"}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {record.asset_state === "failed" && (
                    <p className="text-sm text-amber-800">Zdjęcie nie zostało przeniesione.</p>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setEditor(record)}>
                    {readOnly ? "Zobacz dane źródłowe" : "Sprawdź i popraw"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {page && page.total > 30 && (
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            disabled={offset === 0 || busy}
            onClick={() => setOffset((value) => Math.max(0, value - 30))}
          >
            Poprzednia
          </Button>
          <span className="text-sm text-gray-500">
            {offset + 1}–{Math.min(offset + 30, page.total)} z {page.total}
          </span>
          <Button
            variant="outline"
            disabled={offset + 30 >= page.total || busy}
            onClick={() => setOffset((value) => value + 30)}
          >
            Następna
          </Button>
        </div>
      )}
      <RecordEditor
        jobId={job.id}
        record={editor}
        branches={job.branches}
        readOnly={readOnly}
        onClose={() => setEditor(null)}
        onSave={(overrides) => (editor ? save(editor, { overrides }) : Promise.resolve())}
        busy={busy}
      />
    </section>
  );
}
