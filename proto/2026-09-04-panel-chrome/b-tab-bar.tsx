"use client";

import { StatusChip } from "@/components/b2b/StatusChip";
import { usePartnerCapabilities } from "@/context/PartnerCapabilitiesContext";
import { useAuth } from "@/context/AuthContext";

/**
 * Reads both injected contexts directly, so the wrapper's effect is visible rather than inferred.
 *
 * This variant replaced a `BottomTabBar` one. That component is route-gated —
 * `if (!TAB_PATHS.includes(pathname)) return null` — so at a /proto path it renders nothing at
 * all. Route-gated components are a third portability category alongside "portable" and "needs
 * the wrapper"; see src/app/proto/lib/PORTABILITY.md.
 */
export default function ContextProbe() {
  const { user, loading } = useAuth();
  const { capabilities, isLoading } = usePartnerCapabilities();

  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-h-small text-gray-900">Konteksty z danych testowych</p>

      <div className="flex flex-col gap-2 rounded-b2b border border-gray-200 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-gray-600">useAuth</span>
          <StatusChip tone={loading ? "amber" : "green"}>
            {loading ? "ładowanie" : "gotowe"}
          </StatusChip>
        </div>
        <p className="text-sm text-gray-900">{user?.name}</p>
        <p className="text-xs text-gray-500">{user?.email}</p>
      </div>

      <div className="flex flex-col gap-2 rounded-b2b border border-gray-200 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-gray-600">usePartnerCapabilities</span>
          <StatusChip tone={isLoading ? "amber" : "green"}>
            {isLoading ? "ładowanie" : "gotowe"}
          </StatusChip>
        </div>
        {capabilities?.managedStudios.map((s) => (
          <p key={s.id} className="text-sm text-gray-900">
            {s.name}
          </p>
        ))}
        <p className="text-xs text-gray-500">
          Zakładka startowa: {capabilities?.landingTab}
        </p>
      </div>
    </div>
  );
}
