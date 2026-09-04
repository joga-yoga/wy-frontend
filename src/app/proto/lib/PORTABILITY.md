# What renders in the workbench, and what doesn't

Written by `.plans/proto-workbench/` T05, in answer to the brief's §0.5. Four categories, in
descending order of how much they cost you.

## 1. Portable as-is — no wrapper, no thought

Everything in `src/components/ui/*` (27 shadcn primitives) and `src/components/b2b/*`
(`StatusChip`, `PassCard`, `ClientVisitRow`, `SessionContextCard`, `PinnedFooter`, `InfoNote`,
`StudioLogoTile`). No context, no `axiosInstance`. This is the large majority of what prototypes
need, and it is why the workbench was cheap to build.

## 2. Needs the fixture wrapper — automatic in `system` mode

Components reading `useAuth`, `usePartnerCapabilities`, the PageHeader hooks, `useNavigationBlocker`
or `useOfferCreateMenu`. The frame wraps every `system`-mode prototype in `FixtureProviders`, which
mirrors `src/app/account/partner/layout.tsx`'s stack exactly:

```
AuthContext → PartnerCapabilitiesContext → NavigationBlocker → OfferCreateMenu → PageHeader
```

Known members: `layout/Header`, `layout/DashboardTopBar`, `layout/BottomTabBar`,
`instructors/InstructorModal`, `page-contents/studio/StudioPageContent`,
`page-contents/instructor/components/InstructorContactDrawer`, `cookies/CookieConsentManager`,
`custom/SsoCallbackPage`.

**The list is not authoritative and does not need to be.** It was assembled by grep and it missed
`useNavigationBlocker` entirely — `DashboardTopBar` found that for us by throwing inside its frame.
That is the intended workflow: render it, read the inline error, add the provider to the one
wrapper. Do **not** add a second wrapper or a per-component shim.

## 2b. Interactive components need `"use client"` in the *variant* file

A variant that renders a product component taking event handlers — `GrafikSessionCard`, anything
built on `SessionCardBase` with an `onClick` — must start with `"use client"`. Without it Next
throws:

```
Event handlers cannot be passed to Client Component props
```

and the variant renders as an error card rather than the screen you were comparing. The frame does
not add the directive for you, because most variants are static and do not need it.

Found while building a `system`-mode control from the real `GrafikSessionCard`. Cheap to fix, and
completely opaque if you have not seen it before.

## 3. Calls the API directly — renders, but sees nothing

Around 17 shared components call `axiosInstance` inside an effect, which no provider can intercept:
`common/AddressAutocompleteField`, `common/YogaStyleChips`, `inbox/NotificationsBell`,
`instructors/InstructorSelector`, `layout/HeaderAvatar`, `locations/LocationModal`,
`menu/StudioWorkspaceRows`, `partner/PhoneVerificationForm`, the `*-cta` page contents, and others.

`FixtureProviders` **blocks every outbound request** while a prototype is mounted and logs the
blocked URL. So these components render their empty or error state rather than silently reading
production data — which would make screenshots non-deterministic and design decisions untrustworthy.

A blocked call in the console is a finding: if the screen genuinely needs that data, add it to
`src/fixtures/` and pass it in as a prop. Do not unblock the network.

## 4. Route-gated — renders nothing at a `/proto` path

Some components return `null` unless `usePathname()` matches one of their own routes.
`BottomTabBar` is the clear case: `if (!TAB_PATHS.includes(pathname)) return null`. It mounts
without error and draws nothing.

There is no fix worth having. Faking the pathname would mean lying to `usePathname` for every
prototype, and the components in this category are navigation chrome — the least interesting thing
to prototype. Rebuild the relevant piece inside the prototype instead, or prototype the screen
rather than the chrome.
