"use client";

import { useEffect, useRef } from "react";

import { axiosInstance } from "@/lib/axiosInstance";

export const CONTACT_PROOF_TIMEOUT_MS = 8_000;

interface ProofWidget extends HTMLElement {
  configure: (options: { challengeurl: string; customfetch: () => Promise<Response> }) => void;
  verify: () => Promise<void>;
  reset: () => void;
}

interface ContactChallenge {
  algorithm: "SHA-256";
  challenge: string;
  maxnumber: number;
  salt: string;
  signature: string;
}

interface ContactProof {
  altcha: string;
  submission_id: string;
  expiresAt: number;
}

async function solveProof(
  host: HTMLDivElement | null,
  submissionId: string,
  signal: AbortSignal,
): Promise<ContactProof> {
  signal.throwIfAborted();
  let widget: ProofWidget | undefined;
  const workers = new Set<Worker>();
  let restoreWorkerFactory: (() => void) | undefined;
  let rejectAbort: (reason: unknown) => void = () => undefined;
  const aborted = new Promise<never>((_, reject) => {
    rejectAbort = reject;
  });
  const onAbort = () => rejectAbort(signal.reason);
  signal.addEventListener("abort", onAbort, { once: true });
  const proof = { altcha: "", expiresAt: 0 };

  const work = async () => {
    // Bundled locally, including the worker. The overall deadline includes import/load.
    await import("altcha");
    signal.throwIfAborted(); // a late import must not resurrect a timed-out widget
    if (!host) throw new Error("Verification unavailable");
    const element = document.createElement("altcha-widget") as ProofWidget;
    widget = element;
    element.setAttribute("auto", "off");
    element.setAttribute("workers", "1");
    element.setAttribute("disablerefetchonexpire", "");
    element.setAttribute("disableautofocus", "");
    element.addEventListener("statechange", (event) => {
      const { state, payload } = (event as CustomEvent<{ state: string; payload?: string }>).detail;
      proof.altcha = state === "verified" && payload ? payload : "";
    });
    const loaded = new Promise<void>((resolve) =>
      element.addEventListener("load", () => resolve(), { once: true }),
    );
    host.appendChild(element);
    await loaded;
    signal.throwIfAborted();
    // ALTCHA's reset only posts an abort message. A stalled worker may never
    // acknowledge it, so also terminate workers owned by this verification.
    const createWorker = globalThis.altchaCreateWorker;
    const trackWorker = (url?: string) => {
      const worker = createWorker(url);
      workers.add(worker);
      return worker;
    };
    globalThis.altchaCreateWorker = trackWorker;
    restoreWorkerFactory = () => {
      if (globalThis.altchaCreateWorker === trackWorker) {
        globalThis.altchaCreateWorker = createWorker;
      }
    };
    element.configure({
      challengeurl: "/utils/contact/challenge",
      customfetch: async () => {
        const response = await axiosInstance.get<ContactChallenge>("/utils/contact/challenge", {
          params: { submission_id: submissionId },
          timeout: CONTACT_PROOF_TIMEOUT_MS,
          signal,
        });
        proof.expiresAt =
          Number(new URLSearchParams(response.data.salt.split("?")[1]).get("expires")) * 1000;
        return new Response(JSON.stringify(response.data), {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        });
      },
    });
    await element.verify();
    signal.throwIfAborted();
    if (!proof.altcha || !proof.expiresAt) throw new Error("Verification failed");
    return { ...proof, submission_id: submissionId };
  };

  try {
    return await Promise.race([work(), aborted]);
  } finally {
    signal.removeEventListener("abort", onAbort);
    try {
      widget?.reset?.();
    } finally {
      restoreWorkerFactory?.();
      for (const worker of workers) worker.terminate();
      widget?.remove();
    }
  }
}

/** One stable message identity survives proof expiry and ambiguous transport failures. */
export function useContactProof() {
  const hostRef = useRef<HTMLDivElement>(null);
  const identityRef = useRef<string | null>(null);
  const proofRef = useRef<ContactProof | null>(null);
  const pendingRef = useRef<Promise<ContactProof> | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const resetProof = () => {
    proofRef.current = null;
    controllerRef.current?.abort();
    controllerRef.current = null;
    pendingRef.current = null;
  };

  const resetSubmission = () => {
    resetProof();
    identityRef.current = null;
  };

  const prepare = (): Promise<ContactProof> => {
    if (proofRef.current && proofRef.current.expiresAt > Date.now() + 1000) {
      return Promise.resolve(proofRef.current);
    }
    if (pendingRef.current) return pendingRef.current;
    identityRef.current ??= crypto.randomUUID();
    const controller = new AbortController();
    controllerRef.current = controller;
    const timer = setTimeout(
      () => controller.abort(new Error("Verification timed out")),
      CONTACT_PROOF_TIMEOUT_MS,
    );
    pendingRef.current = solveProof(hostRef.current, identityRef.current, controller.signal)
      .then((proof) => {
        controller.signal.throwIfAborted();
        proofRef.current = proof;
        return proof;
      })
      .finally(() => {
        clearTimeout(timer);
        if (controllerRef.current === controller) {
          controllerRef.current = null;
          pendingRef.current = null;
        }
      });
    return pendingRef.current;
  };

  return { hostRef, prepare, resetProof, resetSubmission };
}
