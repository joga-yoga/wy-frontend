"use client";

import { useEffect } from "react";

import { NavigationBlockerProvider } from "@/app/account/partner/components/EventForm/block-navigation/navigation-block";
import { AuthContext, type AuthContextType, type User } from "@/context/AuthContext";
import { OfferCreateMenuProvider } from "@/context/OfferCreateMenuContext";
import { PageHeaderProvider } from "@/context/PageHeaderContext";
import {
  PartnerCapabilitiesContext,
  type PartnerCapabilitiesContextValue,
} from "@/context/PartnerCapabilitiesContext";
import { INSTRUCTORS, STUDIO, USERS } from "@/fixtures";
import { axiosInstance } from "@/lib/axiosInstance";

/**
 * The ONE fixture-driven provider wrapper (§0.5).
 *
 * The brief is explicit that context-dependent components are "served by one fixture-driven
 * provider wrapper in the shell — do not build per-component workarounds". If a component needs
 * something this wrapper cannot give, that is a finding to surface, not a second wrapper.
 *
 * It supplies context VALUES directly rather than mounting `AuthProvider` /
 * `PartnerCapabilitiesProvider`, both of which fetch on mount. That is the whole point: a framed
 * prototype must make zero API requests. A prototype that silently falls back to a live backend
 * is exactly the "design decisions made against a lie" failure the brief's §2 is about.
 *
 * Applied for `system` mode ONLY. §4: `reframe` and `blank` prototypes import nothing from the
 * product and therefore cannot use this — they must be self-contained.
 */

const fixtureUser: User = {
  id: USERS.marta.id,
  email: "przemek@bodhi.example.com",
  name: INSTRUCTORS.owner.name,
  image_id: undefined,
  partner: {
    id: "pt-bodhi",
    user_id: USERS.marta.id,
    phone_number: "+48 600 100 200",
    phone_verified: true,
  },
};

// Every mutator throws rather than no-oping. A prototype is a picture of a moment: if one calls
// signOut() the honest answer is "this surface does not exist here", not a silent nothing that
// looks like a bug in the component.
function notInPrototype(name: string): never {
  throw new Error(
    `${name}() was called inside a prototype. The workbench renders fixture data only — ` +
      `there is no session to change. See src/app/proto/lib/FixtureProviders.tsx.`,
  );
}

const authValue: AuthContextType = {
  user: fixtureUser,
  setUser: () => notInPrototype("setUser"),
  loading: false,
  refreshUser: async () => notInPrototype("refreshUser"),
  updateUserFromToken: () => notInPrototype("updateUserFromToken"),
  storeToken: () => notInPrototype("storeToken"),
  signOut: () => notInPrototype("signOut"),
};

const capabilitiesValue: PartnerCapabilitiesContextValue = {
  capabilities: {
    managedStudios: [{ id: STUDIO.id, name: STUDIO.name, image_id: null }],
    teachingStudios: [],
    hasEvents: true,
    hasInstructorProfile: true,
    landingTab: "grafik",
  },
  isLoading: false,
  refetch: () => notInPrototype("refetch"),
};

/**
 * Blocks every outbound API call for as long as a prototype is mounted.
 *
 * Injecting context values is not enough on its own: around 17 shared components call
 * `axiosInstance` DIRECTLY in an effect, and no provider can intercept that. `BottomTabBar` is
 * the proof — with the contexts fixture-fed it still fired `GET /partner/reconciliation` at a
 * live backend. A prototype that quietly reads real data is the "design decisions made against a
 * lie" failure the brief's §2 exists to prevent, and it also makes screenshots non-deterministic.
 *
 * The interceptor is ejected on unmount, so client-side navigation from /proto back into the
 * product restores normal behaviour. `axiosInstance` is a module singleton shared with the
 * product, which is exactly why this must not leak past the prototype's lifetime.
 *
 * A blocked call is a FINDING, not a failure to paper over: the console names the URL so the
 * designer learns this component wants data the fixture layer does not yet provide.
 */
function useBlockedNetwork() {
  useEffect(() => {
    const id = axiosInstance.interceptors.request.use((config) => {
      const url = `${config.method?.toUpperCase() ?? "GET"} ${config.url ?? "?"}`;
      // eslint-disable-next-line no-console
      console.warn(
        `[proto] blocked ${url} — prototypes render fixture data only. If this screen needs ` +
          `that data, add it to src/fixtures/ rather than letting the prototype hit the API.`,
      );
      return Promise.reject(new Error(`[proto] network disabled: ${url}`));
    });
    return () => axiosInstance.interceptors.request.eject(id);
  }, []);
}

export function FixtureProviders({ children }: { children: React.ReactNode }) {
  useBlockedNetwork();

  return (
    <AuthContext.Provider value={authValue}>
      <PartnerCapabilitiesContext.Provider value={capabilitiesValue}>
        {/* Below this line the stack MIRRORS src/app/account/partner/layout.tsx exactly:
            NavigationBlocker > OfferCreateMenu > PageHeader. None of the three fetches — they
            hold local state — so the product's own providers are mounted as-is rather than
            faked. Matching the real nesting is the point: a prototype that renders under a
            different provider tree than production is the silent-drift failure §2 rejects.

            The stack grew here because a prototype told us to. DashboardTopBar failed with
            "useNavigationBlocker must be used within a NavigationBlockerProvider" — a fourth
            context that grepping for the three named ones had missed. */}
        <NavigationBlockerProvider>
          <OfferCreateMenuProvider>
            <PageHeaderProvider>{children}</PageHeaderProvider>
          </OfferCreateMenuProvider>
        </NavigationBlockerProvider>
      </PartnerCapabilitiesContext.Provider>
    </AuthContext.Provider>
  );
}
