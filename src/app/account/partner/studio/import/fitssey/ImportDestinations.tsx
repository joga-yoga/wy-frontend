"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { StudioCandidate } from "@/components/studio-cta/StudioDiscovery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { axiosInstance } from "@/lib/axiosInstance";
import { readSetup, writeSetup } from "@/lib/studioSetup";

import { draftFormValues, type StudioDraftProfile } from "../../[studioId]/edit/studioDraftPrefill";
import { buildStudioPayload, emptyStudioFormValues } from "../../[studioId]/edit/studioFormModel";
import { importsApi } from "./api";
import type { ImportJob, ImportRecord, Value } from "./types";

export type DestinationProblem = {
  code?: string;
  record_id?: string;
  fingerprint?: string;
  matches?: StudioCandidate[];
  rooms?: { id: string; name: string }[];
  configuration?: { kind: "pass" | "class"; name: string }[];
  job_id?: string;
};
export function ImportDestinations({
  job,
  onChange,
  problem,
  onReady,
}: {
  onReady: (ready: boolean) => void;
  job: ImportJob;
  onChange: (job: ImportJob) => void;
  problem: DestinationProblem | null;
}) {
  const params = useSearchParams();
  const { user } = useAuth();
  const initialized = useRef(false);
  const [error, setError] = useState("");
  const studioId = params.get("studioId") || job.origin_studio_id;
  const draft = params.get("draft");
  const setup = params.get("setup") || draft;
  const importBranch = params.get("importBranch");
  const [contextPending, setContextPending] = useState(Boolean(studioId || draft || setup));
  useEffect(() => {
    const selected = job.branches.filter((branch) => branch.selected);
    const needsContext = Boolean(studioId || draft || setup);
    onReady(
      !contextPending &&
        (!needsContext ||
          (selected.length > 0 &&
            selected.every((branch) => Object.keys(branch.destination || {}).length > 0))),
    );
  }, [job.branches, studioId, draft, setup, onReady, contextPending]);
  useEffect(() => {
    if (initialized.current || job.state !== "review" || !user?.id) return;
    const branch = importBranch
      ? job.branches.find((item) => item.id === importBranch && item.selected)
      : job.branches.length === 1
        ? job.branches[0]
        : undefined;
    if (!branch) {
      setContextPending(false);
      return;
    }
    initialized.current = true;
    const saved = setup ? readSetup(setup, user?.id || "") : null;
    if (Object.keys(branch.destination || {}).length && !saved?.values && !studioId) {
      setContextPending(false);
      return;
    }
    const explicitTarget =
      branch.destination?.identity ||
      branch.destination?.draft_token ||
      branch.destination?.new_studio;
    const returnedStudio = importBranch && params.get("studioId");
    const destination: Record<string, Value> = returnedStudio
      ? { studio_id: returnedStudio }
      : branch.destination?.studio_id
        ? branch.destination
        : studioId && !explicitTarget
          ? { studio_id: studioId }
          : {
              ...branch.destination,
              ...(draft && !explicitTarget ? { draft_token: draft } : {}),
              ...(saved?.identity && !explicitTarget ? { identity: saved.identity } : {}),
              ...(saved?.values
                ? { profile: JSON.parse(JSON.stringify(buildStudioPayload(saved.values))) as Value }
                : {}),
              ...(saved?.city ? { city: saved.city } : {}),
              ...(saved?.duplicateAck ? { duplicate_ack: saved.duplicateAck } : {}),
            };
    if (
      !Object.keys(destination).length ||
      JSON.stringify(destination) === JSON.stringify(branch.destination)
    ) {
      setContextPending(false);
      return;
    }
    setContextPending(true);
    importsApi
      .edit(job.id, job.revision, { id: branch.id, destination })
      .then((updated) => {
        onChange(updated);
        setContextPending(false);
      })
      .catch(() => {
        initialized.current = false;
        setError("Nie udało się ustawić studia docelowego. Wybierz je poniżej.");
      });
  }, [job, studioId, draft, setup, importBranch, onChange, user?.id, params]);
  return (
    <section className="space-y-3" aria-label="Studia docelowe">
      {job.branches
        .filter((branch) => branch.selected)
        .map((branch) => (
          <EditorLink
            key={branch.id}
            job={job}
            branch={branch}
            studioId={job.branches.length === 1 || importBranch === branch.id ? studioId : null}
            setup={job.branches.length === 1 || importBranch === branch.id ? setup : null}
            draft={job.branches.length === 1 || importBranch === branch.id ? draft : null}
            ownerId={user?.id || ""}
          />
        ))}
      {error && <p role="alert">{error}</p>}
      {problem?.job_id && (
        <Link
          className="underline"
          href={`/account/partner/studio/import/fitssey/${problem.job_id}`}
        >
          Otwórz zapisany wynik importu
        </Link>
      )}
      {job.branches
        .filter((b) => b.selected)
        .map((branch) => (
          <DestinationRow
            key={branch.id}
            branch={branch}
            job={job}
            onChange={onChange}
            problem={!problem?.record_id || problem.record_id === branch.id ? problem : null}
          />
        ))}
    </section>
  );
}

/** Carry only supported profile fields into the existing, account-scoped editor session. */
function EditorLink({
  job,
  branch,
  studioId,
  setup,
  draft,
  ownerId,
}: {
  job: ImportJob;
  branch: ImportRecord;
  studioId: string | null;
  setup: string | null;
  draft: string | null;
  ownerId: string;
}) {
  const singleBranch = job.branches.length === 1;
  const explicitTarget =
    branch.destination?.identity ||
    branch.destination?.draft_token ||
    branch.destination?.new_studio;
  const target =
    branch.destination?.studio_id || branch.targets.studio_id || (!explicitTarget && studioId);
  const key = setup || `import:${job.id}:${branch.id}`;
  const query = new URLSearchParams({
    step: "manual",
    setup: key,
    importJob: job.id,
    importBranch: branch.id,
  });
  const token = branch.destination?.draft_token || (!explicitTarget && draft);
  if (typeof token === "string") query.set("draft", token);
  const href =
    typeof target === "string"
      ? `/account/partner/studio/${encodeURIComponent(target)}/edit?${query}`
      : `/account/partner/studio/create?${query}`;
  function preservePreview() {
    if (target) return;
    const saved = readSetup(key, ownerId);
    const source = { ...branch.data, ...branch.overrides };
    const profile: StudioDraftProfile = {};
    for (const field of ["name", "description", "address", "currency"] as const) {
      if (typeof source[field] === "string") profile[field] = source[field];
    }
    const chosen = branch.destination?.identity;
    const identity =
      chosen &&
      typeof chosen === "object" &&
      !Array.isArray(chosen) &&
      (chosen.kind === "studio" || chosen.kind === "directory") &&
      typeof chosen.id === "string"
        ? ({ kind: chosen.kind, id: chosen.id } as const)
        : undefined;
    writeSetup(
      key,
      {
        ...saved,
        operationKey: saved?.operationKey || crypto.randomUUID(),
        values: saved?.values || { ...emptyStudioFormValues, ...draftFormValues(profile) },
        identity: explicitTarget ? identity : saved?.identity,
        city: saved?.city || (typeof source.city === "string" ? source.city : undefined),
      },
      ownerId,
    );
  }
  return (
    <Link className="block text-sm underline" href={href} onClick={preservePreview}>
      {singleBranch ? "Wróć do edycji studia" : `Edytuj studio: ${branch.name}`}
    </Link>
  );
}
function DestinationRow({
  branch,
  job,
  onChange,
  problem,
}: {
  branch: ImportRecord;
  job: ImportJob;
  onChange: (job: ImportJob) => void;
  problem: DestinationProblem | null;
}) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<StudioCandidate[]>([]);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [targetName, setTargetName] = useState("");
  const destination = branch.destination || {};
  const [suggestion, setSuggestion] = useState<DestinationProblem | null>(null);
  const data = { ...branch.data, ...branch.overrides };
  useEffect(() => {
    if (destination.studio_id || destination.identity || destination.draft_token) {
      setSuggestion(null);
      return;
    }
    if (!data.name || !(data.address || data.city)) return;
    const controller = new AbortController();
    axiosInstance
      .post<DestinationProblem & { requires_choice: boolean }>(
        "/studio-setup/duplicates",
        {
          name: data.name,
          address: data.address,
          city: data.city,
        },
        { signal: controller.signal },
      )
      .then(({ data: result }) => {
        if (!controller.signal.aborted)
          setSuggestion(
            result.requires_choice && result.fingerprint !== destination.duplicate_ack
              ? result
              : null,
          );
      })
      .catch(() => {
        /* Final import rechecks candidates inside its transaction. */
      });
    return () => controller.abort();
  }, [
    data.name,
    data.address,
    data.city,
    destination.studio_id,
    destination.identity,
    destination.draft_token,
    destination.duplicate_ack,
  ]);
  const issue = problem || suggestion;
  useEffect(() => {
    if (typeof destination.studio_id !== "string") return;
    axiosInstance
      .get<{ name: string }>(`/studios/${destination.studio_id}`)
      .then(({ data }) => setTargetName(data.name))
      .catch(() => setError("Nie udało się wczytać studia docelowego."));
  }, [destination.studio_id]);
  useEffect(() => {
    if (query.trim().length < 3) {
      setMatches([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      axiosInstance
        .get<StudioCandidate[]>("/studio-setup/search", {
          params: { q: query },
          signal: controller.signal,
        })
        .then(({ data }) => setMatches(data))
        .catch(() => {
          if (!controller.signal.aborted) setError("Nie udało się wyszukać studia.");
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  async function choose(next: Record<string, Value>) {
    setBusy(true);
    setError("");
    try {
      onChange(await importsApi.edit(job.id, job.revision, { id: branch.id, destination: next }));
      setEditing(false);
    } catch {
      setError("Nie udało się zapisać wyboru. Odśwież podgląd i spróbuj ponownie.");
    } finally {
      setBusy(false);
    }
  }
  const candidates = issue?.matches || matches;
  return (
    <div className="rounded-xl border p-4">
      <p className="font-medium">{branch.name}</p>
      <p>
        Import do:{" "}
        {targetName ||
          (destination.draft_token || destination.identity ? "wybranego studia" : "nowego studia")}
      </p>
      <Button type="button" variant="ghost" disabled={busy} onClick={() => setEditing(!editing)}>
        Zmień
      </Button>
      {(editing || issue?.matches) && (
        <div className="space-y-2">
          {issue?.matches?.length === 0 && (
            <p>Sprawdź nazwę i adres lub potwierdź osobną lokalizację.</p>
          )}
          <label>
            Nazwa studia
            <Input value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          {candidates.map((item) => (
            <div key={`${item.kind}:${item.id}`}>
              <p>
                {item.name} · {item.city} · {item.address}
              </p>
              {item.action === "managed" ? (
                <p>Profil jest już zarządzany</p>
              ) : (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void choose(
                      item.action === "edit"
                        ? { studio_id: item.id }
                        : { identity: { kind: item.kind, id: item.id } },
                    )
                  }
                >
                  To moje studio
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              void choose({
                new_studio: true,
                ...(issue?.fingerprint ? { duplicate_ack: issue.fingerprint } : {}),
              })
            }
          >
            {issue?.matches ? "To inne studio" : "Dodaj inną lokalizację"}
          </Button>
        </div>
      )}
      {issue?.rooms && (
        <div className="space-y-2">
          <p>Wybierz istniejącą salę lub dodaj osobną.</p>
          {Array.isArray(branch.data.rooms) &&
            branch.data.rooms.map((room) => {
              if (!room || typeof room !== "object" || Array.isArray(room)) return null;
              const sourceId = String(room.id);
              return (
                <label className="block" key={sourceId}>
                  {String(room.name)}
                  <select
                    className="ml-2 rounded border p-2"
                    defaultValue=""
                    onChange={(e) => {
                      const mapping =
                        destination.rooms &&
                        typeof destination.rooms === "object" &&
                        !Array.isArray(destination.rooms)
                          ? destination.rooms
                          : {};
                      void choose({
                        ...destination,
                        rooms: { ...mapping, [sourceId]: e.target.value },
                      });
                    }}
                  >
                    <option value="" disabled>
                      Wybierz salę
                    </option>
                    {issue.rooms?.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
          <Button
            variant="outline"
            onClick={() => void choose({ ...destination, add_separate_rooms: true })}
          >
            Dodaj osobne sale
          </Button>
        </div>
      )}
      {issue?.configuration && !destination.add_separate_configuration && (
        <div className="space-y-2">
          <p>
            W studiu są już podobne pozycje. Pomiń je w wyborze danych lub potwierdź dodanie
            osobnych.
          </p>
          <ul>
            {issue.configuration.map((item, index) => (
              <li key={`${item.kind}:${index}`}>
                {item.kind === "pass" ? "Definicja karnetu" : "Zajęcia"}: {item.name}
              </li>
            ))}
          </ul>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => void choose({ ...destination, add_separate_configuration: true })}
          >
            Dodaj osobne pozycje
          </Button>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
